#!/bin/bash
# Create the Loop icon source PNG using the same design as the logo

ICON_SIZE=1024
OUTPUT="loop-icon-1024.png"

# Create the icon with ImageMagick (requires: brew install imagemagick)
if ! command -v magick &> /dev/null; then
  echo "Error: ImageMagick not found. Install with: brew install imagemagick"
  exit 1
fi

# Create a 1024x1024 canvas with the Loop interlocking squares pattern
# This matches the logo design in LoopLogo.tsx
magick -size ${ICON_SIZE}x${ICON_SIZE} xc:none \
  -fill '#ffffff' \
  -draw "rectangle 256,384 320,448" \
  -draw "rectangle 256,448 320,512" \
  -draw "rectangle 256,512 320,576" \
  -draw "rectangle 320,384 384,448" \
  -draw "rectangle 320,512 384,576" \
  -draw "rectangle 384,384 448,448" \
  -draw "rectangle 384,448 448,512" \
  -draw "rectangle 384,512 448,576" \
  -draw "rectangle 448,384 512,448" \
  -draw "rectangle 448,448 512,512" \
  -draw "rectangle 448,512 512,576" \
  -draw "rectangle 512,384 576,448" \
  -draw "rectangle 512,512 576,576" \
  -draw "rectangle 576,384 640,448" \
  -draw "rectangle 576,448 640,512" \
  -draw "rectangle 576,512 640,576" \
  "$OUTPUT"

echo "✓ Created $OUTPUT (1024x1024 PNG)"
echo ""
echo "Next steps:"
echo "1. Review the icon: open $OUTPUT"
echo "2. Generate all app icons: ./generate-icons.sh $OUTPUT"
