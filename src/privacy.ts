// Copyright (c) Warner Media, LLC. All rights reserved. Licensed under the MIT license.
// See the LICENSE file for license information.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { cookie } from "./utils/cookie/src";
import { CCPA_LOCATIONS } from "./utils/constants";
import { USPrivacyString } from "./USPrivacyString";

export type USPData = {
  version: number;
  uspString?: string;
  uspapiLoaded?: boolean;
};

export type USPAPICall = {
  __uspapiCall?: {
    command: string;
    parameter: any;
    version: number;
    callId: string;
  };
};

export type USPAPIReturn = {
  __uspapiReturn?: {
    returnValue: string;
    success: boolean;
    callId: string;
  };
};

export type TCData = {
  // base64url-encoded TC string with segments
  tcString: string;
  // 1.1 or 2
  tcfPolicyVersion: number;
  cmpId: number;
  cmpVersion: number;
  /**
   * true - GDPR Applies
   * false - GDPR Does not apply
   * undefined - unknown whether GDPR Applies
   */
  gdprApplies: boolean | undefined;

  /*
   * see addEventListener command
   */
  eventStatus: string;

  /**
   * see Ping Status Codes in following table
   */
  cmpStatus: string;

  /**
   * If this TCData is sent to the callback of addEventListener: number,
   * the unique ID assigned by the CMP to the listener function registered
   * via addEventListener.
   * Others: undefined.
   */
  listenerId: number | undefined;

  /*
   * true - if using a service-specific or publisher-specific TC String
   * false - if using a global TC String.
   */
  isServiceSpecific: boolean;

  /**
   * true - CMP is using publisher-customized stack descriptions
   * false - CMP is NOT using publisher-customized stack descriptions
   */
  useNonStandardStacks: boolean;

  /**
   * Country code of the country that determines the legislation of
   * reference.  Normally corresponds to the country code of the country
   * in which the publisher's business entity is established.
   * Format is a two-letter ISO 3166-1 alpha-2 country code.
   */
  publisherCC: string;

  /**
   * Only exists on service-specific TC
   *
   * true - Purpose 1 not disclosed at all. CMPs use PublisherCC to
   * indicate the publisher's country of establishment to help Vendors
   * determine whether the vendor requires Purpose 1 consent.
   *
   * false - There is no special Purpose 1 treatment status. Purpose 1 was
   * disclosed normally (consent) as expected by TCF Policy
   */
  purposeOneTreatment: boolean;

  /**
   * Only exists on global-scope TC
   */
  outOfBand: {
    allowedVendors: {
      /**
       * true - Vendor is allowed to use an Out-of-Band Legal Basis
       * false | undefined - Vendor is NOT allowed to use an Out-of-Band Legal Basis
       */
      "[vendor id]": boolean | undefined;
    };
    disclosedVendors: {
      /**
       * true - Vendor has been disclosed to the user
       * false | undefined - Vendor has been disclosed to the user
       */
      "[vendor id]": boolean | undefined;
    };
  };
  purpose: {
    consents: {
      /**
       * true - Consent
       * false | undefined - No Consent.
       */
      "[purpose id]": boolean | undefined;
    };
    legitimateInterests: {
      /**
       * true - Legitimate Interest Established
       * false | undefined - No Legitimate Interest Established
       */
      "[purpose id]": boolean | undefined;
    };
  };
  vendor: {
    consents: {
      /**
       * true - Consent
       * false | undefined - No Consent
       */
      "[vendor id]": boolean | undefined;
    };
    legitimateInterests: {
      /**
       * true - Legitimate Interest Established
       * false | undefined - No Legitimate Interest Established
       */
      "[vendor id]": boolean | undefined;
    };
  };
  specialFeatureOptins: {
    /**
     * true - Special Feature Opted Into
     * false | undefined - Special Feature NOT Opted Into
     */
    "[special feature id]": boolean | undefined;
  };
  publisher: {
    consents: {
      /**
       * true - Consent
       * false | undefined - No Consent
       */
      "[purpose id]": boolean | undefined;
    };
    legitimateInterests: {
      /**
       * true - Legitimate Interest Established
       * false | undefined - No Legitimate Interest Established
       */
      "[purpose id]": boolean | undefined;
    };
    customPurpose: {
      consents: {
        /**
         * true - Consent
         * false | undefined - No Consent
         */
        "[purpose id]": boolean | undefined;
      };
      legitimateInterests: {
        /**
         * true - Legitimate Interest Established
         * false | undefined - No Legitimate Interest Established
         */
        "[purpose id]": boolean | undefined;
      };
    };
    restrictions: {
      "[purpose id]": {
        /**
         * 0 - Not Allowed
         * 1 - Require Consent
         * 2 - Require Legitimate Interest
         */
        "[vendor id]": number;
      };
    };
  };
};

export interface USPAPI {
  __uspapi(
    command: string,
    version: number,
    callback: (...args: any) => void,
    parameter?: any
  ): void;

  __uspapi(
    command: "getUSPData",
    version: 1,
    callback: (uspData: USPData, success: boolean) => void
  ): void;

  __uspapi(
    command: "ping",
    version: 1,
    callback: (uspData: USPData, success: boolean) => void
  ): void;
}

export type WindowWithUSPAPI = Window & USPAPI;

const win = window as any;

export const uspString = new USPrivacyString();

/**
 * Internal function to find a frame, if it exists
 *
 * @param {string} locator - Locator string to use to find frame
 * @returns {object} - Child frame object if found, else null
 */
