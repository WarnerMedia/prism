import {
  cookiesEnabled,
  detectViewport,
  fromQueryString,
  getHostname,
  getReferrer,
  hasLocalStorage,
  localStorageAccessible,
  setBrowser,
} from "../browser";
import {
  blockCookieAccess,
  restoreCookieAccess,
  USER_AGENTS,
} from "../testUtils";

const originalLocalStorage = global.localStorage;

describe("Helpers", () => {
  describe("cookiesEnabled()", () => {
    it("should return true if cookies are enabled", () => {
      expect(cookiesEnabled()).toBeTrue();
    });

    it("should return false if cookies are not enabled", () => {
      blockCookieAccess();
      expect(cookiesEnabled()).toBeFalse();
      restoreCookieAccess();
    });
  });

  describe("hasLocalStorage()", () => {
    afterEach(() => {
      Object.defineProperty(global, "localStorage", {
        value: originalLocalStorage,
        configurable: true,
        writable: true,
      });
    });

    it("should return true if localStorage exists", () => {
      expect(hasLocalStorage()).toBeTrue();
    });

    it("should return true if localStorage exists but is not available", () => {
      Object.defineProperty(global, "localStorage", {
        get() {
          throw new Error("denied!");
        },
      });

      expect(hasLocalStorage()).toBeTrue();
    });

    it("should return false if localStorage does not exist", () => {
      delete global["localStorage"];

      expect(hasLocalStorage()).toBeFalse();
    });
  });

  describe("localStorageAccessible()", () => {
    afterEach(() => {
      Object.defineProperty(global, "localStorage", {
        value: originalLocalStorage,
        configurable: true,
        writable: true,
      });
    });

    it("should return false if localStorage does not exist", () => {
      delete global["localStorage"];

      expect(localStorageAccessible()).toBeFalse();
    });

    it("should return true if localStorage exists and is accessible", () => {
      expect(localStorageAccessible()).toBeTrue();
    });

    it("should return false if localStorage exists and is not accessible", () => {
      Object.defineProperty(global, "localStorage", {
        value: {
          setItem() {
            throw new Error("denied!");
          },
        },
      });

      expect(localStorageAccessible()).toBeFalse();
    });
  });

  describe("detectViewport()", () => {
    const originalWidth = global["innerWidth"];
    const originalHeight = global["innerHeight"];

    afterEach(() => {
      Object.defineProperty(global, "innerWidth", {
        value: originalWidth,
      });
      Object.defineProperty(global, "innerHeight", {
        value: originalHeight,
      });
    });

    it("should return a string with viewport width and height", () => {
      expect(detectViewport()).toBe("1024x768");
    });

    it("should handle clientWidth and clientHeight for certain browsers", () => {
      delete global["innerWidth"];
      delete global["innerHeight"];

      // resolving from document.documentElement.clientWidth/Height
      expect(detectViewport()).toBe("0x0");
    });
  });

  describe("getHostname()", () => {
    it("should extract a hostname from a URL", () => {
      expect(getHostname("https://example.com:3000/foo")).toBe("example.com");
    });
  });

  describe("getReferrer()", () => {
    it("should get the referrer", () => {
      expect(getReferrer()).toBe("");
    });

    it("should return the old location if it exists", () => {
      expect(getReferrer("https://example.com")).toBe("https://example.com");
    });
  });

  describe("setBrowser()", () => {
    //Safari Tests
    it("should set browser to safari on Safari iOS", () => {
      USER_AGENTS.safari.iOS.forEach((ua) => {
        Object.defineProperty(global.navigator, "userAgent", {
          writable: true,
          value: ua,
          configurable: true,
        });

        expect(setBrowser()).toEqual("safari");
      });
    });

    it("should set browser to safari on Safari MacOS", () => {
      USER_AGENTS.safari.iOS.forEach((ua) => {
        Object.defineProperty(global.navigator, "userAgent", {
          writable: true,
          value: ua,
          configurable: true,
        });

        expect(setBrowser()).toEqual("safari");
      });
    });

    // Firefox Tests
    it("should set browser to firefox on Firefox MacOS", () => {
      USER_AGENTS.firefox.macOS.forEach((ua) => {
        Object.defineProperty(global.navigator, "userAgent", {
          writable: true,
          value: ua,
          configurable: true,
        });

        expect(setBrowser()).toEqual("firefox");
      });
    });

    it("should set browser to firefox on Firefox Linux", () => {
      USER_AGENTS.firefox.linux.forEach((ua) => {
        Object.defineProperty(global.navigator, "userAgent", {
          writable: true,
          value: ua,
          configurable: true,
        });

        expect(setBrowser()).toEqual("firefox");
      });
    });

    it("should set browser to firefox on Firefox Windows", () => {
      USER_AGENTS.firefox.windows.forEach((ua) => {
        Object.defineProperty(global.navigator, "userAgent", {
          writable: true,
          value: ua,
          configurable: true,
        });

        expect(setBrowser()).toEqual("firefox");
      });
    });

    it("should set browser to firefox on Firefox Android", () => {
      USER_AGENTS.firefox.android.forEach((ua) => {
        Object.defineProperty(global.navigator, "userAgent", {
          writable: true,
          value: ua,
          configurable: true,
        });

        expect(setBrowser()).toEqual("firefox");
      });
    });

    it("should set browser to firefox on Firefox iOS", () => {
      USER_AGENTS.firefox.iOS.forEach((ua) => {
        Object.defineProperty(global.navigator, "userAgent", {
          writable: true,
          value: ua,
          configurable: true,
        });

        expect(setBrowser()).toEqual("firefox");
      });
    });

    // Edge Tests
    it("should set browser to edge on Edge MacOS", () => {
      USER_AGENTS.edge.macOS.forEach((ua) => {
        Object.defineProperty(global.navigator, "userAgent", {
          writable: true,
          value: ua,
          configurable: true,
        });

        expect(setBrowser()).toEqual("edge");
      });
    });

    it("should set browser to edge on Edge Windows", () => {
      USER_AGENTS.edge.windows.forEach((ua) => {
        Object.defineProperty(global.navigator, "userAgent", {
          writable: true,
          value: ua,
          configurable: true,
        });

        expect(setBrowser()).toEqual("edge");
      });
    });

    it("should set browser to edge on Edge Android", () => {
      USER_AGENTS.edge.android.forEach((ua) => {
        Object.defineProperty(global.navigator, "userAgent", {
          writable: true,
          value: ua,
          configurable: true,
        });

        expect(setBrowser()).toEqual("edge");
      });
    });

    it("should set browser to edge on Edge iOS", () => {
      USER_AGENTS.edge.iOS.forEach((ua) => {
        Object.defineProperty(global.navigator, "userAgent", {
          writable: true,
          value: ua,
          configurable: true,
        });

        expect(setBrowser()).toEqual("edge");
      });
    });

    // Chrome Tests
    it("should set browser to chrome on Chrome MacOS", () => {
      USER_AGENTS.chrome.macOS.forEach((ua) => {
        Object.defineProperty(global.navigator, "userAgent", {
          writable: true,
          value: ua,
          configurable: true,
        });

        expect(setBrowser()).toEqual("chrome");
      });
    });

    it("should set browser to chrome on Chrome Windows", () => {
      USER_AGENTS.chrome.windows.forEach((ua) => {
        Object.defineProperty(global.navigator, "userAgent", {
          writable: true,
          value: ua,
          configurable: true,
        });

        expect(setBrowser()).toEqual("chrome");
      });
    });

    it("should set browser to chrome on Chrome Linux", () => {
      USER_AGENTS.chrome.linux.forEach((ua) => {
        Object.defineProperty(global.navigator, "userAgent", {
          writable: true,
          value: ua,
          configurable: true,
        });

        expect(setBrowser()).toEqual("chrome");
      });
    });

    it("should set browser to chrome on Chrome Android", () => {
      USER_AGENTS.chrome.android.forEach((ua) => {
        Object.defineProperty(global.navigator, "userAgent", {
          writable: true,
          value: ua,
          configurable: true,
        });

        expect(setBrowser()).toEqual("chrome");
      });
    });

    it("should set browser to chrome on Chrome iOS", () => {
      USER_AGENTS.chrome.iOS.forEach((ua) => {
        Object.defineProperty(global.navigator, "userAgent", {
          writable: true,
          value: ua,
          configurable: true,
        });

        expect(setBrowser()).toEqual("chrome");
      });
    });

    // Unknown Tests
    it("should set browser to unknown on Opera MacOS", () => {
      USER_AGENTS.opera.macOS.forEach((ua) => {
        Object.defineProperty(global.navigator, "userAgent", {
          writable: true,
          value: ua,
          configurable: true,
        });

        expect(setBrowser()).toEqual("unknown");
      });
    });

    it("should set browser to unknown on Opera Windows", () => {
      USER_AGENTS.opera.windows.forEach((ua) => {
        Object.defineProperty(global.navigator, "userAgent", {
          writable: true,
          value: ua,
          configurable: true,
        });

        expect(setBrowser()).toEqual("unknown");
      });
    });

    it("should set browser to unknown on Opera Linux", () => {
      USER_AGENTS.opera.linux.forEach((ua) => {
        Object.defineProperty(global.navigator, "userAgent", {
          writable: true,
          value: ua,
          configurable: true,
        });

        expect(setBrowser()).toEqual("unknown");
      });
    });

    it("should set browser to unknown on Opera Android", () => {
      USER_AGENTS.opera.android.forEach((ua) => {
        Object.defineProperty(global.navigator, "userAgent", {
          writable: true,
          value: ua,
          configurable: true,
        });

        expect(setBrowser()).toEqual("unknown");
      });
    });
  });

  describe("fromQueryString()", () => {
    it("should retrieve a value from a URL", () => {
      expect(fromQueryString("foo", "https://example.com?foo=1&bar=2")).toBe(
        "1"
      );
    });

    it("should return null if no match", () => {
      expect(
        fromQueryString("lol", "https://example.com?foo=1&bar=2")
      ).toBeNull();
    });
  });
});
