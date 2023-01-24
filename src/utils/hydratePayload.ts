/* eslint-disable @typescript-eslint/no-explicit-any */
import { cookie, findTopDomain } from "./cookie/src";
import { Psm } from "../Psm";
import { PayloadCore } from "../payloadCore";
import {
  cookiesEnabled,
  getReferrer,
  localStorageAccessible,
  detectViewport,
  getScreenResolution,
  detectDocumentSize,
} from "./browser";
import pkg from "../../package.json";
import { registeredSlots } from "../adViewability";
import { engagement } from "../engagement";
import { is3PCookiesEnabled } from "../identity";
import { getInbrainMetrics } from "../inbrain";

const win = window as any;
const doc = document as any;

export type HydrateOptions = {
  psm: Psm;
  core: PayloadCore;
};

export function getAdsGUID(): string {
  if (cookiesEnabled()) {
    const adsGUID = cookie.get("ug") as string;
    return adsGUID;
  }
  return null;
}

export function getKruxId(): string {
  if (localStorageAccessible()) {
    return win.localStorage.getItem("kxkuid");
  } else if (cookiesEnabled()) {
    return cookie.get("kxkuid") as string;
  } else {
    return null;
  }
}

export function getOptanonConsentCookie(): string | null {
  let optanonConsentCookie = null;
  if (cookiesEnabled()) {
    optanonConsentCookie = cookie.get("OptanonConsent") as string;
  }
  return optanonConsentCookie;
}

function grabIDFromAMCVCookie(id) {
  const AMCVCookie = cookie.get(
    "AMCV_000000000000000000000000@ExampleOrg"
  ) as string;

  if (AMCVCookie) {
    // The AMCV cookie stores ids in the following format: key1 | value1 | key2 | value2
    const AMCVSplit = AMCVCookie.split("|");

    // grabs the index of the id key
    const idKeyIndex = AMCVSplit.indexOf(id);

    // condition to ensure the id exists on the AMCV cookie, if not skip and return null below
    if (idKeyIndex != -1) {
      // grabs the id value using the id key index as a base and increments by 1 given
      const idValueIndex = idKeyIndex + 1;

      return AMCVSplit[idValueIndex];
    }
  }
  return null;
}

export function getEcid(): string | null {
  const s_ecid = cookie.get("s_ecid") as string;
  const s_vi = cookie.get("s_vi") as string;
  const ecid = s_ecid ? s_ecid : s_vi ? s_vi : grabIDFromAMCVCookie("MCMID");
  return ecid;
}

export function getConvivaId(): string | null {
  if (localStorageAccessible()) {
    const convivaIdKey = [
      "Conviva/sdkConfig",
      "Conviva.sdkConfig",
    ];
    let clientId = null;
    for (let i = 0; i < convivaIdKey.length; i++) {
      clientId = win.localStorage.getItem(convivaIdKey[i]);
      if (clientId) {
        try {
          const convivaObj = JSON.parse(clientId);
          return convivaObj.clId;
        } catch {
          if (win.location.search.includes("psm_debug")) {
            // console.error('[PSM] Error parsing Conviva ID to JSON');
          }
        }
      }
    }
  }
  return null;
}

/**
 * Returns the metadata property value as defined by its locations
 *
 * @param locations array of locations to look up
 * @param dynDataObj global object to store dynamic data
 * @returns the metadata property value
 */
export function getMetadataPropValue(
  locations: string[],
  dynDataObj?: string
): string | null {
  let propValue = null;
  if (locations) {
    for (let location of locations) {
      if (typeof location !== "string") continue;
      if (dynDataObj) location = location.replace(/^data/, dynDataObj);
      const propArr = location.match(/[^.[\]()]+/g);
      for (let i = 0; i < propArr.length; i++) {
        if (i === 0) propValue = win;
        propValue = propValue[propArr[i]];
        if (typeof propValue === "function") {
          propValue = propValue();
        }
        if (typeof propValue === "undefined") {
          propValue = null;
          break;
        }
      }
      if (propValue) return propValue;
    }
  }
  return propValue;
}

