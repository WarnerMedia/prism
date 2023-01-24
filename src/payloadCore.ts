// Copyright (c) Warner Media, LLC. All rights reserved. Licensed under the MIT license.
// See the LICENSE file for license information.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { v4 as uuid } from "uuid";
import {
  payloadBuilder,
  PayloadData,
  PayloadMap,
} from "./utils/payloadBuilder";
import { PsmConfig } from "./Psm";
import { SlotMetrics } from "./adViewability";

export type Timestamp = number | string;

export type Ids = {
  csid?: string;
  convivaid?: string;
  ecid?: string;
  kruxid?: string;
  liverampatsid?: string;
  tradedeskuid?: string;
  hhid?: string;
  inid?: string;
  hhidVersion?: string;
};

export type Device = {
  type: string;
  name?: string;
  model?: string;
  osName?: string;
  osVersion?: string;
  userAgent: string;
  totalWidth?: number;
  totalHeight?: number;
  screenResolution?: string;
  viewportSize?: string;
};

export type WMUCLibrary = {
  version: string;
  usingPsm: boolean;
  initConfig?: any;
};

export type Library = {
  name: string;
  version: string;
  initConfig: PsmConfig;
  wmucLibrary?: WMUCLibrary;
};

export type NavigationProperties = {
  url: string;
  rootDomain: string;
  referrer: string;
  path: string;
  search: string;
  title: string;
};

export type LocationProperties = {
  city: string;
  state: string;
  country: string;
  zip: string;
  timezone: string;
  locale?: string;
  language: string;
};

export type ConsentProperties = {
  uspString: string;
  consentRule: string;
  optanonConsent?: string;
};

export type EngagementMetrics = {
  totalTime?: number;
  engagedTime: number;
  interval: number;
  maxScrollDepth: number;
  currentScrollPosition: number;
  didScrollUpDuringInterval: boolean;
};

export type InbrainMetrics = {
  id: any;
  promoPosition?: string;
  destinationURL?: string;
  featureFlagValues: any;
};

export type EventProperties = {
  optOut?: boolean;
  doNotSell?: boolean;
  doNotTrack?: boolean;
  cookiesEnabled?: boolean;
  thirdPartyCookiesEnabled?: boolean;
  inPrivateBrowsing?: boolean;
  featureFlagValues: any;
  optimizelyFlagValues: object;
  cookies: any;
  automatedTest?: boolean;
  eventTrigger?: string;
  wmucLibrary?: any;
  heartbeat?: EngagementMetrics;
  inbrain?: InbrainMetrics;
};

export type SessionProperties = {
  isSessionStart: boolean;
  pageloadid: number;
  previousSession?: {
    sessionid: string;
    sessionDuration: number;
    psmLastActiveTimestamp: string;
    psmSessionStart: string;
  };
  psmLastActiveTimestamp: string;
  psmSessionStart: string;
  sessionDuration: number;
  sessionid: string;
};

export type UserConsentEventDetails = {
  usp?: string;
  region?: string;
  tcf?: string;
  time?: Timestamp;
  new?: Record<string, boolean>;
  old?: Record<string, boolean>;
};

export type IABConsentCategories = {
  consentCategories?: Record<string | number, string | boolean>;
};

export type AdsProperties = {
  guid?: string;
  transid?: string;
  ads?: SlotMetrics[];
};

export type ContentMetadata = {
  page?: any;
  video?: any;
};

export interface PayloadCore {
  /**
   * Set a persistent key-value pair to be added to every payload
   *
   * @param key Field name
   * @param value Field value
   */
  addEntry(key: string, value: string | boolean | object | number): void;

  /**
   * Denote the platform from which an event is generated
   */
  setPlatform(platform: string): void;

  /**
   * Add a brand name to every payload
   */
  setBrand(brand: string): void;

  /**
   * Add a sub brand name to every payload
   */
  setSubBrand(subBrand: string): void;

  /**
   * Add a product name to every payload
   */
  setProductName(productName: string): void;

  /**
   * Add an Unknown Identifier value to every payload
   */
  setUKID(ukid: string): void;

  /**
   * Add a set of third-party identifiers to every payload
   */
  setThirdPartyIds(ids: Partial<Ids>): void;

  /**
   * Sets all of the useful device data available from window.navigator
   */
  setDevice(device: Device): void;

  /**
   * Capture a set of location details from the page
   */
  setNavigationProperties(ctx: NavigationProperties): void;

  /**
   * Add IP address resolved from a geolocation call to every payload
   */
  setClientResolvedIp(ip: string): void;

  /**
   * Add geolocation information to every payload
   */
  setLocation(location: LocationProperties): void;

  /**
   * Add consent state to every payload
   */
  setConsentProperties(props: ConsentProperties): void;

  /**
   * Add IAB consent categories every payload
   */
  setIABCategories(props: IABConsentCategories): void;

  /**
   * Add Prism-specific metadata to every payload
   */
  setLibrary(library: Library): void;

