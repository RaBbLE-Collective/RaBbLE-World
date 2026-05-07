#!/usr/bin/env bash
# Generate all required icon sizes from a source PNG.
# Usage: ./scripts/gen-icons.sh [source_image]
# Default source: icons/icon.png

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ICONS_DIR="$REPO_ROOT/icons"

SRC="${1:-$ICONS_DIR/icon.png}"

if [[ ! -f "$SRC" ]]; then
  echo "Error: source image not found: $SRC" >&2
  exit 1
fi

command -v magick >/dev/null 2>&1 || { echo "Error: ImageMagick (magick) is required." >&2; exit 1; }

echo "Source: $SRC"
echo "Output: $ICONS_DIR"
echo ""

resize() {
  local size="$1"
  local out="$ICONS_DIR/icon-${size}.png"
  magick "$SRC" -resize "${size}x${size}" -background none -gravity center -extent "${size}x${size}" "$out"
  echo "  icon-${size}.png"
}

# PWA manifest + apple-touch-icon
resize 192
resize 512

# Favicon raster layers
resize 16
resize 32
resize 48

# Multi-resolution favicon.ico (16, 32, 48 embedded)
magick \
  "$ICONS_DIR/icon-16.png" \
  "$ICONS_DIR/icon-32.png" \
  "$ICONS_DIR/icon-48.png" \
  "$ICONS_DIR/favicon.ico"
echo "  favicon.ico (16/32/48)"

echo ""
echo "Done."
