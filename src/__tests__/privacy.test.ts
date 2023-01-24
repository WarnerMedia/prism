/* eslint-disable @typescript-eslint/no-explicit-any */
import "jest-extended";
import { CmpApi } from "@iabtcf/cmpapi";
import { cookie } from "../utils/cookie/src";
import { clearAllCookies } from "../utils/testUtils";
import { checkOutsideUS, findFrame, initPrivacy } from "../privacy";
import { USPrivacyString } from "../USPrivacyString";

const win = window as any;

describe("Privacy", () => {
  beforeAll(() => {
    cookie.options({
      secure: false,
    });
  });

  afterEach(() => {
    clearAllCookies();
  });

  it("should return the privacy API", () => {
    const api = initPrivacy(true, "US");

    expect(api.getUSPString).toBeFunction();
    expect(api.setUSPString).toBeFunction();
    expect(api.isPrivacyEnabled).toBeFunction();
    expect(api.isPrivacyEnabled()).toBeTrue();
    expect(win.__uspapi).toBeFunction();
    expect(findFrame("__uspapiLocator")).toBe(window);
  });

  it("should not assign win.__uspapi when privacy is disabled", () => {
    const api = initPrivacy(false, "US");

    expect(api.getUSPString).toBeFunction();
    expect(api.setUSPString).toBeFunction();
    expect(win.__uspapi).toBeUndefined();
    expect(findFrame("__uspapiLocator")).toBeNull();
  });

  it("should default uspString to 1YNN within of US", () => {
    const api = initPrivacy(true, "US");

    expect(api.getUSPString()).toBe("1YNN");
  });

  it("should default uspString to 1--- outside of US", () => {
    const api = initPrivacy(true, "CN");

    expect(api.getUSPString()).toBe("1---");
  });

  it("should set uspString to usprivacy cookie", () => {
    const api = initPrivacy(true, "US");

    api.setUSPString("1YYN");

    expect(cookie.get("usprivacy")).toBe("1YYN");
  });

  it("should run ccpaShareData if in the US", () => {
    const api = initPrivacy(true, "US");

    api.ccpaShareData();

    expect(api.getUSPString()).toBe("1YNN");
  });

  it("should run ccpaDoNotShare if in the US", () => {
    const api = initPrivacy(true, "US");

    api.ccpaDoNotShare();

    expect(api.getUSPString()).toBe("1YYN");
  });

  it("should not run ccpaShareData if outside of the US", () => {
    const api = initPrivacy(true, "UK");

    api.ccpaShareData();

    expect(api.getUSPString()).toBe("1---");
  });

  it("should not run ccpaDoNotShare if outside of the US", () => {
    const api = initPrivacy(true, "UK");

    api.ccpaDoNotShare();

    expect(api.getUSPString()).toBe("1---");
  });

  describe("__uspapi", () => {
    const cb = jest.fn();

    it("should support getUSPData", () => {
      cookie.set("usprivacy", "1YNN");
      initPrivacy(true, "US");

      win.__uspapi("getUSPData", 1, cb);

      expect(cb).toHaveBeenCalledWith({ uspString: "1YNN", version: 1 }, true);
      cookie.remove("usprivacy");
    });

    it("should support ccpaShareData", () => {
      cookie.set("usprivacy", "1YNN");
      initPrivacy(true, "US");

      win.__uspapi("ccpaShareData", 1, cb);

      expect(cb).toHaveBeenCalledWith({ uspString: "1YNN", version: 1 }, true);
      cookie.remove("usprivacy");
    });

    it("should support ccpaDoNotShare", () => {
      cookie.set("usprivacy", "1YNN");
      initPrivacy(true, "US");

      win.__uspapi("ccpaDoNotShare", 1, cb);

      expect(cb).toHaveBeenCalledWith({ uspString: "1YYN", version: 1 }, true);
      cookie.remove("usprivacy");
    });

    it("should support ping", () => {
      cookie.set("usprivacy", "1YNN");
      initPrivacy(true, "US");

      win.__uspapi("ping", 1, cb);

      expect(cb).toHaveBeenCalledWith({ uspapiLoaded: true, version: 1 }, true);
      cookie.remove("usprivacy");
    });

    it("should handle invalid commands", () => {
      cookie.set("usprivacy", "1YNN");
      initPrivacy(true, "US");

      win.__uspapi("invalid", 1, cb);

      expect(cb).toHaveBeenCalledWith(null, false);
      cookie.remove("usprivacy");
    });

    it("should be available for iframes via postMessage", () => {
      window.addEventListener(
        "message",
        (e) => {
          expect(e.data.__uspapiReturn.returnValue.uspString).toEqual("1YNN");
        },
        false
      );
      const iframe = document.createElement("iframe");

      iframe.id = "uspapi";
      document.body.appendChild(iframe);

      const iframeDoc = (document.getElementById("uspapi") as HTMLIFrameElement)
        .contentWindow.document;

      iframeDoc.open();
      iframeDoc.write(`
<script>
  function onPostMessage() {
  const message = {
    data: {
      __uspapiCall: {
        command: "getUSPData",
        parameter: true,
        version: 1,
        callId: "12345",
      },
    },
    source:window.top
  };
  window.top.__uspapi.msgHandler(message)
  }
</script>
<button id="postMsgButton" onclick="onPostMessage()">Click to post message</button><br/>
      `);
      iframeDoc.close();

      initPrivacy(true, "US");

      iframeDoc.getElementById("postMsgButton").click();
    });
  });

  describe("USPrivacyString class", () => {
    let uspString: USPrivacyString;

    beforeEach(() => {
      uspString = new USPrivacyString();
    });

    it("should default uspString to null", () => {
      expect(uspString.getUSPrivacyString()).toBeNull();
    });

    it("should return the IAB version", () => {
      expect(uspString.getVersion()).toBe(1);
    });

    it("should set a valid uspString and return true", () => {
      expect(uspString.setUSPrivacyString("1---")).toBeTrue();
      expect(uspString.getUSPrivacyString()).toBe("1---");
      expect(cookie.get("usprivacy")).toBe("1---");
      expect(cookie.get("uspData")).toEqual({ version: 1, uspString: "1---" });
    });

    it("should ignore invalid uspString values and return false", () => {
      expect(uspString.setUSPrivacyString("invalid")).toBeFalse();
      expect(uspString.getUSPrivacyString()).toBeNull();
    });
  });

  describe("checkOutsideUS()", () => {
    const ENCODED_TC_STRING_ACCEPT_ALL =
      "CPIXma0PIXma0AcABBENBhCgALAAAE_AAChQG7wH4AFAAWAA2AEAAQgAyABoAEUAJMATABOACgAFsAQgAjoBRgFKAK0AgABCACOgE7AKSAWIAuoBgQDqgH6ARqAk4BaIC8wGMgMsAbuBlkBiABQAFwAgACEAGQANAAiwBMAE0AKAAWwBCACOgFGAUoArQCAAEIAIsAWIAuoBgQDqgJOAWiAvMBjIDLADwoAcABQAUAAtgCtAIQAtEBjIQAKAA0AJIATgCdgFiDQAgCAAHVEQAgCAAHVFAAwAGgGBAP0LABgCkAFaAtEaACAFIAK0eAIAAUAE0AKAAWwBSACtAWiAxkcAHAAaAEkAJwBOwCkgH6ARAQABgANAKSAfoiADACaAKQAVpIAGAA0AwIB-iYAUAJoAUABSACtAYyUADgANACSAQgAnYBgQD9AI1KgBQAmgBQAFIAK0BjIA.dgAACfgAAAAA";
    const ENCODED_TC_STRING_REJECT_ALL =
      "CPIxGehPIxGehAcABBENBhCgAAAAAAAAAChQG7wIYAFAAWAA0ADMAIAAhABkADQAIoASYAmACcAFAAKQAWwBCACOgFGAUoArQCAAEIAI6ATsApIBYgC6gGBAOqAfoBGoCTgFogLzAYyAywBu4AAAEAoAkABQAUAApABbAFaAQgAnYC0QGMhAAgADQAkgBOALEGgBAEAAOqIgBAEAAOqKABgANAAyAfoWADAFIAK0BaIwACABkaACAFIAK0eAKAAUAE0AKAAUgAtgCkAFaATsBaIDGRwAYABoASQAnAFJAP0AiAgADAAaAUkA_REAGAE0AUgArSQAIABoB-iYAYAJoAUAApACkAFaAxkoAFAAaAEkAhAB-gEalQAoATQAoACkAFaAxkAA.YAAAAAAAAAAA";

    let cmpapi: CmpApi;

    beforeEach(() => {
      cmpapi = new CmpApi(141, 4, false);
    });

    it("should handle accept all", async () => {
      cmpapi.update(ENCODED_TC_STRING_ACCEPT_ALL, false);

      await expect(checkOutsideUS()).resolves.toEqual({
        shouldLoad: true,
        categories: [
          { "data-store": true },
          { "ads-person-prof": true },
          { "content-person-prof": true },
          { "consent-person": true },
          { "measure-content": true },
          { "measure-market": true },
          { "product-develop": true },
          { "special-purpose-1": true },
          { "special-purpose-2": true },
          { "feature-1": true },
          { "feature-2": true },
          { "feature-3": true },
        ],
      });
    });

    it("should handle reject all", async () => {
      cmpapi.update(ENCODED_TC_STRING_REJECT_ALL, false);

      await expect(checkOutsideUS()).resolves.toEqual({
        shouldLoad: false,
        categories: [
          { "data-store": false },
          { "ads-person-prof": false },
          { "content-person-prof": false },
          { "consent-person": false },
          { "measure-content": false },
          { "measure-market": false },
          { "product-develop": false },
          { "special-purpose-1": true },
          { "special-purpose-2": true },
          { "feature-1": true },
          { "feature-2": true },
          { "feature-3": true },
        ],
      });
    });

    it("should return defaults if window.__tcfapi is not a function", async () => {
      win.__tcfapi = null;

      await expect(checkOutsideUS()).resolves.toEqual({
        shouldLoad: false,
        categories: [],
      });
    });
  });
});
