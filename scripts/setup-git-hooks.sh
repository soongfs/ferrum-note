#!/usr/bin/env bash
set -euo pipefail

git config core.hooksPath .githooks
git config commit.template .gitmessage

echo "Git hooks path and commit template configured."
