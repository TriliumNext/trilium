#!/usr/bin/env bash
set -e

VERSION=$(jq -r ".version" manifest.json)
CHROME_EXTENSION_ID=dfhgmnfclbebfobmblelddiejjcijbjm

BUILD_DIR=trilium-web-clipper-chrome

rm -rf "dist/$BUILD_DIR"
mkdir -p "dist/$BUILD_DIR"

cp -r icons lib options popup *.js manifest.json "dist/$BUILD_DIR"

cd dist/"${BUILD_DIR}" || exit

jq '.name = "Trilium Web Clipper"' manifest.json | sponge manifest.json
jq 'del(.browser_specific_settings)' manifest.json | sponge manifest.json

EXT_FILE_NAME=trilium_web_clipper-${VERSION}-chrome.zip

zip -r ../${EXT_FILE_NAME} *

cd ..
rm -r "${BUILD_DIR}"

# https://github.com/fregante/chrome-webstore-upload-cli
chrome-webstore-upload upload --source ${EXT_FILE_NAME} --auto-publish --extension-id "${CHROME_EXTENSION_ID}" --client-id "${CHROME_CLIENT_ID}" --client-secret "${CHROME_CLIENT_SECRET}" --refresh-token "${CHROME_REFRESH_TOKEN}"

