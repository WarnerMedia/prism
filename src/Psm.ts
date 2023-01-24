// Copyright (c) Warner Media, LLC. All rights reserved. Licensed under the MIT license.
// See the LICENSE file for license information.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { v4 as uuid } from "uuid";
import { cookie, findTopDomain } from "./utils/cookie/src";
import Queue from "@segment/localstorage-retry";
import {
  UkidValue,
  CrossSiteIdValue,
  initUKID,
  initCrossSiteId,
} from "./identity";
import { initInbrain } from "./inbrain";
import {
  PayloadCore,
  payloadCore,
  SessionProperties,
  Ids,
  UserConsentEventDetails,
  AdsProperties,
  ConsentProperties,
  Device,
  Library,
  LocationProperties,
  NavigationProperties,
} from "./payloadCore";
import {
  initAdViewListeners,
  setAdViewMetrics,
  resetAdViewMetrics,
  registeredSlots,
} from "./adViewability";
import {
  CCPA_LOCATIONS,
  URLS,
  MAX_SESSION_DURATION,
  featureFlagDefaults,
  queueOptions,
} from "./utils/constants";
import { getReferrer, setBrowser } from "./utils/browser";
import {
  getAdsGUID,
  getConvivaId,
  getEcid,
  getKruxId,
  getOptanonConsentCookie,
  hydratePayload,
} from "./utils/hydratePayload";
import { processQueue } from "./utils/processQueue";
import { sendRequest } from "./utils/sendRequest";
import { createLogger, error, warn, info, debug } from "./utils/logger";
import { checkOutsideUS } from "./privacy";
import {
  initEngagementEvents,
  setEngagementMetrics,
  resetHbInterval,
} from "./engagement";
import { initHeartbeat } from "./heartbeat";
import pkg from "../package.json";

export interface PsmConfig {
  bootstrapVersion?: string;
  iab_categories?: [];
  platform?: string;
  brand: string;
  subBrand?: string;
  productName?: string;
  psmEnvironment: string;
  environment?: string;
  cookieDomain?: string;
  cookieSameSite?: string;
  cookieSecure?: boolean;
  cookieExpires?: number;
  countryCode?: string;
  topics?: {
    page: string[];
    video: string[];
  };
  contentMetadata?: {
    page: any[];
    video: any[];
  };
  inbrainBetaURL?: string;
  psmTelEnabled?: boolean;
  psmTelVersion?: string;
  psmTelSchemaVersion?: string;
  psmTelPlayerName?: string;
  psmTelStreamType?: string;
  apiEndpoint?: string;
}

export interface Geolocation {
  asn: {
    id: string;
    name: string;
  };
  continent: string;
  continentName: string;
  country: string;
  country_alpha2: string;
  country_alpha3: string;
  ip_address: string;
  lat?: string;
  lon?: string;
  proxy: null | string;
  states: {
    cities: string[];
    counties: string[];
    state: string;
    zipcodes: string[];
  }[];
}

export interface ConsentObject {
  usp: string;
}

export interface IdResolveResponse {
  hhid?: string;
  inid?: string;
  segs?: string;
  hhidVersion?: number;
  resolvedUserData: { [key: string]: any };
}
export interface IQueryFeatureResult {
  enabled: boolean;
  flagId: string;
  flagName?: string;
  updatedSinceLastQuery?: boolean;
  userId?: string | undefined;
  userIdType?: string;
}

export interface IQueryAllResponse {
  anyFlagsUpdatedSinceLastQuery: boolean;
  results: IQueryFeatureResult[];
}

const win = window as any;
const doc = win.document as any;

export class Psm {
  /**
   * Flag set to true when Prism has initialized
   */
  ready = false;

  /**
   * Default values from Prism config
   */
  config: PsmConfig = {
    platform: "web",
    brand: "",
    subBrand: "",
    productName: "",
    psmEnvironment: undefined,
    cookieSameSite: "Lax",
    cookieSecure: false,
    cookieExpires: 31536000000, // 1 year in miliseconds
    psmTelEnabled: true,
  };

