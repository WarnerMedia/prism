import { PsmConfig, Psm } from "../../Psm";
import * as logger from "../logger";
import {
  clearMockDate,
  mockDate,
  mockStorage,
  isoDate,
  mockUserAgent,
  clearMockUserAgent,
} from "../testUtils";
import { cookie } from "../cookie/src";

jest.mock("../../../package.json", () => ({
  version: "0.0.0",
}));

jest.mock("../sendRequest", () => ({
  sendRequest: jest.fn().mockResolvedValue({
    asn: { id: "1111", name: "example llc" },
    continent: "NA",
    continentName: "North America",
    country: "US",
    country_alpha2: "US",
    country_alpha3: "USA",
    ip_address: "192.0.2.0",
    lat: "50.00",
    lon: "-50.00",
    proxy: null,
    states: [
      { cities: ["ATLANTA"], counties: [], state: "GA", zipcodes: ["33333"] },
    ],
  }),
}));

jest.mock("../../privacy", () => ({
  ...(jest.requireActual("../../privacy") as object),
  checkOutsideUS: jest
    .fn()
    .mockResolvedValue([
      { "special-purpose-1": true },
      { "special-purpose-2": true },
      { "feature-1": true },
      { "feature-2": true },
      { "feature-3": true },
    ]),
}));

const err = {
  message: "test error",
  stack: "heres our stack",
  context: {
    requestUrl: "http://psm.test",
    requestHTTPStatus: 208302834,
    requestPayload: "payload",
    requestHeaders: "headers",
    requestMethod: "POST",
    responsePayload: "{}",
  },
};

describe("logger", () => {
  const validLogOptions: Partial<logger.LogOptions> = {
    methodName: "testMethod",
    eventType: "whatever",
  };
  const psm: Partial<Psm> = {
    ready: true,
    config: {
      brand: "Prism",
      subBrand: "",
      cookieDomain: ".psm.test",
      cookieExpires: 31536000000,
      cookieSameSite: "Lax",
      cookieSecure: false,
      psmEnvironment: "TEST",
      countryCode: "US",
      platform: "web",
    },
    getUKID() {
      return "00000000-0000-0000-0000-000000000000";
    },
    getCSID() {
      return "00000000-0000-0000-0000-000000000000";
    },
    getFlags() {
      return [
        {
          enabled: true,
          flagId: "consent-update",
          flagName: "consent-update",
        },
        {
          enabled: false,
          flagId: "inbrain",
          flagName: "inbrain",
        },
        {
          enabled: true,
          flagId: "heartbeat-event",
          flagName: "heartbeat-event",
        },
        {
          enabled: true,
          flagId: "pubsub-event",
          flagName: "pubsub-event",
        },
        {
          enabled: true,
          flagId: "outside-us-location-check",
          flagName: "outside-us-location-check",
        },
        {
          enabled: true,
          flagId: "identity-onstart",
          flagName: "identity-onstart",
        },
        {
          enabled: true,
          flagId: "identity-oncomplete",
          flagName: "identity-oncomplete",
        },
        {
          enabled: true,
          flagId: "idresolve",
          flagName: "idresolve",
        },
      ];
    },
    session: {
      pageloadid: 1,
      sessionid: "00000000-0000-0000-0000-000000000000",
      sessionDuration: 0,
      psmLastActiveTimestamp: isoDate,
      psmSessionStart: isoDate,
      isSessionStart: false,
    },
  };

  beforeAll(() => {
    cookie.set("UKID", "00000000-0000-0000-0000-000000000000");
  });

  beforeEach(() => {
    mockStorage();
    mockDate();
    mockUserAgent();
  });

  afterEach(() => {
    clearMockDate();
    clearMockUserAgent();
  });

  it("should log", () => {
    logger.createLogger(psm as Psm);

    const msg = logger.log(
      {
        err,
        ...validLogOptions,
      } as logger.LogOptions,
      "test"
    );

    expect(msg).toMatchSnapshot();
  });

  it("should debug", () => {
    logger.createLogger(psm as Psm);

    const msg = logger.debug({
      err,
      ...validLogOptions,
    } as logger.LogOptions);

    expect(msg).toMatchSnapshot();
  });

  it("should warn", () => {
    logger.createLogger(psm as Psm);

    const msg = logger.warn({
      err,
      ...validLogOptions,
    } as logger.LogOptions);

    expect(msg).toMatchSnapshot();
  });

  it("should error", () => {
    logger.createLogger(psm as Psm);

    const msg = logger.error({
      err,
      ...validLogOptions,
    } as logger.LogOptions);

    expect(msg).toMatchSnapshot();
  });
});
