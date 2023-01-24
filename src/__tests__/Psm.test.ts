/* eslint-disable @typescript-eslint/no-explicit-any */
import "jest-extended";
import { when } from "jest-when";
import { cookie } from "../utils/cookie/src";
import { Psm, PsmConfig } from "../Psm";
import { PayloadCore, payloadCore } from "../payloadCore";
import { setEngagementMetrics } from "../engagement";
import { sendRequest } from "../utils/sendRequest";
import {
  clearAllCookies,
  clearMockDate,
  mockDate,
  clearMockIntl,
  mockIntl,
  isoDate,
} from "../utils/testUtils";
import { MAX_SESSION_DURATION } from "../utils/constants";
import pkg from "../../package.json";
import { checkOutsideUS } from "../privacy";

const MOCK_UUID = "00000000-0000-0000-0000-000000000000";

jest.mock("../adViewability");
jest.mock("../engagement");
jest.mock("../identity", () => ({
  ...(jest.requireActual("../identity") as object),
  initCrossSiteId: jest.fn().mockResolvedValue({
    csid: "00000000-0000-0000-0000-000000000000",
    ukid: "00000000-0000-0000-0000-000000000000",
  }),
}));
jest.mock("../utils/logger");

jest.mock("../../package.json", () => ({
  version: "0.0.0",
}));

jest.mock("uuid", () => ({
  v4: jest.fn(() => MOCK_UUID),
}));

jest.mock("../privacy", () => ({
  ...(jest.requireActual("../privacy") as object),
  checkOutsideUS: jest.fn().mockResolvedValue({
    shouldLoad: true,
    categories: [
      { "special-purpose-1": true },
      { "special-purpose-2": true },
      { "feature-1": true },
      { "feature-2": true },
      { "feature-3": true },
    ],
  }),
}));

jest.mock("../utils/sendRequest", () => ({
  sendRequest: jest.fn().mockResolvedValue({
    asn: { id: "1111", name: "example llc" },
    continent: "NA",
    continentName: "North America",
    country: "US",
    country_alpha2: "US",
    country_alpha3: "USA",
    ip_address: "192.0.0.1",
    lat: "50.00",
    lon: "-50.00",
    proxy: null,
    states: [
      { cities: ["ATLANTA"], counties: [], state: "GA", zipcodes: ["33333"] },
    ],
  }),
}));

const win = window as any;
const UUID = new RegExp(
  "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
);
const sendRequestMock = sendRequest as jest.MockedFunction<typeof sendRequest>;
const checkOutsideUSMock = checkOutsideUS as jest.MockedFunction<
  typeof checkOutsideUS
>;

