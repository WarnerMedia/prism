export const MAX_SESSION_DURATION = 1800000; // 30 minutes in ms
export const HEARTBEAT_INTERVAL = 30000; // 30 seconds in ms
export const AD_IN_VIEW_PERCENTAGE = 50;
export const CCPA_LOCATIONS = ["US", "PR", "VI", "UM", ""];

export const queueOptions = {
  minRetryDelay: 30000,
  maxRetryDelay: 120000,
  maxItems: 5,
  maxAttempts: 10,
  backoffFactor: 2,
  backoffJitter: 0,
};

// TODO: Add URLS here
export const URLS = {
  cdnOrigin: "",
  iFramePath: {
    DEV: "",
    TEST: "",
    PROD: "",
    INTEGRATION: "",
    AUTOMATED_TEST: "",
  },
  thirdPartyCookie: "",
  carouselScript: "",
  carouselStyles: "",
  locate: "",
  featureFlag: {
    DEV: "",
    TEST: "",
    PROD: "",
    INTEGRATION: "",
    AUTOMATED_TEST: "",
  },
  identity: {
    DEV: "",
    TEST: "",
    PROD: "",
    INTEGRATION: "",
    AUTOMATED_TEST: "",
  },
  inbrain: {
    DEV: "",
    TEST: "",
    PROD: "",
    INTEGRATION: "",
    AUTOMATED_TEST: "",
  },
  idresolve: {
    DEV: "",
    TEST: "",
    PROD: "",
    INTEGRATION: "",
    AUTOMATED_TEST: "",
  },
  logs: {
    DEV: "",
    TEST: "",
    PROD: "",
    INTEGRATION: "",
    AUTOMATED_TEST: "",
  },
};

// Default flag values in case there's an issue with the FF client
// TODO: Set Default Flag Values
export const featureFlagDefaults = {
  "identity-onstart": true,
  "identity-oncomplete": true,
  session: true,
  privacy: true,
  telemetry: true,
  "consent-update": true,
  "heartbeat-event": false,
  "pubsub-event": false,
  "outside-us-location-check": false,
  "send-logs": true,
  idresolve: false,
  inbrain: false,
  inBrainTemplateBeta: false,
  inBrainRecommendationsBeta: false,
  // for unit tests
  "test-enabled": true,
  "test-disabled": false,
};
