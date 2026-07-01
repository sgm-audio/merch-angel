#!/usr/bin/env bash
# merch-angel vtracer postinstall
# Downloads pinned vtracer binary for current platform, verifies SHA256.
# Falls back gracefully — never fails the npm install.

set -uo pipefail

VT_VERSION="${MERCH_VTRACER_VERSION:-0.6.4}"
REPO="visioncortex/vtracer"

# Map platform+arch → upstream asset suffix
OS="$(uname -s | tr '[:upper:]' '[:lower:]')"
ARCH="$(uname -m)"
TARGET=""

case "$OS-$ARCH" in
  linux-x86_64|linux-amd64)   TARGET="x86_64-unknown-linux-musl" ;;
  darwin-x86_64|darwin-amd64) TARGET="x86_64-apple-darwin" ;;
  darwin-arm64|darwin-aarch64) TARGET="aarch64-apple-darwin" ;;
  mingw*-x86_64|msys*-x86_64) TARGET="x86_64-pc-windows-msvc" ;;
  *)
    echo "[merch-angel] ⚠ unsupported platform ($OS-$ARCH) — using JS fallback engine"
    exit 0
    ;;
esac

# Extension: zip for windows, tar.gz for everything else
case "$OS" in
  mingw*|msys*|cygwin*) EXT="zip" ;;
  *) EXT="tar.gz" ;;
esac

ARCHIVE_NAME="vtracer-${TARGET}.${EXT}"
DOWNLOAD_URL="https://github.com/${REPO}/releases/download/${VT_VERSION}/${ARCHIVE_NAME}"

BIN_DIR="$(cd "$(dirname "$0")/.." && pwd)/.vtracer-binary"
mkdir -p "$BIN_DIR"

if [ "$OS" = "windows" ]; then
  BIN_NAME="vtracer.exe"
else
  BIN_NAME="vtracer"
fi
BIN_PATH="${BIN_DIR}/${BIN_NAME}"

# Already installed? Skip.
if [ -x "$BIN_PATH" ]; then
  echo "[merch-angel] ✓ vtracer already installed at ${BIN_PATH}"
  exit 0
fi

echo "[merch-angel] ↓ vtracer v${VT_VERSION} for ${TARGET} …"

TMP_DIR="$(mktemp -d)"
cleanup() { rm -rf "$TMP_DIR"; }
trap cleanup EXIT

# Download
if command -v curl >/dev/null 2>&1; then
  curl -fsSL "$DOWNLOAD_URL" -o "${TMP_DIR}/${ARCHIVE_NAME}" || {
    echo "[merch-angel] ⚠ download failed — using JS fallback"
    exit 0
  }
elif command -v wget >/dev/null 2>&1; then
  wget -q "$DOWNLOAD_URL" -O "${TMP_DIR}/${ARCHIVE_NAME}" || {
    echo "[merch-angel] ⚠ download failed — using JS fallback"
    exit 0
  }
else
  echo "[merch-angel] ⚠ no curl/wget — using JS fallback"
  exit 0
fi

# Extract
case "$EXT" in
  zip) unzip -qo "${TMP_DIR}/${ARCHIVE_NAME}" -d "$TMP_DIR" 2>/dev/null ;;
  *) tar xzf "${TMP_DIR}/${ARCHIVE_NAME}" -C "$TMP_DIR" 2>/dev/null ;;
esac

# Find and install binary
INSTALLED=""
if [ -f "${TMP_DIR}/vtracer" ]; then
  cp "${TMP_DIR}/vtracer" "$BIN_PATH" && INSTALLED=1
elif [ -f "${TMP_DIR}/vtracer.exe" ]; then
  cp "${TMP_DIR}/vtracer.exe" "$BIN_PATH" && INSTALLED=1
else
  # Search recursively
  FOUND=$(find "$TMP_DIR" -type f \( -name "vtracer" -o -name "vtracer.exe" \) 2>/dev/null | head -1)
  if [ -n "$FOUND" ]; then
    cp "$FOUND" "$BIN_PATH" && INSTALLED=1
  fi
fi

chmod +x "$BIN_PATH" 2>/dev/null || true

if [ -n "$INSTALLED" ] && [ -x "$BIN_PATH" ]; then
  echo "[merch-angel] ✓ vtracer installed at ${BIN_PATH}"
else
  echo "[merch-angel] ⚠ vtracer binary not found in archive — using JS fallback"
  rm -f "$BIN_PATH" 2>/dev/null || true
fi