describe("Psm", () => {
  const validConfigInUS: PsmConfig = {
    brand: "Prism",
    subBrand: "Prism-Test",
    cookieDomain: ".psm.test",
    psmEnvironment: "AUTOMATED_TEST",
    countryCode: "US",
  };

  const validConfigNonUS: PsmConfig = {
    brand: "Prism",
    subBrand: "Prism-Test",
    cookieDomain: ".psm.test",
    psmEnvironment: "AUTOMATED_TEST",
    countryCode: "UK",
  };

  const validConfigNoCountryCode: PsmConfig = {
    brand: "Prism",
    subBrand: "Prism-Test",
    cookieDomain: ".psm.test",
    psmEnvironment: "AUTOMATED_TEST",
  };

  beforeEach(() => {
    mockDate();
    mockIntl();
  });

  afterEach(() => {
    clearAllCookies();
    clearMockDate();
    clearMockIntl();
  });

  it("should expose API on window.PSM", async () => {
    const psm = new Psm();

    await psm.initPsm(validConfigInUS);

    expect(win.PSM.getVersion()).toEqual(pkg.version);
    expect(win.PSM.getUKID()).toMatch(UUID);
    expect(win.PSM.isIdentityOnStartEnabled).toBeFunction();
    expect(win.PSM.isIdentityOnCompleteEnabled).toBeFunction();
    expect(win.PSM.isPrivacyEnabled).toBeFunction();
    expect(win.PSM.isTelemetryEnabled).toBeFunction();
  });

  it("should set a UKID when given a US country code", async () => {
    const psm = new Psm();

    await psm.initPsm(validConfigInUS);

    expect(cookie.get("UKID")).toMatch(UUID);
    expect(sendRequest).toHaveBeenCalled();
  });

  it('should set UKID to "Unknown" when given a non-US country code', async () => {
    const psm = new Psm();

    const queryFlagSpy = jest.spyOn(psm, "queryFlag");

    when(queryFlagSpy).calledWith("identity-onstart").mockReturnValueOnce(true);
    when(queryFlagSpy)
      .calledWith("identity-oncomplete")
      .mockReturnValueOnce(true);
    when(queryFlagSpy)
      .calledWith("outside-us-location-check")
      .mockReturnValue(false);

    await psm.initPsm(validConfigNonUS);

    expect(cookie.get("UKID")).toBeNull();
    expect(psm.getUKID()).toBe("Unknown");
  });

  it("should register identity when given a US country code", async () => {
    const psm = new Psm();

    const queryFlagSpy = jest.spyOn(psm, "queryFlag");

    // When IDR flag is checked, return it is enabled
    when(queryFlagSpy).calledWith("idresolve").mockReturnValue(true);
    when(queryFlagSpy).calledWith("identity-onstart").mockReturnValueOnce(true);
    when(queryFlagSpy)
      .calledWith("identity-oncomplete")
      .mockReturnValueOnce(true);

    await psm.initPsm(validConfigInUS);

    expect(cookie.get("UKID")).toMatch(UUID);
  });

  it("should register identity when not given a country code and GeoIP call resolves a US location", async () => {
    const psm = new Psm();

    const queryFlagSpy = jest.spyOn(psm, "queryFlag");

    // When IDR flag is checked, return it is enabled
    when(queryFlagSpy).calledWith("idresolve").mockReturnValue(true);
    when(queryFlagSpy).calledWith("identity-onstart").mockReturnValueOnce(true);
    when(queryFlagSpy)
      .calledWith("identity-oncomplete")
      .mockReturnValueOnce(true);
    when(queryFlagSpy)
      .calledWith("outside-us-location-check")
      .mockReturnValue(true);

    await psm.initPsm(validConfigNoCountryCode);

    expect(cookie.get("UKID")).toMatch(UUID);
  });

  it("should not register identity when not given a country code and GeoIP call resolves a non-US location", async () => {
    sendRequestMock.mockResolvedValueOnce({
      asn: { id: "33333", name: "test" },
      continent: "EU",
      continentName: "Europe",
      country: "UK",
      country_alpha2: "GB",
      country_alpha3: "GBR",
      ip_address: "192.0.2.0",
      lat: "50.00",
      lon: "-50.00",
      proxy: null,
      states: [
        {
          cities: ["ISLINGTON"],
          counties: [],
          state: "ISL",
          zipcodes: ["ec1v 9qn"],
        },
      ],
    });

    const psm = new Psm();

    const queryFlagSpy = jest.spyOn(psm, "queryFlag");

    // When IDR flag is checked, return it is enabled
    when(queryFlagSpy).calledWith("idresolve").mockReturnValue(true);
    when(queryFlagSpy).calledWith("identity-onstart").mockReturnValueOnce(true);
    when(queryFlagSpy)
      .calledWith("identity-oncomplete")
      .mockReturnValueOnce(true);
    when(queryFlagSpy)
      .calledWith("outside-us-location-check")
      .mockReturnValue(false);

    await psm.initPsm(validConfigNoCountryCode);

    expect(cookie.get("UKID")).toBeNull();

    expect(psm.getUKID()).toBe("Unknown");
  });

  it("should use UKID from cookie if UKID has not been set", async () => {
    const ukid = "abcdef01-abcd-abcd-abcd-abcdef012345";

    cookie.set("UKID", ukid);

    const psm = new Psm();

    const queryFlagSpy = jest.spyOn(psm, "queryFlag");

    // When IDR flag is checked, return it is enabled
    when(queryFlagSpy).calledWith("idresolve").mockReturnValue(true);
    when(queryFlagSpy).calledWith("identity-onstart").mockReturnValueOnce(true);
    when(queryFlagSpy)
      .calledWith("identity-oncomplete")
      .mockReturnValueOnce(true);
    when(queryFlagSpy)
      .calledWith("outside-us-location-check")
      .mockReturnValueOnce(true);

    await psm.initPsm(validConfigNoCountryCode);

    expect(cookie.get("UKID")).toBe(ukid);
  });

  it("should not initialize more than once", async () => {
    const psm = new Psm();

    const queryFlagSpy = jest.spyOn(psm, "queryFlag");

    // When IDR flag is checked, return it is enabled
    when(queryFlagSpy).calledWith("idresolve").mockReturnValue(true);
    when(queryFlagSpy).calledWith("identity-onstart").mockReturnValueOnce(true);
    when(queryFlagSpy)
      .calledWith("identity-oncomplete")
      .mockReturnValueOnce(true);

    await psm.initPsm(validConfigNoCountryCode);
    await psm.initPsm(validConfigNoCountryCode);

    expect(cookie.get("UKID")).toMatch(UUID);
  });

  it("should not load prism if outside US check fails", async () => {
    const psm = new Psm();

    const queryFlagSpy = jest.spyOn(psm, "queryFlag");

    when(queryFlagSpy).calledWith("idresolve").mockReturnValue(true);
    when(queryFlagSpy).calledWith("identity-onstart").mockReturnValueOnce(true);
    when(queryFlagSpy)
      .calledWith("identity-oncomplete")
      .mockReturnValueOnce(true);
    when(queryFlagSpy)
      .calledWith("outside-us-location-check")
      .mockReturnValue(true);

    checkOutsideUSMock.mockResolvedValueOnce({
      shouldLoad: false,
      categories: [],
    });
    await psm.initPsm(validConfigNonUS);

    expect(psm.consentRule).toBe("Other");
    expect(cookie.get("UKID")).toBe(null);
    expect(psm.consentCategories).toEqual({});
  });

  it("should not load prism if outside US check passes but feature flag is not enabled", async () => {
    const psm = new Psm();

    const queryFlagSpy = jest.spyOn(psm, "queryFlag");

    when(queryFlagSpy)
      .calledWith("outside-us-location-check")
      .mockReturnValue(false);
    when(queryFlagSpy).calledWith("idresolve").mockReturnValueOnce(true);
    when(queryFlagSpy).calledWith("identity-onstart").mockReturnValueOnce(true);
    when(queryFlagSpy)
      .calledWith("identity-oncomplete")
      .mockReturnValueOnce(true);

    await psm.initPsm(validConfigNonUS);

    expect(psm.consentRule).toBe("GDPR");
    expect(cookie.get("UKID")).toBe(null);
    expect(psm.consentCategories).toEqual({
      "feature-1": true,
      "feature-2": true,
      "feature-3": true,
      "special-purpose-1": true,
      "special-purpose-2": true,
    });
  });

  it("should load prism if outside US check passes and feature flag is enabled", async () => {
    const psm = new Psm();

    const queryFlagSpy = jest.spyOn(psm, "queryFlag");

    when(queryFlagSpy)
      .calledWith("outside-us-location-check")
      .mockReturnValue(true);
    when(queryFlagSpy).calledWith("idresolve").mockReturnValueOnce(true);
    when(queryFlagSpy).calledWith("identity-onstart").mockReturnValueOnce(true);
    when(queryFlagSpy)
      .calledWith("identity-oncomplete")
      .mockReturnValueOnce(true);

    await psm.initPsm(validConfigNonUS);

    expect(psm.consentRule).toBe("GDPR");
  });

  it("should add doNotTrack settings to payload", async () => {
    Object.defineProperty(global.navigator, "doNotTrack", {
      value: "1",
      writable: true,
    });
    const psm = new Psm();

    const queryFlagSpy = jest.spyOn(psm, "queryFlag");

    // When IDR flag is checked, return it is enabled
    when(queryFlagSpy).calledWith("idresolve").mockReturnValue(true);
    when(queryFlagSpy).calledWith("identity-onstart").mockReturnValueOnce(true);
    when(queryFlagSpy)
      .calledWith("identity-oncomplete")
      .mockReturnValueOnce(true);
    when(queryFlagSpy)
      .calledWith("outside-us-location-check")
      .mockReturnValueOnce(true);

    await psm.initPsm(validConfigNoCountryCode);

    expect(cookie.get("UKID")).toMatch(UUID);
  });

  it("should throw without brand", async () => {
    const config = { cookieDomain: ".psm.test", psmEnvironment: "TEST" };

    async function init() {
      const psm = new Psm();

      await psm.initPsm(config as PsmConfig);
    }

    await expect(init).rejects.toThrowError(/brand/);
  });

  it("should throw without psmEnvironment", async () => {
    const config = { brand: "Prism", cookieDomain: ".psm.test" };

    async function init() {
      const psm = new Psm();

      await psm.initPsm(config as PsmConfig);
    }

    await expect(init).rejects.toThrowError(/psmEnvironment/);
  });

  it("should batch errors for multiple invalid properties", async () => {
    const config = { cookieDomain: ".psm.test", psmEnvironment: "TEST" };

    async function init() {
      const psm = new Psm();

      await psm.initPsm(config as PsmConfig);
    }

    await expect(init).rejects.toThrowError(/brand/);
  });

  it("should throw with no config", async () => {
    async function init() {
      const psm = new Psm();

      // @ts-ignore
      await psm.initPsm();
    }

    await expect(init).rejects.toThrowError(
      /Please provide a valid configuration/
    );
  });

  // Tests that the local config has all  flags enabled
  it("should default the doppler feature flags to true in the local config", async () => {
    const psm = new Psm();

    await psm.initPsm(validConfigNoCountryCode);

    const identityOnStartEnabled = psm.queryFlag("identity-onstart");
    const identityOnCompleteEnabled = psm.queryFlag("identity-oncomplete");
    const privacyEnabled = psm.queryFlag("privacy");
    const telemetryEnabled = psm.queryFlag("telemetry");

    expect(identityOnStartEnabled).toBeTrue();
    expect(identityOnCompleteEnabled).toBeTrue();
    expect(privacyEnabled).toBeTrue();
    expect(telemetryEnabled).toBeTrue();
  });

  it("should default the test-enabled feature flag to true", async () => {
    const psm = new Psm();

    await psm.initPsm(validConfigNoCountryCode);

    const testEnabledFlag = psm.queryFlag("test-enabled");

    expect(testEnabledFlag).toBeTrue();
  });

  it("should default the test-diabled feature flag to false", async () => {
    const psm = new Psm();

    await psm.initPsm(validConfigNoCountryCode);

    const testDisabledFlag = psm.queryFlag("test-disabled");

    expect(testDisabledFlag).toBeFalse();
  });

  it("should default an unknown feature flag to false", async () => {
    const psm = new Psm();

    await psm.initPsm(validConfigNoCountryCode);

    const testUnknownFlag = psm.queryFlag("test-unknown");

    expect(testUnknownFlag).toBeFalse();
  });

  // Tests that psm.queryFlag still works when the FF Client isn't initialized
  it("should default properly if the FF client is unavailable", async () => {
    const psm = new Psm();

    const identityOnStartEnabled = psm.queryFlag("identity-onstart");
    const identityOnCompleteEnabled = psm.queryFlag("identity-oncomplete");
    const privacyEnabled = psm.queryFlag("privacy");
    const telemetryEnabled = psm.queryFlag("telemetry");
    const testEnabledFlag = psm.queryFlag("test-enabled");
    const testDisabledFlag = psm.queryFlag("test-disabled");
    const testUnknownFlag = psm.queryFlag("test-unknown");

    expect(identityOnStartEnabled).toBeTrue();
    expect(identityOnCompleteEnabled).toBeTrue();
    expect(privacyEnabled).toBeTrue();
    expect(telemetryEnabled).toBeTrue();
    expect(testEnabledFlag).toBeTrue();
    expect(testDisabledFlag).toBeFalse();
    expect(testUnknownFlag).toBeFalse();
  });

  it("should not send identity requests if flag is disabled", async () => {
    const psm = new Psm();

    // When ID flags are checked, return they are disabled
    const queryFlagSpy = jest.spyOn(psm, "queryFlag");
    when(queryFlagSpy).calledWith("identity-onstart").mockReturnValue(false);
    when(queryFlagSpy).calledWith("identity-oncomplete").mockReturnValue(false);

    await psm.initPsm(validConfigInUS);

    // UKID should still be generated
    expect(win.PSM.getUKID()).toMatch(UUID);
  });

  // ID Resolve Tests
  it("should send idresolve request when no previous idresolve request has been sent", async () => {
    const psm = new Psm();

    // Set config so we can test resolveIds without running initPsm
    psm.config = validConfigInUS;
    const getCookieSpy = jest.spyOn(cookie, "get");
    const setCookieSpy = jest.spyOn(cookie, "set");
    const queryFlagSpy = jest.spyOn(psm, "queryFlag");

    // When IDR flag is checked, return it is enabled
    when(queryFlagSpy).calledWith("idresolve").mockReturnValue(true);
    // Mock idrTimestamp to null
    when(getCookieSpy).calledWith("idrTimestamp").mockReturnValue(null);

    const resolveIdsReturn = await psm.resolveIds();

    expect(setCookieSpy).toHaveBeenCalledWith("idrTimestamp", new Date());
    expect(resolveIdsReturn).toBeTrue();
  });

  it("should send idresolve request when previous idresolve request is over 24 hours", async () => {
    const psm = new Psm();

    // Set config so we can test resolveIds without running initPsm
    psm.config = validConfigInUS;
    const getCookieSpy = jest.spyOn(cookie, "get");
    const setCookieSpy = jest.spyOn(cookie, "set");
    const queryFlagSpy = jest.spyOn(psm, "queryFlag");

    // When IDR flag is checked, return it is enabled
    when(queryFlagSpy).calledWith("idresolve").mockReturnValue(true);

    // Return mock idrtimestamp that's >24 hours old
    when(getCookieSpy)
      .calledWith("idrTimestamp")
      .mockReturnValueOnce(new Date(1970));

    const resolveIdsReturn = await psm.resolveIds();

    expect(setCookieSpy).toHaveBeenCalledWith("idrTimestamp", new Date());
    expect(resolveIdsReturn).toBeTrue();
  });

  it("should not call idresolve service when idresolve flag is disabled", async () => {
    const psm = new Psm();

    // Set config so we can test resolveIds without running initPsm
    psm.config = validConfigInUS;
    const queryFlagSpy = jest.spyOn(psm, "queryFlag");
    const setCookieSpy = jest.spyOn(cookie, "set");

    // When IDR flag is checked, return it is disabled
    when(queryFlagSpy).calledWith("idresolve").mockReturnValueOnce(false);

    const resolveIdsReturn = await psm.resolveIds();

    expect(setCookieSpy).not.toHaveBeenCalledWith("idrTimestamp", new Date());
    expect(resolveIdsReturn).toBeFalse();
  });

  it("should not call idresolve service when idrTimestamp is <24 hours old", async () => {
    const psm = new Psm();

    // Set config so we can test resolveIds without running initPsm
    psm.config = validConfigInUS;
    const setCookieSpy = jest.spyOn(cookie, "set");
    const getCookieSpy = jest.spyOn(cookie, "get");
    const queryFlagSpy = jest.spyOn(psm, "queryFlag");

    // When IDR flag is checked, return it is enabled
    when(queryFlagSpy).calledWith("idresolve").mockReturnValue(true);

    // Return mock idrtimestamp that's <24 hours old
    when(getCookieSpy).calledWith("idrTimestamp").mockReturnValue(new Date());

    const resolveIdsReturn = await psm.resolveIds();

    expect(setCookieSpy).not.toHaveBeenCalledWith("idrTimestamp", new Date());
    expect(resolveIdsReturn).toBeFalse();
  });

  // Session Tests
  it("should create not set session if user is outside of US", async () => {
    const psm = new Psm();

    const setSessionSpy = jest.spyOn(psm, "setSessionProperties");

    await psm.initPsm(validConfigNonUS);

    expect(psm.getUKID()).toBe("Unknown");
    expect(setSessionSpy).toHaveBeenCalledTimes(0);
  });

  it("should set session cookies if session does not exist", () => {
    const psm = new Psm();

    // Cookie mocks
    const getCookieSpy = jest.spyOn(cookie, "get");
    const setCookieSpy = jest.spyOn(cookie, "set");

    // Mock session cookies to null
    when(getCookieSpy).calledWith("psmSessionId").mockReturnValueOnce(null);
    when(getCookieSpy).calledWith("psmSessionStart").mockReturnValueOnce(null);
    when(getCookieSpy)
      .calledWith("psmLastActiveTimestamp")
      .mockReturnValueOnce(null);
    when(getCookieSpy).calledWith("psmPageLoadId").mockReturnValueOnce(null);

    psm.setSessionProperties(true);

    // Expect session cookies to be set with correct values
    expect(setCookieSpy).toHaveBeenCalledWith("psmSessionId", MOCK_UUID);
    expect(setCookieSpy).toHaveBeenCalledWith("psmSessionStart", isoDate);
    expect(setCookieSpy).toHaveBeenCalledWith(
      "psmLastActiveTimestamp",
      isoDate
    );
    expect(setCookieSpy).toHaveBeenCalledWith("psmPageLoadId", "1");

    // Expect session info stored in cookies to be on Prism session object with isSessionStart as true
    expect(psm.session).toEqual({
      isSessionStart: true,
      pageloadid: 1,
      psmLastActiveTimestamp: isoDate,
      psmSessionStart: isoDate,
      sessionid: MOCK_UUID,
      sessionDuration: 0,
    });
  });

  it("should not create new session if session exists & is less than max session age", () => {
    const psm = new Psm();

    // Cookie mocks
    const getCookieSpy = jest.spyOn(cookie, "get");
    const setCookieSpy = jest.spyOn(cookie, "set");

    // Mock prior session values within max session age
    const mockPrevSessionId = "12345678-1234-1234-1234-123456789123";
    const valueLessThanMaxSession = MAX_SESSION_DURATION - 1;
    const mockPrevLastActiveTimestamp = new Date(
      new Date(isoDate).getTime() - valueLessThanMaxSession
    ).toISOString();

    // Mock session cookies to be set within max session age
    when(getCookieSpy)
      .calledWith("psmSessionId")
      .mockReturnValueOnce(mockPrevSessionId);
    when(getCookieSpy)
      .calledWith("psmSessionStart")
      .mockReturnValueOnce(mockPrevLastActiveTimestamp);
    when(getCookieSpy)
      .calledWith("psmLastActiveTimestamp")
      .mockReturnValueOnce(mockPrevLastActiveTimestamp);
    when(getCookieSpy).calledWith("psmPageLoadId").mockReturnValue(1);

    psm.setSessionProperties(true);

    // Session ID and session start cookies should not change
    expect(setCookieSpy).not.toHaveBeenCalledWith("psmSessionId", MOCK_UUID);
    expect(setCookieSpy).not.toHaveBeenCalledWith("psmSessionStart", isoDate);

    // Last active timestamp should be updated with current date
    expect(setCookieSpy).toHaveBeenCalledWith(
      "psmLastActiveTimestamp",
      isoDate
    );
    // Page Load ID should icnrease by 1
    expect(setCookieSpy).toHaveBeenCalledWith("psmPageLoadId", "2");

    // Session info stored in cookies should also be on Prism session object
    expect(psm.session).toEqual({
      isSessionStart: false,
      pageloadid: 2,
      psmLastActiveTimestamp: isoDate,
      psmSessionStart: mockPrevLastActiveTimestamp,
      sessionDuration: valueLessThanMaxSession / 1000, // convert ms to s
      sessionid: mockPrevSessionId,
    });
  });

  it("should create new session if session exists & is greater than max session age", () => {
    const psm = new Psm();

    // Cookie mocks
    const getCookieSpy = jest.spyOn(cookie, "get");
    const setCookieSpy = jest.spyOn(cookie, "set");

    // Mock prior session values beyond max session age
    const mockPrevSessionId = "12345678-1234-1234-1234-123456789123";
    const valueGreaterThanMaxSession = MAX_SESSION_DURATION + 1;
    const mockPrevLastActiveTimestamp = new Date(
      new Date(isoDate).getTime() - valueGreaterThanMaxSession
    ).toISOString();

    // Mock session cookies with prior session values
    when(getCookieSpy)
      .calledWith("psmSessionId")
      .mockReturnValueOnce(mockPrevSessionId);
    when(getCookieSpy)
      .calledWith("psmSessionStart")
      .mockReturnValueOnce(mockPrevLastActiveTimestamp);
    when(getCookieSpy)
      .calledWith("psmLastActiveTimestamp")
      .mockReturnValueOnce(mockPrevLastActiveTimestamp);
    when(getCookieSpy).calledWith("psmPageLoadId").mockReturnValueOnce(2);

    psm.setSessionProperties(true);

    // New session cookies should be set
    expect(setCookieSpy).toHaveBeenCalledWith("psmSessionId", MOCK_UUID);
    expect(setCookieSpy).toHaveBeenCalledWith("psmSessionStart", isoDate);
    expect(setCookieSpy).toHaveBeenCalledWith(
      "psmLastActiveTimestamp",
      isoDate
    );
    expect(setCookieSpy).toHaveBeenCalledWith("psmPageLoadId", "1");

    // Expect session info stored in cookies to be on Prism session object (with previous session values)
    expect(psm.session).toEqual({
      isSessionStart: true,
      pageloadid: 1,
      previousSession: {
        psmLastActiveTimestamp: mockPrevLastActiveTimestamp,
        psmSessionStart: mockPrevLastActiveTimestamp,
        sessionDuration: 0,
        sessionid: mockPrevSessionId,
      },
      psmLastActiveTimestamp: isoDate,
      psmSessionStart: isoDate,
      sessionDuration: 0,
      sessionid: MOCK_UUID,
    });
  });

  it("should reset new session fields", () => {
    const psm = new Psm();

    // Mock prior session values beyond max session age
    const mockPrevSessionId = "12345678-1234-1234-1234-123456789123";
    const valueGreaterThanMaxSession = MAX_SESSION_DURATION + 1;
    const mockPrevLastActiveTimestamp = new Date(
      new Date(isoDate).getTime() - valueGreaterThanMaxSession
    ).toISOString();

    // Mock PSM session values from an old session expiring
    psm.session = {
      isSessionStart: true,
      pageloadid: 2,
      previousSession: {
        psmLastActiveTimestamp: mockPrevLastActiveTimestamp,
        psmSessionStart: mockPrevLastActiveTimestamp,
        sessionDuration: 0,
        sessionid: mockPrevSessionId,
      },
      psmLastActiveTimestamp: isoDate,
      psmSessionStart: isoDate,
      sessionDuration: 0,
      sessionid: MOCK_UUID,
    };

    // Reset session
    psm.resetNewSessionFields();

    // Expect PSM new session fields to be reset
    expect(psm.session).toEqual({
      isSessionStart: false,
      pageloadid: 2,
      previousSession: null,
      psmLastActiveTimestamp: isoDate,
      psmSessionStart: isoDate,
      sessionDuration: 0,
      sessionid: MOCK_UUID,
    });
  });

  it("should not change session if new session fields aren't populated", () => {
    const psm = new Psm();

    const resetSession = {
      isSessionStart: false,
      pageloadid: 1,
      previousSession: null,
      psmLastActiveTimestamp: isoDate,
      psmSessionStart: isoDate,
      sessionDuration: 0,
      sessionid: MOCK_UUID,
    };

    // Mock PSM session values from an already reset session
    psm.session = resetSession;

    // Reset session
    psm.resetNewSessionFields();

    // Expect new session fields to remain the same
    expect(psm.session).toEqual(resetSession);
  });

  it("should send heartbeat event if enabled", async () => {
    jest.useFakeTimers();
    const psm = new Psm();

    const setIntervalSpy = jest.spyOn(global, "setInterval");
    const queryFlagSpy = jest.spyOn(psm, "queryFlag");

    when(queryFlagSpy).calledWith("identity-onstart").mockReturnValue(false);
    when(queryFlagSpy).calledWith("identity-oncomplete").mockReturnValue(false);
    when(queryFlagSpy).calledWith("heartbeat-event").mockReturnValue(true);

    await psm.initPsm(validConfigInUS);
    jest.advanceTimersByTime(30000);

    expect(setIntervalSpy).toHaveBeenCalled(); // Heartbeat call
    expect(setEngagementMetrics).toHaveBeenCalled();

    jest.clearAllTimers();
  });
});
