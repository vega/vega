#!/bin/bash

# stop script if error occurs
set -e

# get the current installed vega version
version=$(npm list vega | head -n 1 | sed 's/.*@//' | awk '{print $1}')

# schema repo must be immediately outside the vega monorepo!
pushd ../../../schema/vega/

# ensure schema repo is up to date
git checkout master
git pull

# copy latest schema file
rm -f v$version.json
cp ../../vega/packages/vega/build/vega-schema.json v$version.json
echo "Copied schema to v$version.json"

# update symlink for major version to latest schema
prefix=$version
while echo "$prefix" | grep -q '\.'; do
    # stip off everything before . or -
    prefix=$(echo $prefix | sed 's/[\.-][^\.-]*$//')
    ln -f -s v$version.json v$prefix.json
    echo "Symlinked v$prefix.json to v$version.json"
done

# commit and push schema updates
if [ -n "$(git status --porcelain)" ]; then
    git add *.json
    git commit -m"Add Vega $version"
    git push
else
  echo "Nothing has changed"
fi

# return to starting directory
popd
