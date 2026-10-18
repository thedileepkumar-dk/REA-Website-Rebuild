#!/bin/sh
# Open this launcher from the extracted release folder on macOS.
REA_REBUILD_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
sh "$REA_REBUILD_DIR/install.sh" "$@"
REA_REBUILD_RESULT=$?
printf '\nPress Return to close…'
read -r REA_REBUILD_CLOSE
exit "$REA_REBUILD_RESULT"
