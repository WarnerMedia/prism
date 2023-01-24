import { isJson, isNonEmptyJson, payloadBuilder } from "../payloadBuilder";

describe("Payload Builder", () => {
  it("handles JSON payloads", () => {
    const payload = {
      a: "b",
      c: "d",
    };

    expect(isJson(payload)).toBeTrue();
    expect(isNonEmptyJson(payload)).toBeTrue();
  });

  it("handles non-JSON payloads", () => {
    const payload = () => ({
      a: "b",
      c: "d",
    });

    expect(isJson(payload)).toBeFalse();
    // @ts-ignore
    expect(isNonEmptyJson(payload)).toBeFalse();
  });

  it("handles empty JSON payloads", () => {
    const payload = {};

    expect(isJson(payload)).toBeTrue();
    expect(isNonEmptyJson(payload)).toBeFalse();
  });

  describe("payloadBuilder()", () => {
    it("builds a base payload", () => {
      const payload = payloadBuilder();

      payload.add("foo", "bar");

      expect(payload.build()).toEqual({ foo: "bar" });
    });

    it("ignores undefined values", () => {
      const payload = payloadBuilder();

      payload.add("foo", undefined);

      expect(payload.build()).toEqual({});
    });

    it("ignores null values", () => {
      const payload = payloadBuilder();

      payload.add("foo", null);

      expect(payload.build()).toEqual({});
    });

    it("flattens an object onto a payload", () => {
      const payload = payloadBuilder();

      payload.addMap({ a: "b", c: "d" });
      payload.addMap({ e: "f" });

      expect(payload.build()).toEqual({ a: "b", c: "d", e: "f" });
    });
  });
});
