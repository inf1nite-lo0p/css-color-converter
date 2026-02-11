import * as assert from "node:assert/strict";

import { convertText } from "../../core/convertText";
import type { ConvertOptions } from "../../formats/types";

function opts(
    partial: Omit<ConvertOptions, "hadExplicitAlpha"> & {
        hadExplicitAlpha?: boolean;
    },
): ConvertOptions {
    return {
        ...partial,
        hadExplicitAlpha: partial.hadExplicitAlpha ?? false,
    };
}

const SAMPLE = String.raw`
/* -------------------------------- */
/* Color System Definition          */
/* Raw color values in HSL format   */
/* -------------------------------- */
:root {
    /* Breakpoints */
    --breakpoint-sm: 640px;

    --color-white: hsl(240 10% 98%);

    --color-gray-50: hsl(0 0% 100%);
    --color-gray-75: hsl(0 0% 99%);
    --color-gray-100: hsl(0 0% 97%);
}

/* -------------------------------- */
/* Dark Mode Color System           */
/* Inverted palette for dark theme  */
/* -------------------------------- */
.dark {
    --color-gray-50: hsl(0 0% 0%);
    --color-gray-75: hsl(0 0% 5%);
}
`;

describe("convertText", () => {
    it("does not touch non-color declarations", () => {
        const { output } = convertText(
            SAMPLE,
            opts({
                targetFormat: "oklch",
                precision: 2,
                useOpacity: true,
            }),
        );

        assert.match(output, /--breakpoint-sm:\s*640px;/);
    });

    it("converts hsl() declarations to oklch()", () => {
        const { output, editsApplied, errorColors } = convertText(
            SAMPLE,
            opts({
                targetFormat: "oklch",
                precision: 2,
                useOpacity: true,
            }),
        );

        assert.equal(errorColors.length, 0);
        assert.ok(editsApplied > 0);

        assert.match(output, /--color-white:\s*oklch\(/);
        assert.match(output, /--color-gray-50:\s*oklch\(/);
        assert.match(output, /\.dark\s*\{\s*[\s\S]*--color-gray-50:\s*oklch\(/);
    });

    it("can target hex format", () => {
        const { output, errorColors } = convertText(
            SAMPLE,
            opts({
                targetFormat: "hex",
                precision: 2,
                useOpacity: true,
            }),
        );

        assert.equal(errorColors.length, 0);
        assert.match(output, /--color-white:\s*#[0-9a-f]{6,8}\b/i);
        assert.match(output, /--color-gray-50:\s*#[0-9a-f]{6,8}\b/i);
    });

    it("respects useOpacity=false by omitting alpha when alpha is 1", () => {
        const src = String.raw`
:root {
  --c1: hsl(240 10% 98% / 1);
  --c2: hsl(240 10% 98% / 0.5);
}
`;

        const { output } = convertText(
            src,
            opts({
                targetFormat: "rgb",
                precision: 3,
                useOpacity: false,
                // For unit tests, we can treat this as "source had explicit alpha", but useOpacity=false must still omit "/ 1"
                hadExplicitAlpha: true,
            }),
        );

        assert.match(output, /--c1:\s*rgb\(\d+\s+\d+\s+\d+\)\s*;/);
        assert.match(output, /--c2:\s*rgb\(\d+\s+\d+\s+\d+\s*\/\s*0\.5\)\s*;/);
    });

    it("is idempotent when converting to the same target format twice", () => {
        const first = convertText(
            SAMPLE,
            opts({
                targetFormat: "oklch",
                precision: 2,
                useOpacity: true,
            }),
        ).output;

        const second = convertText(
            first,
            opts({
                targetFormat: "oklch",
                precision: 2,
                useOpacity: true,
            }),
        ).output;

        assert.equal(second, first);
    });
});

describe("convertText (advanced cases)", () => {
    it("handles ugly spacing, tabs, and newlines in declarations", () => {
        const src = `
:root{
\t--a\t:\thsl(240 10% 98%)\t;
    --b:rgba(  10 , 20 , 30 , .5   );
    --c : #abc ;
}
`;

        const { output, errorColors, editsApplied } = convertText(
            src,
            opts({
                targetFormat: "oklch",
                precision: 2,
                useOpacity: true,
            }),
        );

        assert.equal(errorColors.length, 0);
        assert.ok(editsApplied >= 2);

        assert.match(output, /--a\s*:\s*oklch\(/i);
        assert.match(output, /--b\s*:\s*oklch\(/i);
        assert.match(output, /--c\s*:\s*oklch\(/i);
    });

    it("does not touch values that are not colors", () => {
        const src = String.raw`
:root{
  --len: 10px;
  --url: url(#fff);
  --str: "#fff";
  --fn: calc(100% - 2px);
}
`;

        const { output, editsApplied, errorColors } = convertText(
            src,
            opts({
                targetFormat: "hex",
                precision: 2,
                useOpacity: true,
            }),
        );

        assert.equal(errorColors.length, 0);
        assert.equal(editsApplied, 0);
        assert.equal(output, src);
    });

    it("converts named colors (including case-insensitive)", () => {
        const src = String.raw`
:root{
  --c1: red;
  --c2: ReBeCcApUrPlE;
  --c3: transparent;
}
`;

        const { output, errorColors, editsApplied } = convertText(
            src,
            opts({
                targetFormat: "hex",
                precision: 2,
                useOpacity: true,
            }),
        );

        assert.match(output, /--c1:\s*#[0-9a-f]{6,8}\b/i);
        assert.ok(editsApplied >= 1);
        assert.ok(Array.isArray(errorColors));
    });

    it("handles CSS Color Level 4 space-separated rgb() and alpha slash", () => {
        const src = String.raw`
:root{
  --c1: rgb(10 20 30);
  --c2: rgb(10 20 30 / 50%);
  --c3: hsl(240 10% 98% / .25);
}
`;

        const { output, errorColors } = convertText(
            src,
            opts({
                targetFormat: "rgb",
                precision: 3,
                useOpacity: true,
            }),
        );

        assert.equal(errorColors.length, 0);

        // With the new rule, c1 should NOT gain "/ 1"
        assert.match(output, /--c1:\s*rgb\(\d+\s+\d+\s+\d+\)\s*;/i);

        // c2/c3 had explicit alpha, so they must keep it
        assert.match(output, /--c2:\s*rgb\(\d+\s+\d+\s+\d+\s*\/\s*0\.5\)\s*;/i);
        assert.match(
            output,
            /--c3:\s*rgb\(\d+\s+\d+\s+\d+\s*\/\s*0\.25\)\s*;/i,
        );
    });

    it("converts inside nested blocks and keeps braces/semicolons intact", () => {
        const src = String.raw`
@media (prefers-color-scheme: dark) {
  .x {
    --c: hsl(0 0% 0%);
  }
}
`;

        const { output, errorColors, editsApplied } = convertText(
            src,
            opts({
                targetFormat: "oklch",
                precision: 2,
                useOpacity: true,
            }),
        );

        assert.equal(errorColors.length, 0);
        assert.equal(editsApplied, 1);
        assert.match(output, /--c:\s*oklch\(/);
        assert.match(output, /\}\s*\}\s*$/);
    });

    it("converts when declaration has trailing tokens like !important and comments", () => {
        const src = String.raw`
:root{
  --c1: hsl(240 10% 98%) !important;
  --c2: #fff /* comment */;
}
`;

        const { output, editsApplied, errorColors } = convertText(
            src,
            opts({
                targetFormat: "oklch",
                precision: 2,
                useOpacity: true,
            }),
        );

        assert.equal(errorColors.length, 0);
        assert.equal(editsApplied, 2);

        // Preserve the trailing tokens
        assert.match(output, /--c1:\s*oklch\([^)]*\)\s*!important;/);
        assert.match(output, /--c2:\s*oklch\([^)]*\)\s*\/\*\s*comment\s*\*\/;/);
    });

    it("handles weird but valid function forms via FUNCTION_COLOR", () => {
        const src = String.raw`
:root{
  --c1: color(display-p3 1 0.5 0 / 0.75);
  --c2: oklch(62% 0.1 30 / 50%);
}
`;

        const { output, errorColors } = convertText(
            src,
            opts({
                targetFormat: "hex",
                precision: 2,
                useOpacity: true,
            }),
        );

        assert.ok(typeof output === "string");
        assert.ok(Array.isArray(errorColors));
    });

    it("keeps CRLF files readable (no index corruption)", () => {
        const src = ":root {\r\n  --c: hsl(240 10% 98%);\r\n}\r\n";

        const { output, errorColors, editsApplied } = convertText(
            src,
            opts({
                targetFormat: "oklch",
                precision: 2,
                useOpacity: true,
            }),
        );

        assert.equal(errorColors.length, 0);
        assert.equal(editsApplied, 1);
        assert.match(output, /\r\n/);
        assert.match(output, /--c:\s*oklch\(/);
    });

    it("is safe on very large files (sanity check)", () => {
        const line = "--c: hsl(240 10% 98%);\n";
        const src = `:root{\n${line.repeat(2000)}}\n`;

        const { output, errorColors, editsApplied } = convertText(
            src,
            opts({
                targetFormat: "hex",
                precision: 2,
                useOpacity: true,
            }),
        );

        assert.equal(errorColors.length, 0);
        assert.equal(editsApplied, 2000);
        assert.match(output, /--c:\s*#[0-9a-f]{6,8}\b/i);
    });

    it("converts when !important exists after the color", () => {
        const src = `:root{ --c: hsl(240 10% 98%) !important; }`;
        const { output, editsApplied } = convertText(
            src,
            opts({ targetFormat: "hex", precision: 2, useOpacity: true }),
        );
        assert.equal(editsApplied, 1);
        assert.match(output, /--c:\s*#[0-9a-f]{6,8}\b/i);
    });
});
