// Copyright (c) Warner Media, LLC. All rights reserved. Licensed under the MIT license.
// See the LICENSE file for license information.
import { Psm, PsmConfig } from "./Psm";

const psm = new Psm();

export * from "./Psm";
declare global {
  interface Window {
    psmMgrConfig: PsmConfig;
    psmMgr: {
      psm_test_ts: boolean;
      psmEnvironment: string;
      psmSendGeoInit: boolean;
      psmHost: string;
      psmGeoActualCookieValue: string;
    };
    psmCore?: { psm?: { browser?: string } };
  }
  interface Crypto {
    randomUUID: () => string;
  }
}

window.psmMgr = {
  ...window.psmMgr,
  psm_test_ts: true, // FIXME: for dev purposes, allows our logger function to log to the console
};
