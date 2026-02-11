const HEX_WITH_ALPHA = /^#(?:[0-9a-fA-F]{4}|[0-9a-fA-F]{8})\b/;

export function hadExplicitAlphaToken(token: string): boolean {
    const t = token.trim();

    // Functional alpha forms: "rgb(... / ...)", "hsl(... / ...)", "oklch(... / ...)", "color(... / ...)"
    if (t.includes("/")) {
        return true;
    }

    // Legacy comma-alpha forms: rgba(), hsla()
    if (/^rgba\(/i.test(t) || /^hsla\(/i.test(t)) {
        return true;
    }

    // Hex with alpha: #RGBA or #RRGGBBAA
    if (HEX_WITH_ALPHA.test(t)) {
        return true;
    }

    // "transparent" is explicitly alpha=0
    if (t.toLowerCase() === "transparent") {
        return true;
    }

    return false;
}
