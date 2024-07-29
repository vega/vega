#!/usr/bin/env bash

set -eo pipefail

# Run this script as long as the env variable
# DISABLE_POSTINSTALL_SCRIPT is not set.
if [ -z "$DISABLE_POSTINSTALL_SCRIPT" ]; then
  echo "Installing Vega"
  yarn run data
else
  echo "Skipping postinstall script"
fi
