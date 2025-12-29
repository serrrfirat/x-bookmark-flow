# Extension Icons

Chrome extensions require PNG icons. SVG source files are provided - convert them to PNG at these sizes:

- `icon16.png` - 16x16 pixels
- `icon32.png` - 32x32 pixels  
- `icon48.png` - 48x48 pixels
- `icon128.png` - 128x128 pixels

## Quick conversion using ImageMagick

```bash
# Install ImageMagick if needed
# macOS: brew install imagemagick
# Ubuntu: sudo apt install imagemagick

# Convert SVGs to PNGs
for size in 16 32 48 128; do
  convert -background none -resize ${size}x${size} icon${size}.svg icon${size}.png
done
```

## Online converters

- [CloudConvert](https://cloudconvert.com/svg-to-png)
- [SVG to PNG](https://svgtopng.com/)