  /**
   * Grabs optOut, doNotSell, and featureFlagValues and adds them to the eventProperties object
   */
  setEventProperties(props: EventProperties): void;

  /**
   * Add user session info to every payload
   */
  setSessionProperties(props: SessionProperties): void;

  /**
   * Add ad properties info to every payload
   */
  setAdsProperties(props: AdsProperties): void;

  /**
   * Add content metadata to every payload
   */
  setContentMetadata(metadata: ContentMetadata): void;

  /**
   * Record an event denoting a page view / visit
   */
  trackAppLoad(ts?: Timestamp, cb?: (payload: PayloadMap) => void): PayloadData;

  /**
   * Log that the user is still viewing the current page
   */
  trackHeartbeat(
    ts?: Timestamp,
    cb?: (payload: PayloadMap) => void
  ): PayloadData;

  /**
   * Log event that comes from PubSub subscription
   */
  trackPubSub(
    eventName: string,
    ts?: Timestamp,
    cb?: (payload: PayloadMap) => void
  ): PayloadData;

  /**
   * Log that a new identity has been generated for the user
   */
  trackIdentityRegistration(
    eventName: string,
    ts?: Timestamp,
    cb?: (payload: PayloadMap) => void
  ): PayloadData;

  /**
   * Log that the auth token has been changed
   */
  trackTokenEvent(
    eventName: string,
    ts?: Timestamp,
    cb?: (payload: PayloadMap) => void
  ): PayloadData;

  /**
   * Log that the user has exited the page
   */
  trackPageExit(
    eventTrigger: string,
    ts?: Timestamp,
    cb?: (payload: PayloadMap) => void
  ): PayloadData;

  /**
   * Log that the user has updated consent for privacy
   */
  trackConsentUpdated(
    eventTrigger: string,
    eventDetails?: UserConsentEventDetails,
    ts?: Timestamp,
    cb?: (payload: PayloadMap) => void
  ): PayloadData;

  /**
   * Log that the user has granted consent for privacy
   */
  trackConsentGranted(
    ts?: Timestamp,
    cb?: (payload: PayloadMap) => void
  ): PayloadData;

  /**
   * Log that the user has withdrawn consent for privacy
   */
  trackConsentWithdrawn(
    ts?: Timestamp,
    cb?: (payload: PayloadMap) => void
  ): PayloadData;

  /**
   * Log the inbrain events
   */
  trackInbrain(
    eventName: string,
    ts?: Timestamp,
    cb?: (payload: PayloadMap) => void
  ): PayloadData;
}

/**
 * Generate or transform a timestamp.
 *
 * @param timestamp optional timestamp number (UNIX time) or date string
 */
function getTimestamp(timestamp?: Timestamp): string {
  if (timestamp == null || timestamp == undefined) {
    return new Date().toISOString();
  }
  return new Date(timestamp).toISOString();
}

/**
 * Returns a copy of a JSON object with null and undefined properties removed
 *
 * @param payload JSON object to clean
 * @returns A cleaned copy of the JSON object
 */
export const removeEmptyProperties = (payload: PayloadMap): PayloadMap => {
  const result = {};

  if (Array.isArray(payload)) {
    return payload;
  } else {
    Object.entries(payload).forEach(([key, value]) => {
      if (value === Object(value)) {
        result[key] = removeEmptyProperties(value as PayloadMap);
      } else if (value !== null && value !== undefined) {
        result[key] = payload[key];
      }
    });
  }

  return result;
};

/**
 * Prism Core factory. This factory function returns a core API object, common to all Prism modules.
 *
 * @param callback Function to be applied to every payload fragment
 * @returns the Prism core
 */
