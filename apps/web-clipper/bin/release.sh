#!/usr/bin/env bash
set -e

export GITHUB_REPO=trilium-web-clipper

if [[ $# -eq 0 ]] ; then
    echo "Missing argument of new version"
    exit 1
fi

VERSION=$1

if ! [[ ${VERSION} =~ ^[0-9]{1,2}\.[0-9]{1,2}\.[0-9]{1,2}(-.+)?$ ]] ;
then
    echo "Version ${VERSION} isn't in format X.Y.Z"
    exit 1
fi

if ! git diff-index --quiet HEAD --; then
    echo "There are uncommitted changes"
    exit 1
fi

echo "Releasing Trilium Web Clipper $VERSION"

jq '.version = "'"$VERSION"'"' manifest.json | sponge manifest.json

git add manifest.json

echo 'module.exports = { buildDate:"'$(date --iso-8601=seconds)'", buildRevision: "'$(git log -1 --format="%H")'" };' > build.js

git add build.js

TAG=v$VERSION

echo "Committing package.json version change"

git commit -m "release $VERSION"
git push

echo "Tagging commit with $TAG"

git tag "$TAG"
git push origin "$TAG"

bin/release-firefox.sh
bin/release-chrome.sh

FIREFOX_BUILD=trilium_web_clipper-$VERSION-an+fx.xpi
CHROME_BUILD=trilium_web_clipper-${VERSION}-chrome.zip

echo "Creating release in GitHub"

github-release release \
    --tag "$TAG" \
    --name "$TAG release"

echo "Uploading firefox build package"

github-release upload \
    --tag "$TAG" \
    --name "$FIREFOX_BUILD" \
    --file "dist/$FIREFOX_BUILD"

echo "Uploading chrome build package"

github-release upload \
    --tag "$TAG" \
    --name "$CHROME_BUILD" \
    --file "dist/$CHROME_BUILD"

echo "Release finished!"
