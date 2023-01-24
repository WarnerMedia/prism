import "jest-extended";
import { cookie } from "../utils/cookie/src";
import { cookiesEnabled } from "../utils/browser";
import { initUKID, initCrossSiteId, isUUID } from "../identity";
import * as logger from "../utils/logger";
import { Psm } from "../Psm";
import { clearAllCookies, mockDate, clearMockDate } from "../utils/testUtils";

jest.mock("uuid", () => ({
  v4: jest.fn(() => "00000000-0000-0000-0000-000000000000"),
}));

jest.mock("../utils/browser", () => ({
  cookiesEnabled: jest.fn().mockReturnValue(true),
  getReferrer: jest.fn().mockReturnValue(""),
  hasLocalStorage: jest.fn().mockReturnValue(true),
  localStorageAccessible: jest.fn().mockReturnValue(true),
  detectViewport: jest.fn().mockReturnValue(""),
  getScrollOffset: jest.fn().mockReturnValue(0),
}));

const UUID = new RegExp(
  "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
);
const psm = new Psm();
psm.config = {
  brand: "Prism",
  subBrand: "Prism-Test",
  cookieDomain: ".psm.test",
  psmEnvironment: "TEST",
};
const cookiesEnabledMock = cookiesEnabled as jest.MockedFunction<
  typeof cookiesEnabled
>;

describe("Identity", () => {
  beforeAll(() => {
    mockDate();
    logger.createLogger(psm);
  });

  beforeEach(() => {
    jest.resetModules();
  });

  afterEach(() => {
    localStorage.clear();
    clearAllCookies();
    clearMockDate();
  });

  describe("initUKID", () => {
    it("should generate a new UKID if it does not exist, and write the UKID cookie", () => {
      expect(initUKID()).toMatch(UUID);
      expect(document.cookie).toInclude("UKID=");
    });

    it("should return an empty string if cookies are not enabled", () => {
      cookiesEnabledMock.mockReturnValueOnce(false);
      expect(initUKID()).toBe("");
    });

    it("should retrieve value from existing UKID cookie", () => {
      cookie.set("UKID", "00000000-0000-0000-0000-000000000000");
      expect(initUKID()).toBe("00000000-0000-0000-0000-000000000000");
    });
  });

  describe("initCrossSiteId", () => {
    it("should add an iframe to retrieve the CSID if it does not exist", () => {
      expect(document.querySelector("#prism_toolkit")).not.toBeInTheDocument();
      initCrossSiteId("DEV");
      expect(document.querySelector("#prism_toolkit")).toBeInTheDocument();
    });
  });

  describe("isUUID", () => {
    it("should return true when given a valid UUID v4 string", () => {
      expect(isUUID("00000000-0000-0000-0000-000000000000")).toBeTrue();
    });

    it("should return false when given an invalid string", () => {
      expect(isUUID("oops")).toBeFalse();
    });
  });
});
