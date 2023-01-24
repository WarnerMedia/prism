import { cookie } from "..";

describe("cookie", () => {
  beforeEach(() => {
    document.cookie = "bad=%";
  });

  afterEach(() => {
    cookie.options({});
    document.cookie.split(";").forEach((entry) => {
      cookie.remove(entry.split("=")[0]);
    });
  });

  describe("options", () => {
    it("should save options", () => {
      cookie.options({ path: "/xyz" });

      expect(cookie.options().path).toBe("/xyz");
      expect(cookie.options().maxage).toBe(31536000000);
    });

    it("should set domain to null on empty string", () => {
      cookie.options({ domain: "" });

      expect(cookie.options().domain).toBeNull();
    });

    it("should set SameSite=Lax by default", () => {
      expect(cookie.options().samesite).toBe("Lax");
    });

    it("should fallback to `domain=null` when it cannot set the test cookie", () => {
      cookie.options({ domain: "psm.test" });

      expect(cookie.options().domain).toBeNull();
      expect(cookie.get("psm:test")).toBeNull();
    });
  });

  describe("get", () => {
    it("should not get an empty cookie", () => {
      expect(cookie.get("abc")).toBeNull();
    });

    it("should get a cookie that exists", () => {
      cookie.set("test", { a: "b" });

      expect(cookie.get("test")).toEqual({ a: "b" });
    });

    it("should handle strings", () => {
      cookie.set("test", "value");

      expect(cookie.get("test")).toEqual("value");
    });

    it("should not throw an error on a malformed cookie", () => {
      document.cookie = "cookie-bad=y";
      expect(cookie.get("cookie-bad")).toEqual("y");
    });
  });

  describe("getAll", () => {
    it("should return all cookies", () => {
      cookie.set("test1", "value1");
      cookie.set("test2", "value2");

      expect(cookie.getAll()).toEqual({
        bad: undefined,
        "cookie-bad": "y",
        test: "value",
        test1: "value1",
        test2: "value2",
      });
    });
  });

  describe("set", () => {
    it("should set a cookie", () => {
      cookie.set("cookie-set", { a: "b" });
      expect(cookie.get("cookie-set")).toEqual({ a: "b" });
    });

    it("should set null", () => {
      cookie.set("cookie-null", null);

      expect(cookie.get("cookie-null")).toBeNull();
    });
  });

  describe("remove", () => {
    it("should remove a cookie", () => {
      cookie.set("cookie-remove", { a: "b" });
      expect(cookie.get("cookie-remove")).toEqual({ a: "b" });
      cookie.remove("cookie-remove");
      expect(cookie.get("cookie-remove")).toBeNull();
    });
  });
});
