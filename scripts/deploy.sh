#!/bin/bash

# 0.1 check if jq has been installed
type jq >/dev/null 2>&1 || { echo >&2 "I require jq but it's not installed. Aborting."; exit 1; }

# 0.2 check if all files are commited
if [ ! -z "$(git status --porcelain)" ]; then
  echo "There are uncommitted files on v2.x. Please commit or stash first!"
  git status
  exit 1
fi

# 0.3 check if gh-pages files are commited
git checkout gh-pages
if [ ! -z "$(git status --porcelain)" ]; then
  echo "There are uncommitted files on gh-pages. Please commit or stash first!"
  git status
  git checkout v2.x
  exit 1
else
  echo "All tracked files are commited. Publishing for npm, bower & gh-pages."
fi
git checkout v2.x

# 0.4 fresh npm install to ensure no dev changes are included
rm -rf node_modules
npm install

# generate build files
npm run build

if [ -f "npm-debug.log" ]; then
  echo "An error occurred during the build process. Check npm-debug.log."
  exit 1
fi

# 1. NPM PUBLISH
npm publish
# exit if npm publish failed
rc=$?
if [[ $rc != 0 ]]; then
  echo "npm publish failed. Publishing cancelled."
  exit $rc;
fi

# 2. BOWER PUBLISH
# read version
gitsha=$(git rev-parse HEAD)
version=$(cat package.json | jq .version | sed -e 's/^"//'  -e 's/"$//')

# swap to head so we don't commit compiled file to v2.x along with tags
git checkout head

# add the compiled files, commit and tag!
git add vega* -f
git commit -m "Release $version $gitsha."
git tag -am "Release v$version." "v$version"

# swap back to the clean v2.x and push the new tag
git checkout v2.x
git push --tags
# now the published tag contains build files which work great with bower.

# 3. GITHUB PAGES PUBLISH
# re-generate build files
npm run build

# populate staging directory
stage=gh_pages_stage
rm -rf $stage
mkdir $stage
cp vega* $stage

# copy staged files to gh-pages
git checkout gh-pages
cp $stage/* .
rm -rf $stage

# add, commit and push files to gh-pages
git add vega* -f
git commit -m "Move to v$version."
git push origin gh-pages

# swap back to v2.x branch
git checkout v2.x