export function payloadCore(
  callback?: (data: PayloadData) => void
): PayloadCore {
  // Map of key-value pairs that get added to every payload
  const payloadMap: PayloadMap = {};

  /**
   * Set a persistent key-value pair to be added to every payload
   * @param key Field name
   * @param value Field value
   */
  const addEntry = (key: string, value: string | boolean | object | number) => {
    payloadMap[key] = value;
  };

  /**
   * Gets called by every "track" method
   *
   * @param data The payload
   * @param timestamp Timestamp of the event
   * @param cb A callback function triggered after an event is tracked
   */
  const track = (
    data: PayloadData,
    timestamp?: Timestamp,
    cb?: (data: PayloadMap) => void
  ): PayloadData => {
    // add all common pairs
    data.addMap(removeEmptyProperties(payloadMap));
    // generate an event timestamp
    data.add("eventTimestamp", getTimestamp(timestamp));
    // generate an event ID
    data.add("eventId", uuid());

    if (typeof callback === "function") {
      callback(data);
    }

    try {
      cb && cb(data.build());
    } catch (err) {
      console.warn("[PSM]: error running custom callback");
    }

    return data;
  };

  return {
    addEntry,

    setPlatform(platform: string): void {
      addEntry("platform", platform);
    },

    setBrand(brand: string): void {
      addEntry("brand", brand);
    },

    setSubBrand(brand: string): void {
      addEntry("subBrand", brand);
    },

    setProductName(productName: string): void {
      addEntry("productName", productName);
    },

    setUKID(ukid: string): void {
      addEntry("ukid", ukid);
    },

    setThirdPartyIds(ids: Partial<Ids>): void {
      addEntry("ids", ids);
    },

    setDevice(device: Device): void {
      addEntry("device", device);
    },

    setNavigationProperties(props: NavigationProperties): void {
      addEntry("navigationProperties", props);
    },

    setClientResolvedIp(ip: string): void {
      addEntry("clientResolvedIp", ip);
    },

    setLocation(location: LocationProperties): void {
      addEntry("location", location);
    },

    setConsentProperties(props: ConsentProperties): void {
      addEntry("consentProperties", props);
    },

    setIABCategories(props: IABConsentCategories): void {
      addEntry("iabConsentCategories", props);
    },

    setLibrary(library: Library): void {
      const win = window as any;
      const wmObject = win.WM as any;
      const wmuc = wmObject?.UserConsent as any;
      let wmucLibrary = null;

      if (wmuc) {
        wmucLibrary = {
          version: wmuc.getVersion(),
          usingPsm: wmuc.usingPSM(),
          initConfig: wmObject.UserConsentConfig,
        };
      }

      addEntry("library", { wmucLibrary, ...library });
    },

    setEventProperties(props: EventProperties): void {
      addEntry("eventProperties", props);
    },

    setSessionProperties(props: SessionProperties): void {
      addEntry("session", props);
    },

    setAdsProperties(props: AdsProperties): void {
      addEntry("adsProperties", props);
    },

    setContentMetadata(metadata: ContentMetadata): void {
      addEntry("contentMetadata", metadata);
    },

    trackAppLoad(
      ts?: Timestamp,
      cb?: (payload: PayloadMap) => void
    ): PayloadData {
      const data = payloadBuilder();

      data.add("eventType", "telemetry");
      data.add("eventName", "appLoad");

      return track(data, ts, cb);
    },

    trackHeartbeat(
      ts?: Timestamp,
      cb?: (payload: PayloadMap) => void
    ): PayloadData {
      const data = payloadBuilder();

      data.add("eventType", "telemetry");
      data.add("eventName", "heartbeat");

      return track(data, ts, cb);
    },

    trackPubSub(
      eventName: string,
      ts?: Timestamp,
      cb?: (payload: PayloadMap) => void
    ): PayloadData {
      const data = payloadBuilder();
      const eventProperties = {
        eventTrigger: "pubsub",
      };

      data.add("eventType", "telemetry");
      data.add("eventName", eventName);
      addEntry("eventProperties", eventProperties);

      return track(data, ts, cb);
    },

    trackIdentityRegistration(
      eventName: string,
      ts?: Timestamp,
      cb?: (payload: PayloadMap) => void
    ): PayloadData {
      const data = payloadBuilder();

      data.add("eventType", "identity");
      data.add("eventName", eventName);

      return track(data, ts, cb);
    },

    trackTokenEvent(
      eventName: string,
      ts?: Timestamp,
      cb?: (payload: PayloadMap) => void
    ): PayloadData {
      const data = payloadBuilder();

      data.add("eventType", "token");
      data.add("eventName", eventName);

      return track(data, ts, cb);
    },

    trackConsentUpdated(
      eventTrigger: string,
      eventDetails?: UserConsentEventDetails,
      ts?: Timestamp,
      cb?: (payload: PayloadMap) => void
    ): PayloadData {
      const data = payloadBuilder();
      const eventProperties = {
        eventTrigger,
        uspString: eventDetails?.usp,
        region: eventDetails?.region,
      };

      data.add("eventType", "privacy");
      data.add("eventName", "consent update");
      addEntry("eventProperties", eventProperties);

      return track(data, ts, cb);
    },

    trackConsentGranted(
      ts?: Timestamp,
      cb?: (payload: PayloadMap) => void
    ): PayloadData {
      const data = payloadBuilder();

      data.add("eventType", "privacy");
      data.add("eventName", "ccpaShareData");

      return track(data, ts, cb);
    },

    trackConsentWithdrawn(
      ts?: Timestamp,
      cb?: (payload: PayloadMap) => void
    ): PayloadData {
      const data = payloadBuilder();

      data.add("eventType", "privacy");
      data.add("eventName", "ccpaShareData");

      return track(data, ts, cb);
    },

    trackPageExit(
      eventTrigger: string,
      ts?: Timestamp,
      cb?: (payload: PayloadMap) => void
    ): PayloadData {
      const data = payloadBuilder();

      data.add("eventType", "telemetry");
      data.add("eventName", "pageExit");
      data.add("eventTrigger", eventTrigger);

      return track(data, ts, cb);
    },

    trackInbrain(
      eventName: string,
      ts: Timestamp,
      cb?: (payload: PayloadMap) => void
    ): PayloadData {
      const data = payloadBuilder();

      data.add("eventType", "telemetry");
      data.add("eventName", eventName);
      return track(data, ts, cb);
    },
  };
}
