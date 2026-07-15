#!/bin/bash
# Loop App Icon Generator
# Requires: ImageMagick (brew install imagemagick)

SOURCE_IMAGE="$1"
ICON_DIR="src/resources/build/icons"

if [ -z "$SOURCE_IMAGE" ]; then
  echo "Usage: ./generate-icons.sh <source-image.png>"
  echo "Source image should be 1024x1024 PNG with transparent background"
  exit 1
fi

if ! command -v magick &> /dev/null; then
  echo "Error: ImageMagick not found. Install with: brew install imagemagick"
  exit 1
fi

echo "Generating app icons from $SOURCE_IMAGE..."

# Create iconset directory
ICONSET_DIR="loop.iconset"
mkdir -p "$ICONSET_DIR"

# Generate all required macOS icon sizes
magick "$SOURCE_IMAGE" -resize 16x16 "$ICONSET_DIR/icon_16x16.png"
magick "$SOURCE_IMAGE" -resize 32x32 "$ICONSET_DIR/icon_16x16@2x.png"
magick "$SOURCE_IMAGE" -resize 32x32 "$ICONSET_DIR/icon_32x32.png"
magick "$SOURCE_IMAGE" -resize 64x64 "$ICONSET_DIR/icon_32x32@2x.png"
magick "$SOURCE_IMAGE" -resize 128x128 "$ICONSET_DIR/icon_128x128.png"
magick "$SOURCE_IMAGE" -resize 256x256 "$ICONSET_DIR/icon_128x128@2x.png"
magick "$SOURCE_IMAGE" -resize 256x256 "$ICONSET_DIR/icon_256x256.png"
magick "$SOURCE_IMAGE" -resize 512x512 "$ICONSET_DIR/icon_256x256@2x.png"
magick "$SOURCE_IMAGE" -resize 512x512 "$ICONSET_DIR/icon_512x512.png"
magick "$SOURCE_IMAGE" -resize 1024x1024 "$ICONSET_DIR/icon_512x512@2x.png"

# Generate .icns for macOS
iconutil -c icns "$ICONSET_DIR" -o "$ICON_DIR/icon.icns"

# Generate .ico for Windows (requires multiple sizes)
magick "$SOURCE_IMAGE" -resize 256x256 \
  \( -clone 0 -resize 16x16 \) \
  \( -clone 0 -resize 32x32 \) \
  \( -clone 0 -resize 48x48 \) \
  \( -clone 0 -resize 64x64 \) \
  \( -clone 0 -resize 128x128 \) \
  -delete 0 -alpha on -colors 256 "$ICON_DIR/icon.ico"

# Generate standard PNG sizes
magick "$SOURCE_IMAGE" -resize 512x512 "$ICON_DIR/icon.png"
magick "$SOURCE_IMAGE" -resize 256x256 "$ICON_DIR/icon-256x256.png"
magick "$SOURCE_IMAGE" -resize 128x128 "$ICON_DIR/icon-128x128.png"

# Cleanup
rm -rf "$ICONSET_DIR"

echo "✓ Icons generated successfully in $ICON_DIR/"
echo "  - icon.icns (macOS)"
echo "  - icon.ico (Windows)"
echo "  - icon.png and variants"