  /**
   * Feature flags
   */
  flags: IQueryFeatureResult[] = [];

  /**
   * Request queue for privacy API
   */
  requestQueue: Queue;

  /**
   * Geolocation API response
   */
  location: Partial<Geolocation> = {
    asn: {
      id: "",
      name: "",
    },
    continent: "",
    continentName: "",
    country: "",
    country_alpha2: "",
    country_alpha3: "",
    ip_address: "",
    lat: "",
    lon: "",
    proxy: null,
    states: [
      {
        cities: [],
        counties: [],
        state: "",
        zipcodes: [],
      },
    ],
  };

  /**
   * UKID from cookie or generated when Prism is initialized
   */
  ukid: UkidValue = null;

  /**
   * CSID from cookie or generated when Prism is initialized
   */
  csid: CrossSiteIdValue = null;

  /**
   * Country code value for location-guarded logic
   */
  countryCode: string;

  /**
   * Session properties as determine on initialization
   */
  session: SessionProperties;

  /**
   * User's browser -- currently only sets to Safari or Unknown
   */
  browser: string;

  /**
   * Consent Rule to track how Prism was loaded based on user consent
   */
  consentRule = "Other";

  /**
   * Consent categories used loading Prism for non-US users
   */
  consentCategories: Record<string, boolean>;

  constructor() {
    // win = win || {};
    win.PSM = win.PSM || {};
    win.PSM.initPsm = this.initPsm.bind(this);
    win.PSM.getVersion = this.getVersion.bind(this);
    win.PSM.getUKID = this.getUKID.bind(this);
    win.PSM.getCSID = this.getCSID.bind(this);
    win.PSM.getConfig = this.getConfig.bind(this);
    win.PSM.getFlags = this.getFlags.bind(this);
    win.PSM.getAdsProperties = this.getAdsProperties.bind(this);
    win.PSM.getConsentProperties = this.getConsentProperties.bind(this);
    win.PSM.getBrand = this.getBrand.bind(this);
    win.PSM.getSubBrand = this.getSubBrand.bind(this);
    win.PSM.getDeviceProperties = this.getDeviceProperties.bind(this);
    win.PSM.getIds = this.getIds.bind(this);
    win.PSM.getLibrary = this.getLibrary.bind(this);
    win.PSM.getLocationProperties = this.getLocationProperties.bind(this);
    win.PSM.getDeviceProperties = this.getDeviceProperties.bind(this);
    win.PSM.getNavigationProperties = this.getNavigationProperties.bind(this);
    win.PSM.getSessionProperties = this.getSessionProperties.bind(this);
    win.PSM.isIdentityOnStartEnabled = () => this.queryFlag("identity-onstart");
    win.PSM.isIdentityOnCompleteEnabled = () =>
      this.queryFlag("identity-oncomplete");
    win.PSM.isPrivacyEnabled = () => this.queryFlag("privacy");
    win.PSM.isTelemetryEnabled = () => this.queryFlag("telemetry");
  }

