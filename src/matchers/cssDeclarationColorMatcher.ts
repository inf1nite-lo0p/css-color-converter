export type Match = {
    fullMatch: string;
    color: string;
    index: number;
};

const NAMED_COLORS =
    "(?:aliceblue|antiquewhite|aqua|aquamarine|azure|beige|bisque|blanchedalmond|blue|blueviolet|brown|burlywood|cadetblue|chartreuse|chocolate|coral|cornflowerblue|cornsilk|crimson|cyan|darkblue|darkcyan|darkgoldenrod|darkgray|darkgreen|darkkhaki|darkmagenta|darkolivegreen|darkorange|darkorchid|darkred|darksalmon|darkseagreen|darkslateblue|darkslategray|darkturquoise|darkviolet|deeppink|deepskyblue|dimgray|dodgerblue|firebrick|floralwhite|forestgreen|fuchsia|gainsboro|ghostwhite|gold|goldenrod|gray|green|greenyellow|honeydew|hotpink|indianred|indigo|ivory|khaki|lavender|lavenderblush|lawngreen|lemonchiffon|lightblue|lightcoral|lightcyan|lightgoldenrodyellow|lightgray|lightgreen|lightpink|lightsalmon|lightseagreen|lightskyblue|lightslategray|lightsteelblue|lightyellow|lime|limegreen|linen|magenta|maroon|mediumaquamarine|mediumblue|mediumorchid|mediumpurple|mediumseagreen|mediumslateblue|mediumspringgreen|mediumturquoise|mediumvioletred|midnightblue|mintcream|mistyrose|moccasin|navajowhite|navy|oldlace|olive|olivedrab|orange|orangered|orchid|palegoldenrod|palegreen|paleturquoise|palevioletred|papayawhip|peachpuff|peru|pink|plum|powderblue|purple|red|rosybrown|royalblue|saddlebrown|salmon|sandybrown|seagreen|seashell|sienna|silver|skyblue|slateblue|slategray|snow|springgreen|steelblue|tan|teal|thistle|tomato|turquoise|violet|wheat|white|whitesmoke|yellow|yellowgreen)";

const HEX_COLOR = "#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\\b";

const RGB_COLOR =
    "rgba?\\(\\s*\\d{1,3}(?:\\s*,\\s*|\\s+)\\d{1,3}(?:\\s*,\\s*|\\s+)\\d{1,3}(?:\\s*(?:\\/|,)\\s*\\d?\\.?\\d+%?)?\\s*\\)";

const FUNCTION_COLOR =
    "(?:rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color)\\([^\\)]*\\)";

const PROP_NAME = "(?:--[a-zA-Z0-9-_]+|[a-zA-Z-]+)";

const colorRegex = new RegExp(
    `${PROP_NAME}\\s*:\\s*(${NAMED_COLORS}|${HEX_COLOR}|${RGB_COLOR}|${FUNCTION_COLOR})(?=[^;\\}]*?(?:;|\\}))`,
    "gi",
);

export function findDeclarationColors(input: string): Match[] {
    const matches: Match[] = [];

    for (const m of input.matchAll(colorRegex)) {
        const fullMatch = m[0];
        const color = m[1];
        const index = m.index ?? -1;

        if (!fullMatch || !color || index < 0) {
            continue;
        }
        matches.push({ fullMatch, color, index });
    }

    return matches;
}
