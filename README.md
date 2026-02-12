<p align="center">
  <img src="./logo.png" alt="CSS Color Converter logo" width="160" />
</p>

# CSS Color Converter

Convert CSS color values to a different color format directly inside your files.

Supported output formats:

- `oklch()`
- `oklab()`
- `lch()`
- `lab()`
- `rgb()`
- `hsl()`
- `#rrggbb`
- `#rrggbbaa`

The extension operates on the current selection or the entire document.

---

## Demo

[<img
src="https://github.com/inf1nite-lo0p/css-color-converter/raw/main/demo.gif"
alt="CSS Color Converter demo"
width="900"
/>](https://github.com/inf1nite-lo0p/css-color-converter/raw/main/demo.mp4)

---

## What It Does

This extension allows you to convert existing CSS color values to a different format without manually rewriting them.

You can:

- Convert a single selection
- Convert an entire file
- Choose the target format at runtime
- Standardize color usage across a codebase
- Migrate to perceptual color spaces like `oklch()` or `oklab()`

---

## How to Use

1. Open the Command Palette
    - Windows/Linux: `Ctrl + Shift + P`
    - macOS: `Cmd + Shift + P`

2. Run:

    ```
    Convert Colors (Selection or Document)
    ```

3. Choose the desired output format.

If text is selected, only the selection is processed.
If nothing is selected, the entire document is processed.

---

## Supported Input Formats

The extension recognizes common CSS color formats, including:

### Named colors

```
red
rebeccapurple
transparent
```

### Hex

```
#fff
#ffcc00
#ffcc00aa
```

### Functional formats

```
rgb(10 20 30)
rgb(10 20 30 / 0.5)

hsl(240 10% 98%)
hsl(240 10% 98% / 0.25)

lab(...)
lch(...)
oklab(...)
oklch(...)
color(display-p3 ...)
```

Modern CSS Color Level 4 syntax is supported.

---

## Configuration

You can configure default behavior in VS Code settings.

### Default Target Format

Sets the preferred format used for conversion.

Available values:

- `oklch`
- `oklab`
- `lch`
- `lab`
- `rgb`
- `hsl`
- `hex`

---

### Include Opacity

Controls when alpha values are included in the generated output.

- Alpha is always preserved when opacity is less than `1`
- Alpha can also be preserved when explicitly defined in the original color

---

### Decimal Precision

Controls how many decimal places are used in generated values.

Range: `0` to `6`
Default: `2`

---

## Example

Input:

```css
:root {
    --primary: hsl(240 10% 98%);
}
```

Converted to `oklch()`:

```css
:root {
    --primary: oklch(...);
}
```

---

## Issues and Feedback

If you encounter a bug, unexpected behavior, or would like to request a feature, please open an issue on GitHub:

👉 [https://github.com/inf1nite-lo0p/css-color-converter/issues](https://github.com/inf1nite-lo0p/css-color-converter/issues)

When reporting an issue, include:

- Your VS Code version
- The extension version
- A minimal reproducible example
- The expected vs actual behavior

---

## License

Licensed under the [MIT License](https://github.com/inf1nite-lo0p/css-color-converter/blob/main/LICENSE).