  async initPsm(config: PsmConfig): Promise<void> {
    if (this.ready) return;
    this.config = Object.assign(this.config, config);

    createLogger(this);

    if (typeof config === "undefined") {
      const err = new Error(
        "[PSM]: Please provide a valid configuration to initPsm"
      );
      error({
        err,
        eventType: "configValidation",
        methodName: "initPsm",
      });
      throw err;
    }

    const init = async () => {
      const env = config.psmEnvironment.toUpperCase();
      const core: PayloadCore = payloadCore();

      this.requestQueue = new Queue(
        "prismCE",
        queueOptions,
        processQueue(URLS.identity[env])
      );

      if (win.location !== window.parent.location) {
        // detecting if Prism is loading from iFrame
        // console.log('[PSM]: Failing to load Prism from iFrame');
        return;
      }

      this.ukid = initUKID();
      this.csid = await initCrossSiteId(env);

      // Set session properties with initial page load parameter
      this.setSessionProperties(true);

      // Resolve IDs
      await this.resolveIds();

      hydratePayload(this, core);

      core.trackIdentityRegistration(
        "identity on page start",
        new Date().toISOString(),
        (data) => {
          if (this.queryFlag("identity-onstart")) {
            this.requestQueue.addItem(data);
            this.resetNewSessionFields();
          }

          if (env === "AUTOMATED_TEST") {
            win.localStorage.setItem("payload-on-start", JSON.stringify(data));
          }
        }
      );
      win.addEventListener("load", () => {
        this.setSessionProperties();
        hydratePayload(this, core);
        core.trackIdentityRegistration(
          "identity on page complete",
          new Date().toISOString(),
          (data) => {
            if (this.queryFlag("identity-oncomplete")) {
              this.requestQueue.addItem(data);

              if (env === "AUTOMATED_TEST") {
                win.localStorage.setItem(
                  "payload-on-complete",
                  JSON.stringify(data)
                );
              }
              this.resetNewSessionFields();
            }
          }
        );
      });
      doc.addEventListener(
        "userConsentChanged",
        (data: { detail: UserConsentEventDetails }) => {
          debug({
            message: "userConsentChanged event received",
            methodName: "initPsm",
            eventType: "privacy",
            context: { eventDetails: data.detail },
          });
          this.setSessionProperties();
          hydratePayload(this, core);
          core.trackConsentUpdated(
            "userConsentChanged",
            data.detail,
            new Date().toISOString(),
            (data) => {
              if (this.queryFlag("consent-update")) {
                debug({
                  message: "Consent Update event registered",
                  methodName: "initPsm",
                  eventType: "privacy",
                  context: { payload: data },
                });
                this.requestQueue.addItem(data);
                this.resetNewSessionFields();
              }
            }
          );
        }
      );

      if (this.queryFlag("heartbeat-event")) {
        initAdViewListeners();
        initEngagementEvents();
        // Send event only if ukid is not unknown
        if (this.ukid !== "Unknown") {
          const sendPageExitHB = () => {
            setEngagementMetrics();
            hydratePayload(this, core);
            core.trackPageExit(
              "visibilitychange",
              new Date().toISOString(),
              (data) => {
                data.sentAtTimestamp = new Date().toISOString();
                win.navigator.sendBeacon(
                  URLS.identity[env],
                  JSON.stringify(data)
                );
              }
            );
          };
          // heartbeat for tracking total time
          initHeartbeat(() => {
            setAdViewMetrics();
            setEngagementMetrics();
            this.setSessionProperties();
            hydratePayload(this, core);
            core.trackHeartbeat(new Date().toISOString(), (data) => {
              this.requestQueue.addItem(data);
              this.resetNewSessionFields();
              resetHbInterval();
              resetAdViewMetrics();
            });
          }, sendPageExitHB);

          // Add event listeners for pageExit
          win.addEventListener("beforeunload", () => {
            setEngagementMetrics();
            hydratePayload(this, core);
            core.trackPageExit(
              "beforeunload",
              new Date().toISOString(),
              (data) => {
                data.sentAtTimestamp = new Date().toISOString();
                win.navigator.sendBeacon(
                  URLS.identity[env],
                  JSON.stringify(data)
                );
              }
            );
          });

          win.addEventListener("pagehide", (event) => {
            if (!event.persisted) {
              setEngagementMetrics();
              hydratePayload(this, core);
              core.trackPageExit(
                "pagehide",
                new Date().toISOString(),
                (data) => {
                  data.sentAtTimestamp = new Date().toISOString();
                  win.navigator.sendBeacon(
                    URLS.identity[env],
                    JSON.stringify(data)
                  );
                }
              );
            }
          });
        }
      }

      if (this.queryFlag("pubsub-event")) {
        for (const type in config.topics) {
          config.topics[type].forEach((topic: string) => {
            win.PubSub &&
              win.PubSub.subscribe(topic, (...args: any[]) => {
                let data = typeof args[1] === "object" ? args[1] : args[0];
                data =
                  Object.keys(data).length < 3 && data.video
                    ? data.video
                    : data;
                win.psmPubSubData = win.psmPubSubData || {};
                win.psmPubSubData[type] = win.psmPubSubData[type] || {};
                Object.assign(win.psmPubSubData[type], data);
                hydratePayload(this, core);
                core.trackPubSub(topic, new Date().toISOString(), (data) => {
                  this.requestQueue.addItem(data);
                  this.resetNewSessionFields();
                });
              });
          });
        }
      }

      this.requestQueue.start();

      try {
        initInbrain(this, core);
      } catch (err) {
        // add logging
        error({
          err,
          eventType: "inbrain",
          methodName: "initInbrain",
        });
      }

      this.ready = true;
    };

    this.validateConfig(config);

    this.countryCode =
      this.hasProperty("countryCode", config) &&
      typeof config.countryCode !== "undefined" &&
      this.config.countryCode.length
        ? this.config.countryCode.toUpperCase()
        : "";

    if (CCPA_LOCATIONS.includes(this.countryCode) || this.countryCode === "") {
      try {
        this.location = await sendRequest(URLS.locate);
        this.countryCode =
          this.countryCode === ""
            ? this.location.country_alpha2
            : this.countryCode;
      } catch (err) {
        error({
          err,
          methodName: "sendRequest",
          eventType: "geolocation",
        });
        this.location.country = undefined;
        this.location.country_alpha2 = undefined;
      }
    }

    try {
      const { shouldLoad, categories } = await checkOutsideUS();
      if (CCPA_LOCATIONS.includes(this.countryCode)) {
        this.consentRule = "US";
      } else if (shouldLoad && categories.length > 0) {
        this.consentRule = "GDPR";
      }
      this.consentCategories = categories.reduce((acc, obj) => {
        return {
          ...acc,
          ...obj,
        };
      }, {});
    } catch (err) {
      // console.log('[PSM]: Error encountered during location check', err);
      this.consentCategories = {};
    }

    cookie.options({
      domain: this.config.cookieDomain,
      maxage: this.config.cookieExpires,
      path: "/",
      samesite: this.config.cookieSameSite,
      secure: this.config.cookieSecure,
    });

    this.browser = setBrowser();

    try {
      const flags = await sendRequest(
        URLS.featureFlag[this.config.environment]
      );
      this.flags = flags.results;
      // Check Outside US feature flag
      if (
        this.consentRule === "US" ||
        (this.consentRule === "GDPR" &&
          this.queryFlag("outside-us-location-check"))
      ) {
        await init();
      }
    } catch (err) {
      error({
        err,
        methodName: "queryAllFeatureFlags",
        eventType: "featureFlagging",
      });
      await init();
    }
  }