export function findFrame(locator: string): HTMLElement | HTMLIFrameElement {
  let cmpFrame = null;
  let w: Window;

  for (w = win; w; w = w.parent) {
    try {
      if (w.frames && w.frames[locator]) {
        cmpFrame = w;
        break;
      }
    } catch (e) {
      throw new Error(e);
    }
    if (w === win.top) {
      break;
    }
  }
  return cmpFrame;
}

function createIabStub(locatorName: string): void {
  const addFrame = (): boolean => {
    if (!win.frames[locatorName]) {
      if (document.body) {
        const iframe = document.createElement("iframe");

        iframe.style.cssText = "display:none";
        iframe.name = locatorName;
        document.body.appendChild(iframe);
      } else {
        setTimeout(addFrame, 5);
      }
      return true;
    }
    return false;
  };

  const uspMsgHandler = (event: MessageEvent) => {
    try {
      const msgIsString = typeof event.data === "string";
      let i: USPAPICall["__uspapiCall"];
      let json: USPAPICall;

      try {
        json = msgIsString ? JSON.parse(event.data) : event.data;
      } catch (e) {
        json = {};
      }
      if (typeof json === "object" && json !== null && "__uspapiCall" in json) {
        i = json.__uspapiCall;
        win.__uspapi(
          i.command,
          i.version,
          function (retValue: string, success: boolean) {
            const returnMsg: USPAPIReturn = {};

            returnMsg.__uspapiReturn = {
              returnValue: retValue,
              success,
              callId: i.callId,
            };

            if (event.source instanceof Window) {
              event.source.postMessage(
                msgIsString ? JSON.stringify(returnMsg) : returnMsg,
                "*"
              );
            }
          },
          i.parameter
        );
      }
    } catch (e) {
      // TODO - log error ... errorLogger('Privacy', '_uspMsgHandler', e);
    }
  };

  const usingUspFrame = findFrame("__uspapiLocator");

  /* CCPA IAB handler must always be defined, even in GDPR regions... */
  if (usingUspFrame === null) {
    /* But only for the top frame */
    addFrame();
    win.__uspapi["msgHandler"] = uspMsgHandler;
    win.addEventListener("message", win.__uspapi["msgHandler"], false);
  }
}

export function initPrivacy(enabled = true, countryCode: string) {
  const api = {
    isPrivacyEnabled(): boolean {
      return enabled;
    },
    getUSPString(): string {
      return uspString.getUSPrivacyString();
    },
    getUSPData(): USPData {
      return {
        version: uspString.getVersion(),
        uspString: uspString.getUSPrivacyString(),
      };
    },
    setUSPString(str: string): boolean {
      return uspString.setUSPrivacyString(str);
    },
    ccpaShareData(): string {
      if (CCPA_LOCATIONS.includes(countryCode)) {
        uspString.setUSPrivacyString("1YNN");
      }
      return uspString.getUSPrivacyString();
    },
    ccpaDoNotShare(): string {
      if (CCPA_LOCATIONS.includes(countryCode)) {
        uspString.setUSPrivacyString("1YYN");
      }
      return uspString.getUSPrivacyString();
    },
  };

  // win = win || {};
  win.PSM = win.PSM || {};

  if (enabled) {
    win.__uspapi = function __uspapi(
      command: string,
      version: number,
      callback: (uspData: USPData, success: boolean) => void
    ): void {
      if (command === "getUSPData" && Number(version) === 1) {
        callback({ version, uspString: uspString.getUSPrivacyString() }, true);
      } else if (command === "ccpaDoNotShare") {
        callback({ version, uspString: api.ccpaDoNotShare() }, true);
      } else if (command === "ccpaShareData") {
        callback({ version, uspString: api.ccpaShareData() }, true);
      } else if (command === "ping") {
        callback({ version, uspapiLoaded: true }, true);
      } else {
        callback(null, false);
      }
    };
    createIabStub("__uspapiLocator");

    const str = cookie.get("usprivacy") as string;

    if (str) {
      uspString.setUSPrivacyString(str);
    } else if (CCPA_LOCATIONS.includes(countryCode)) {
      uspString.setUSPrivacyString("1YNN");
    } else {
      uspString.setUSPrivacyString("1---");
    }

    Object.assign(win.PSM, api);
  }

  return api;
}

export function checkOutsideUS(
  categories: Record<string, string> = {}
): Promise<{ shouldLoad: boolean; categories: Record<string, boolean>[] }> {
  return new Promise((resolve) => {
    if (typeof win.__tcfapi !== "function") {
      resolve({
        shouldLoad: false,
        categories: [],
      });
    }

    const defaultCategories = {
      "1": "data-store",
      "3": "ads-person-prof",
      "5": "content-person-prof",
      "6": "consent-person",
      "8": "measure-content",
      "9": "measure-market",
      "10": "product-develop",
      ...categories,
    };

    win.__tcfapi("getTCData", 2, (tcData: TCData, success: boolean) => {
      if (
        success &&
        "purpose" in tcData &&
        "legitimateInterests" in tcData.purpose
      ) {
        const combined = {
          ...tcData.purpose.legitimateInterests,
          ...tcData.purpose.consents,
        };
        const result: Record<string, boolean>[] = [];
        let shouldLoad = true;

        Object.entries(defaultCategories).forEach(([id, name]) => {
          if (combined[id]) {
            result.push({ [name]: combined[id] });
          } else {
            result.push({ [name]: false });
            shouldLoad = false;
          }
        });

        resolve({
          shouldLoad,
          categories: result.concat([
            { "special-purpose-1": true },
            { "special-purpose-2": true },
            { "feature-1": true },
            { "feature-2": true },
            { "feature-3": true },
          ]),
        });
      }
      resolve({
        shouldLoad: false,
        categories: [],
      });
    });
  });
}
