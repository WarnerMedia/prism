// Copyright (c) Warner Media, LLC. All rights reserved. Licensed under the MIT license.
// See the LICENSE file for license information.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { v4 as uuid } from "uuid";
import { cookie } from "./utils/cookie/src";
import { findFrame } from "./privacy";
import { cookiesEnabled, fromQueryString } from "./utils/browser";
import { URLS } from "./utils/constants";
import { debug } from "./utils/logger";

export type UkidValue = string;

export type CrossSiteIdValue = string | { csid: string; ukid: string };

export let is3PCookiesEnabled = null;

let ukid: UkidValue = "";
let csid: CrossSiteIdValue = "";

export function isUUID(id: string) {
  return /^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i.test(
    id
  );
}

export function searchURL(): string | null {
  const utm_term = fromQueryString("utm_term", window.location.href);
  const match = new RegExp(
    /csid_([0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12})/i
  ).exec(utm_term);
  let result = null;
  if (match) {
    result = match[1];
  }
  return result;
}

export function updateCSData(csid: string, ukid: string) {
  if (!isUUID(csid)) {
    debug({
      message: `Cross Site ID value ${JSON.stringify(
        csid
      )} is invalid. Returning without updating`,
      methodName: "updateCSData",
      eventType: "csid",
    });
  } else {
    csid = searchURL() || csid; // If no prior CPDID on current page, update with CPDPID in url from inbrain
    cookie.set("csid", JSON.stringify({ csid: csid, ukid }), {
      samesite: "None",
      secure: true,
      encode: false,
    });
  }
}

function createFrame(name: string, src: string) {
  const iframe = document.createElement("iframe");

  iframe.setAttribute("id", name);
  iframe.setAttribute("style", "display:none");
  iframe.setAttribute("src", src);
  document.body.appendChild(iframe);
}

export function initUKID(): string {
  if (cookiesEnabled()) {
    ukid = cookie.get("UKID") as UkidValue;

    debug({
      message: `[PSM]: Cookies enabled. Retrieving ID values
  UKID: ${JSON.stringify(ukid)}
  `,
      methodName: "initIdentity",
      eventType: "identity",
    });

    if (ukid == null) {
      // If the UKID does not exist, generate one, set a cookie, and track the newly-registered ID
      ukid = uuid();
      debug({
        message: `UKID cookie not found. Generating UKID: ${ukid}`,
        methodName: "initIdentity",
        eventType: "identity",
      });
    }

    debug({
      message: `Setting UKID cookie to ${ukid}. Cookie options: ${JSON.stringify(
        cookie.options()
      )}`,
      methodName: "initIdentity",
      eventType: "identity",
    });

    cookie.set("UKID", ukid);
    return ukid;
  }
  return "";
}

/**
 * Initializes the Prism identity module, which is responsible for:
 *   - Managing the ukid
 *   - Capturing third-party IDs
 *   - Sending data to Doppler
 */
export function initCrossSiteId(env: string): Promise<string> {
  return new Promise((resolve) => {
    // Add Third Party Cookie
    createFrame("psm_thirdparty", URLS.cdnOrigin + URLS.thirdPartyCookie);

    window.addEventListener(
      "message",
      (e: MessageEvent) => {
        if (e.origin === URLS.cdnOrigin) {
          if (e.data === "PSM:3PCunsupported") {
            // Third party cookies are NOT supported
            is3PCookiesEnabled = false;
          } else if (e.data === "PSM:3PCsupported") {
            // Third party cookies ARE supported
            is3PCookiesEnabled = true;
          } else {
            debug({
              message: `Updating CrossSiteId from iFrame value: ${JSON.stringify(
                e.data
              )}`,
              methodName: "initIdentity",
              eventType: "message",
            });
            updateCSData(e.data, ukid);
            resolve(e.data);
          }
        }
      },
      false
    );

    if (cookiesEnabled()) {
      csid = cookie.get("csid") as CrossSiteIdValue;
      const csidValid =
        csid && typeof csid === "object" && "csid" in csid && isUUID(csid.csid);

      debug({
        message: `[PSM]: Cookies enabled. Retrieving ID values
  CSID: ${JSON.stringify(csid)}
  `,
        methodName: "initIdentity",
        eventType: "identity",
      });

      if (csid === null || !csidValid) {
        if (findFrame("prism_toolkit") === null) {
          createFrame("prism_toolkit", URLS.cdnOrigin + URLS.iFramePath[env]);
        }
      } else if (
        typeof csid === "object" &&
        "csid" in csid &&
        "ukid" in csid &&
        csidValid
      ) {
        const csidStr: string = csid.csid;
        const ukidStr: string = csid.ukid;

        if (ukid !== ukidStr) {
          debug({
            message: `Updating CSID value ${csidStr} with ukid: ${ukid}`,
            methodName: "initIdentity",
            eventType: "csid",
          });
          updateCSData(csidStr, ukid);
        } else {
          debug({
            message: `CSID cookie has already been set to value ${JSON.stringify(
              csid
            )}. To start a new test, delete the CSID cookie on this domain and CDN`,
            methodName: "initIdentity",
            eventType: "csid",
          });
        }
        resolve(csidStr);
      }
    }
  });
}