  setIsInExperiment(name: string) {
    const value = this.queryFlag(name);
    return cookie.set(name, value);
  }

  async resolveIds() {
    // Confirm IDR service is enabled
    if (!this.queryFlag("idresolve")) {
      debug({
        message: "[PSM]: idresolve flag is disabled",
        methodName: "resolveIds",
        eventType: "idresolution",
      });
      return false;
    }

    // Check if previous IDR request happened within 24 hours
    const idrTimestampCookie = cookie.get("idrTimestamp") as string | null;
    if (idrTimestampCookie) {
      const idrTimestamp = new Date(idrTimestampCookie);
      const currentTimestamp = new Date();
      const idrLifespan =
        (currentTimestamp.getTime() - idrTimestamp.getTime()) / 1000 / 60 / 60; // Get lifespan in hours

      if (idrLifespan < 24) {
        info({
          message: `[PSM]: IDR lifespan, ${idrLifespan}, less than 24 hours`,
          methodName: "resolveIds",
          eventType: "idresolution",
        });
        return false;
      }
    }
    const idrRequestBody = {
      ukid: this.getUKID(),
      // TODO: Replace with abstracted `getThirdPartyIds` method when it exists
      ids: {
        csid: this.getCSID(),
        convivaid: getConvivaId(),
        ecid: getEcid(),
        kruxid: getKruxId(),
      },
    };

    // Make IDR request
    try {
      const idrResponse: IdResolveResponse = await sendRequest(
        URLS.idresolve[this.config.psmEnvironment],
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(idrRequestBody),
        }
      );
      const { hhid, inid, segs, hhidVersion } = idrResponse;

      if (!hhid) {
        cookie.remove("hhid");
      }

      if (!segs) {
        localStorage.removeItem("wmsegs");
      }

      hhid && cookie.set("hhid", hhid);
      hhidVersion && cookie.set("hhidVersion", hhidVersion.toString());
      inid && cookie.set("inid", inid);
      segs && localStorage.setItem("wmsegs", segs);
    } catch (err) {
      debug({
        err,
        eventType: "idresolution",
        methodName: "sendRequest",
      });
    }
    // Set IDR timestamp regardless of IDR response
    cookie.set("idrTimestamp", new Date());

