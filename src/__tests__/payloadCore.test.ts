import { v4 as uuid } from "uuid";
import { payloadCore, removeEmptyProperties } from "../payloadCore";

jest.mock("uuid", () => ({
  v4: jest.fn(() => "00000000-0000-0000-0000-000000000000"),
}));

describe("Psm Core", () => {
  const timestamp = "2020-12-01T00:00:00.000Z";

  it("should support adding custom key-value pairs to the core payload", () => {
    const core = payloadCore((data) => {
      expect(data.build()).toMatchSnapshot();
    });

    core.addEntry("foo", "bar");
    core.trackAppLoad(timestamp);
  });

  it("should log errors in track method callbacks", () => {
    // TODO: spy on logger once implemented
    const consoleWarnSpy = jest.spyOn(console, "warn");
    const core = payloadCore();

    core.addEntry("foo", "bar");
    core.trackAppLoad(timestamp, () => {
      throw new Error();
    });

    expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
  });

  it("should expose setter methods", () => {
    const core = payloadCore((data) => {
      expect(data.build()).toMatchSnapshot();
    });

    core.setPlatform("web");
    core.addEntry("companyName", "Prism Test Co");
    core.setBrand("Prism");
    core.setSubBrand("Prism Test");
    core.setProductName("Unit Tests");
    core.setUKID(uuid());
    core.setLibrary({
      version: "x.x.x",
      name: "Prism",
      initConfig: {
        brand: "Prism",
        subBrand: "Prism-Test",
        psmEnvironment: "TEST",
        cookieDomain: ".psm.test",
      },
    });
    core.setThirdPartyIds({ kruxid: "abc123" });
    core.trackAppLoad(timestamp);
  });

  it("should expose trackAppLoad method", () => {
    const core = payloadCore((data) => {
      expect(data.build()).toMatchSnapshot();
    });

    core.trackAppLoad(timestamp);
  });

  it("should expose trackHeartbeat method", () => {
    const core = payloadCore((data) => {
      expect(data.build()).toMatchSnapshot();
    });

    core.trackHeartbeat(timestamp);
  });

  it("should expose trackPubSub method", () => {
    const core = payloadCore((data) => {
      expect(data.build()).toMatchSnapshot();
    });

    core.trackPubSub("eventName", timestamp);
  });

  it("should expose trackIdentityRegistration method", () => {
    const core = payloadCore((data) => {
      expect(data.build()).toMatchSnapshot();
    });

    core.trackIdentityRegistration("eventName", timestamp);
  });

  it("should expose trackConsentGranted method", () => {
    const core = payloadCore((data) => {
      expect(data.build()).toMatchSnapshot();
    });

    core.trackConsentGranted(timestamp);
  });

  it("should expose trackConsentWithdrawn method", () => {
    const core = payloadCore((data) => {
      expect(data.build()).toMatchSnapshot();
    });

    core.trackConsentWithdrawn(timestamp);
  });

  describe("removeEmptyProperties()", () => {
    it("should remove null or undefined values from an object", () => {
      const obj = { a: "foo", b: null, c: undefined };

      expect(removeEmptyProperties(obj)).toEqual({ a: "foo" });
    });

    it("should recursively remove nested null or undefined values", () => {
      const obj = {
        a: "foo",
        b: {
          c: "bar",
          d: null,
          e: undefined,
        },
        f: null,
      };

      expect(removeEmptyProperties(obj)).toEqual({ a: "foo", b: { c: "bar" } });
    });
  });
});