/**
 * Returns page/video metadata properties as defined by its configuration
 *
 * @param metadataConfig configuration to retrieve page/video metadata properties
 * @param type metadata type (page or video)
 * @returns the page/video metadata
 */
export function getContentMetadata(
  metadataConfig: Record<string, any[]>,
  type: string
): any {
  const metadata = {};
  metadataConfig &&
    metadataConfig[type] &&
    metadataConfig[type].forEach((prop) => {
      let propValue = getMetadataPropValue(prop.staticLocations);
      if (!propValue) {
        propValue = getMetadataPropValue(
          prop.dynamicLocations,
          "psmPubSubData." + type
        );
      }
      metadata[prop.name] = propValue;
    });
  return metadata;
}

export const hydratePayload = (psm: Psm, core: PayloadCore) => {
  const totalSize = detectDocumentSize();

  core.setPlatform(psm.config.platform);
  core.addEntry("companyName", "Prism"); // Update with your company name
  core.setBrand(psm.config.brand);
  core.setSubBrand(psm.config.subBrand);
  core.setProductName(psm.config.productName);
  core.setLibrary({
    name: "PrismJS",
    version: pkg.version,
    initConfig: psm.config,
  });
  core.setDevice({
    type: win.navigator.platform,
    userAgent: win.navigator.userAgent,
    totalWidth: totalSize[0],
    totalHeight: totalSize[1],
    screenResolution: getScreenResolution(),
    viewportSize: detectViewport(),
  });
  core.setNavigationProperties({
    url: win.location.href,
    rootDomain: findTopDomain(win.location.href),
    referrer: getReferrer(),
    path: win.location.pathname,
    search: win.location.search,
    title: doc.title,
  });
  core.setClientResolvedIp(psm.location.ip_address);
  core.setLocation({
    city: psm.location.states[0].cities[0],
    state: psm.location.states[0].state,
    country: psm.location.country,
    zip: psm.location.states[0].zipcodes[0],
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || null,
    locale: win.navigator.language,
    language: win.navigator.language.split("-")[0] || null,
  });
  core.setConsentProperties({
    uspString: cookie.get("usprivacy") as string,
    consentRule: psm.consentRule,
    optanonConsent: getOptanonConsentCookie(),
  });
  core.setIABCategories({
    consentCategories: psm.consentCategories,
  });
  core.setUKID(psm.ukid as string);
  core.setEventProperties({
    cookiesEnabled: cookiesEnabled(),
    thirdPartyCookiesEnabled: is3PCookiesEnabled,
    doNotTrack: win.navigator.doNotTrack || win.doNotTrack ? true : false,
    featureFlagValues: psm.getFlags(),
    optimizelyFlagValues: {
      optimizelyInBrainEnabled: win.optimizelyInBrainEnabled || false,
      optimizelyInControlOfInBrain: win.optimizelyInControlOfInBrain || false,
    },
    cookies: cookie.getAll(),
    automatedTest: psm.config.psmEnvironment === "AUTOMATED_TEST",
    heartbeat: engagement,
    inbrain: getInbrainMetrics(),
  });
  core.setSessionProperties(psm.session);
  core.setAdsProperties({
    guid: getAdsGUID(),
    ads: registeredSlots,
  });
  core.setThirdPartyIds({
    csid: psm.getCSID(),
    convivaid: getConvivaId(),
    ecid: getEcid(),
    kruxid: getKruxId(),
    liverampatsid: cookie.get("tok_lr") as string,
    tradedeskuid: cookie.get("tok_ttuid") as string,
    hhid: cookie.get("hhid") as string,
    inid: cookie.get("inid") as string,
    hhidVersion: cookie.get("hhidVersion") as string,
  });
  core.setContentMetadata({
    page: getContentMetadata(psm.config.contentMetadata, "page"),
    video: getContentMetadata(psm.config.contentMetadata, "video"),
  });
};
