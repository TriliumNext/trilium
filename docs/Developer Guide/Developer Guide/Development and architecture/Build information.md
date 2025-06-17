# Build information
*   Provides context about when the build was made and the corresponding Git revision.
*   The information is displayed to the client when going in the about dialog.
*   The build information is hard-coded in `src/services/build.ts`. This file is generated automatically via `npm run update-build-info` which itself is run automatically whenever making a build in the CI, or a [local delivery](../Old%20documentation/Build%20deliveries%20locally.md).