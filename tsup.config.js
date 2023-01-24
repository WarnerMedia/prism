// Copyright (c) Warner Media, LLC. All rights reserved. Licensed under the MIT license.
// See the LICENSE file for license information.
import { defineConfig } from "tsup";

export default defineConfig({
  entry: { "prism-sdk": "src/index.ts" },
  platform: "browser",
  format: ["esm", "cjs", "iife"],
  minify: true,
  sourcemap: true,
  clean: true,
  splitting: false,
});
