/* eslint-disable @typescript-eslint/no-explicit-any */
import { v4 as uuid } from "uuid";
import { cookie } from "../cookie/src";
import {
  getAdsGUID,
  getEcid,
  getKruxId,
  getConvivaId,
  getOptanonConsentCookie,
  getMetadataPropValue,
  getContentMetadata,
  hydratePayload,
} from "../hydratePayload";
import { cookiesEnabled, localStorageAccessible } from "../browser";
import { payloadCore } from "../../payloadCore";
import { Psm } from "../../Psm";
import { clearMockIntl, mockIntl, clearAllCookies } from "../testUtils";

jest.mock("uuid", () => ({
  v4: jest.fn(() => "00000000-0000-0000-0000-000000000000"),
}));

jest.mock("../browser", () => ({
  ...(jest.requireActual("../browser") as object),
  cookiesEnabled: jest.fn().mockReturnValue(true),
  localStorageAccessible: jest.fn().mockReturnValue(true),
}));

jest.mock("../hydratePayload", () => ({
  ...(jest.requireActual("../hydratePayload") as object),
}));

jest.mock("../../../package.json", () => ({
  version: "0.0.0",
}));

const psmConfig = {
  brand: "Prism",
  subBrand: "Prism-Test",
  cookieDomain: ".psm.test",
  psmEnvironment: "TEST",
};
const timestamp = "2020-12-01T00:00:00.000Z";
const cookiesEnabledMock = cookiesEnabled as jest.MockedFunction<
  typeof cookiesEnabled
>;
const localStorageAccessibleMock = localStorageAccessible as jest.MockedFunction<
  typeof localStorageAccessible
>;
const win = window as any;

describe("hydratePayload()", () => {
  beforeEach(() => {
    mockIntl();
  });

  afterEach(() => {
    localStorage.clear();
    clearAllCookies();
    clearMockIntl();
  });

  it("should add all expected fields to a payload", () => {
    // set up Psm instance and core to pass to hydratePayload
    const psm = new Psm();
    const core = payloadCore((data) => {
      // once the payload is built and we call a "track" method from the core
      // we can visually check the payload in snapshots
      const payload = data.build();
      expect(payload).toMatchSnapshot();
    });

    // stub out Psm class properties
    psm.ukid = uuid();
    psm.csid = uuid();
    psm.config = psmConfig;

    // populate payload with values
    hydratePayload(psm, core);
    // call a "track" method to build the payload
    core.trackIdentityRegistration("identity test", timestamp);
  });

  describe("getKruxId()", () => {
    it("should get a Krux ID from localStorage", () => {
      localStorage.setItem("kxkuid", "foo");

      expect(getKruxId()).toBe("foo");
    });

    it("should get a Krux ID from the kxkuid cookie", () => {
      localStorageAccessibleMock.mockReturnValueOnce(false);
      cookie.set("kxkuid", "foo");

      expect(getKruxId()).toBe("foo");
    });

    it("should return null when localStorage and cookies are not available", () => {
      cookiesEnabledMock.mockReturnValueOnce(false);
      localStorageAccessibleMock.mockReturnValueOnce(false);
      localStorage.setItem("kxkuid", "foo");
      cookie.set("kxkuid", "foo");

      expect(getKruxId()).toBeNull();
    });
  });

  describe("getEcid()", () => {
    it("should return the ecid when s_ecid has a value", () => {
      cookie.set("s_ecid", '"11111"');
      expect(getEcid()).toBe("11111");
    });

    it("should return the ecid when s_ecid does not have a value but s_vi does", () => {
      cookie.set("s_vi", '"00000"');
      expect(getEcid()).toBe("00000");
    });

    it("should return the AMCV cookie ECID value when s_ecid does not have a value and s_vi does not either", () => {
      cookie.set(
        "AMCV_000000000000000000000000@ExampleOrg",
        '"MCMID|22222|MCAAMLH-1234567890"'
      );
      expect(getEcid()).toBe("22222");
    });

    it("should return null when s_ecid & s_vi & amcv have no value", () => {
      expect(getEcid()).toBeNull();
    });
  });

  describe("getConvivaId()", () => {
    it("should get Conviva/sdkConfig from localStorage", () => {
      localStorage.setItem(
        "Conviva/sdkConfig",
        '{ "clId": "123456.123456.123456.123456" }'
      );

      expect(getConvivaId()).toBe("123456.123456.123456.123456");
    });

    it("should get Conviva.sdkConfig from localStorage", () => {
      localStorage.setItem(
        "Conviva.sdkConfig",
        '{ "clId": "123456.123456.123456.1234567" }'
      );

      expect(getConvivaId()).toBe("123456.123456.123456.1234567");
    });

    it("should return null when localStorage is not available", () => {
      localStorageAccessibleMock.mockReturnValueOnce(false);
      localStorage.setItem(
        "Conviva.sdkConfig",
        '{ "clId": "123456.123456.123456.123456" }'
      );

      expect(getConvivaId()).toBeNull();
    });

    it("should return null when the value in Conviva/sdkConfig is not JSON", () => {
      localStorage.setItem("Conviva/sdkConfig", "Im a cat");

      expect(getConvivaId()).toBeNull();
    });
  });

  describe("getOptanonConsentCookie()", () => {
    it("should return optanonConsent cookie when it has a value", () => {
      cookie.set(
        "OptanonConsent",
        "isIABGlobal=false&datestamp=Tue+Jun+15+2021+17%3A12%3A45+GMT-0500+(Central+Daylight+Time)&version=6.10.0&hosts=&landingPath=NotLandingPage&groups=xx%3A1&AwaitingReconsent=false&geolocation=US%3BIL"
      );
      expect(getOptanonConsentCookie()).toBe(
        "isIABGlobal=false&datestamp=Tue+Jun+15+2021+17%3A12%3A45+GMT-0500+(Central+Daylight+Time)&version=6.10.0&hosts=&landingPath=NotLandingPage&groups=xx%3A1&AwaitingReconsent=false&geolocation=US%3BIL"
      );
    });

    it("should return null if cookies are diabled", () => {
      cookiesEnabledMock.mockReturnValueOnce(false);
      cookie.set(
        "OptanonConsent",
        "isIABGlobal=false&datestamp=Tue+Jun+15+2021+17%3A12%3A45+GMT-0500+(Central+Daylight+Time)&version=6.10.0&hosts=&landingPath=NotLandingPage&groups=xx%3A1&AwaitingReconsent=false&geolocation=US%3BIL"
      );

      expect(getOptanonConsentCookie()).toBeNull();
    });

    it("should return null if cookie does not exist", () => {
      expect(getOptanonConsentCookie()).toBeNull();
    });
  });

  describe("getAdsGUID()", () => {
    it("should retrieve the id from the ug cookie", () => {
      cookie.set("ug", "test-guid");

      expect(getAdsGUID()).toBe("test-guid");
    });

    it("should return null if cookies are diabled", () => {
      cookiesEnabledMock.mockReturnValueOnce(false);

      expect(getAdsGUID()).toBeNull();
    });
  });
});
