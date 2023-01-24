// Copyright (c) Warner Media, LLC. All rights reserved. Licensed under the MIT license.
// See the LICENSE file for license information.
const dotenv = require("dotenv");
const path = require("path");

module.exports = async () => {
  dotenv.config({ path: path.resolve(__dirname, ".env.test") });
};
