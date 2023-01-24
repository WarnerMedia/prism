// Copyright (c) Warner Media, LLC. All rights reserved. Licensed under the MIT license.
// See the LICENSE file for license information.
require("jest-extended");
require("@testing-library/jest-dom");

// this removes quotes around strings to make snapshots more readable...
expect.addSnapshotSerializer({
  test: (val) => val && val.userAgent,
  print: (val) => {
    if (typeof val !== "string") {
      delete val.userAgent;
      return JSON.stringify(val);
    }
    return val;
  },
});

// general cleanup...
afterEach(() => {
  window.__uspapi = undefined;
  document.head.innerHTML = "";
  document.body.innerHTML = "";
});
