#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIST_DIR="$ROOT_DIR/dist"
VERSION="$(node -e "process.stdout.write(require('./manifest.json').version)")"
PACKAGE_NAME="youtube-transcript-exporter-$VERSION.zip"

rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR"

cd "$ROOT_DIR"
zip -r "$DIST_DIR/$PACKAGE_NAME" \
  manifest.json \
  background.js \
  content.js \
  styles.css \
  icons \
  README.md \
  PRIVACY.md

echo "$DIST_DIR/$PACKAGE_NAME"