    return true;
  }

  getPageLoadId(sessionStart, initialPageLoad) {
    const pageLoadIdCookie = cookie.get("psmPageLoadId") as string | null;
    const pageLoadIdInt = pageLoadIdCookie && parseInt(pageLoadIdCookie);
    let pageLoadId = pageLoadIdInt;
    if (sessionStart) {
      pageLoadId = 1;
    }
    if (!sessionStart && initialPageLoad && pageLoadIdInt) {
      pageLoadId = pageLoadIdInt + 1;
    }
    return pageLoadId;
  }

  setSessionProperties(initialPageLoad = false) {
    const currentTimestamp = new Date();
    let sessionProperties: SessionProperties = {
      isSessionStart: true,
      pageloadid: this.getPageLoadId(true, initialPageLoad),
      psmLastActiveTimestamp: currentTimestamp.toISOString(),
      psmSessionStart: currentTimestamp.toISOString(),
      sessionDuration: 0,
      sessionid: uuid(),
    };

    // Get all stored session info
    const prevSessionId = cookie.get("psmSessionId") as string | null;
    const prevSessionStartCookie = cookie.get("psmSessionStart") as
      | string
      | null;
    const prevLastActiveTimestampCookie = cookie.get(
      "psmLastActiveTimestamp"
    ) as string | null;

    if (prevSessionId !== null) {
      const prevLastActiveTimestamp = new Date(prevLastActiveTimestampCookie);
      const prevSessionStartTimestamp = new Date(prevSessionStartCookie);
      const timeSinceLastActivity =
        currentTimestamp.getTime() - prevLastActiveTimestamp.getTime(); // time past in miliseconds

      // if session >max time, then create new session
      if (timeSinceLastActivity > MAX_SESSION_DURATION) {
        info({
          message: `[PSM]: Session ${prevSessionId} timed out after ${
            timeSinceLastActivity / 1000
          } seconds.`,
          methodName: "setSessionProperties",
          eventType: "session",
        });
        sessionProperties = {
          ...sessionProperties,
          previousSession: {
            psmLastActiveTimestamp: prevLastActiveTimestampCookie,
            psmSessionStart: prevSessionStartCookie,
            sessionDuration:
              (prevLastActiveTimestamp.getTime() -
                prevSessionStartTimestamp.getTime()) /
              1000,
            sessionid: prevSessionId,
          },
        };
        // If session <max time, update psmLastActive timestamp
      } else {
        debug({
          message: `[PSM]: Session ${prevSessionId} still active after ${
            timeSinceLastActivity / 1000
          } seconds. Updating last active timestamp.`,
          methodName: "setSessionProperties",
          eventType: "session",
        });
        sessionProperties = {
          isSessionStart: false,
          pageloadid: this.getPageLoadId(false, initialPageLoad),
          psmLastActiveTimestamp: currentTimestamp.toISOString(),
          psmSessionStart: prevSessionStartCookie,
          sessionDuration:
            (currentTimestamp.getTime() - prevSessionStartTimestamp.getTime()) /
            1000,
          sessionid: prevSessionId,
        };
      }
    } else {
      info({
        message: `[PSM]: Creating new session`,
        methodName: "setSessionProperties",
        eventType: "session",
      });
    }

    // Set all session cookie values
    cookie.set("psmSessionId", sessionProperties.sessionid);
    cookie.set(
      "psmLastActiveTimestamp",
      sessionProperties.psmLastActiveTimestamp
    );
    cookie.set("psmSessionStart", sessionProperties.psmSessionStart);
    cookie.set("psmPageLoadId", JSON.stringify(sessionProperties.pageloadid));

    this.session = sessionProperties;
    return;
  }

  // Clears isSessionStart/previousSession properties
  // Called after each queue addition so it's only cleared after sending
  resetNewSessionFields() {
    this.session = {
      ...this.session,
      isSessionStart: false,
      previousSession: null,
    };
  }

  getVersion() {
    return pkg.version;
  }

  getConfig() {
    return this.config;
  }

  getFlags() {
    return (
      this.flags &&
      this.flags.reduce(
        (flagObj, curr) => ({ ...flagObj, [curr.flagId]: curr }),
        {}
      )
    );
  }

  getUKID() {
    return (cookie.get("UKID") as string) || "Unknown";
  }

  getCSID() {
    const data = cookie.get("CSID") as CrossSiteIdValue;

    if (data && typeof data === "object" && "csid" in data && "ukid" in data) {
      return data.csid;
    }
    return (data as string) || "Unknown";
  }

  getAdsProperties(): AdsProperties {
    return {
      guid: getAdsGUID() || "",
      ads: registeredSlots,
    };
  }

  getConsentProperties(): ConsentProperties {
    return {
      uspString: cookie.get("usprivacy") as string,
      consentRule: this.consentRule,
      optanonConsent: getOptanonConsentCookie() || "",
    };
  }

  getBrand(): string {
    return this.config.brand;
  }

  getSubBrand(): string {
    return this.config.subBrand;
  }

  getDeviceProperties(): Device {
    return {
      type: win.navigator.platform,
      userAgent: win.navigator.userAgent,
    };
  }

  getIds(): Ids {
    return {
      csid: this.getCSID(),
      convivaid: getConvivaId() || "",
      ecid: getEcid() || "",
      kruxid: getKruxId() || "",
      liverampatsid: cookie.get("tok_lr") as string,
      hhid: cookie.get("hhid") as string,
      inid: cookie.get("inid") as string,
    };
  }

  getLibrary(): Library {
    return {
      name: "Prism JS",
      version: pkg.version,
      initConfig: this.config,
    };
  }

  getLocationProperties(): LocationProperties {
    return {
      city: this.location.states[0].cities[0],
      state: this.location.states[0].state,
      country: this.location.country,
      zip: this.location.states[0].zipcodes[0],
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || null,
      locale: win.navigator.language,
      language: win.navigator.language.split("-")[0] || null,
    };
  }

  getNavigationProperties(): NavigationProperties {
    return {
      url: win.location.href,
      rootDomain: findTopDomain(win.location.href),
      referrer: getReferrer(),
      path: win.location.pathname,
      search: win.location.search,
      title: doc.title,
    };
  }

  getSessionProperties(): SessionProperties {
    return this.session;
  }

  queryFlag(flagId: string): boolean {
    let flagEnabled: boolean = featureFlagDefaults[flagId] || false;
    try {
      const { enabled } = this.flags.find((flag) => {
        return flag.flagId === flagId;
      });

      flagEnabled = enabled;
    } catch (err) {
      warn({
        err,
        methodName: "queryFlag",
        eventType: "featureFlagging",
      });
    }

    return flagEnabled;
  }

  validateConfig(config: Partial<PsmConfig>) {
    const errors: string[] = [];

    if (!this.hasProperty("psmEnvironment", config))
      errors.push("Please specify your psmEnvironment.");
    if (!this.hasProperty("brand", config))
      errors.push("Please specify your brand.");

    if (errors.length) {
      const err = new Error(
        ["[PSM]: Invalid configuration provided."].concat(errors).join("\n")
      );

      error({
        err,
        methodName: "validateConfig",
        eventType: "configValidation",
      });
      throw err;
    }
  }

  hasProperty(prop: string, obj: any) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
  }
}
