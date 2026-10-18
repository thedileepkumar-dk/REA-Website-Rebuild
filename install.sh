#!/bin/sh
# macOS/Linux bootstrap. Run from a checkout or download the pinned release.
set -eu
REA_REBUILD_RELEASE=v1.0.0
if ! command -v node >/dev/null 2>&1; then
  echo 'Node.js is required. Install Node 22.19+, 24.11+, or 26+ from https://nodejs.org/, then rerun.' >&2
  exit 1
fi
case "$0" in
  */install.sh|install.sh) REA_REBUILD_LOCAL=$(CDPATH= cd -- "$(dirname -- "$0")" 2>/dev/null && pwd) || REA_REBUILD_LOCAL= ;;
  *) REA_REBUILD_LOCAL= ;;
esac
if [ -n "$REA_REBUILD_LOCAL" ] && [ -f "$REA_REBUILD_LOCAL/skills/rea-website-rebuild/SKILL.md" ]; then
  exec node "$REA_REBUILD_LOCAL/scripts/install.mjs" "$@"
fi
for REA_REBUILD_TOOL in curl tar mktemp; do
  if ! command -v "$REA_REBUILD_TOOL" >/dev/null 2>&1; then
    echo "Missing required download tool: $REA_REBUILD_TOOL" >&2
    exit 1
  fi
done
REA_REBUILD_TEMP=$(mktemp -d)
trap 'rm -rf "$REA_REBUILD_TEMP"' EXIT HUP INT TERM
curl --fail --silent --show-error --location \
  "https://github.com/thedileepkumar-dk/REA-Website-Rebuild/archive/refs/tags/$REA_REBUILD_RELEASE.tar.gz" \
  --output "$REA_REBUILD_TEMP/rebuild.tar.gz"
tar -xzf "$REA_REBUILD_TEMP/rebuild.tar.gz" -C "$REA_REBUILD_TEMP"
node "$REA_REBUILD_TEMP/REA-Website-Rebuild-${REA_REBUILD_RELEASE#v}/scripts/install.mjs" "$@"
