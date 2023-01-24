import { cookieHelper } from "../helper";

describe("cookieHelper", () => {
  it("should set a cookie", () => {
    cookieHelper("name", "value");

    expect(cookieHelper("name")).toBe("value");
  });

  it("should escape", () => {
    cookieHelper("name", "test value");

    expect(document.cookie).toInclude("name=test%20value");
  });

  it("should unescape", () => {
    cookieHelper("full name", "test value");

    expect(cookieHelper("full name")).toBe("test value");
  });

  it("should ignore URIErrors", () => {
    cookieHelper("bad", "%");
    cookieHelper("bad", null);

    expect(document.cookie).not.toInclude("bad");
  });

  it("should return undefined", () => {
    expect(cookieHelper("whatever")).toBeUndefined();
  });

  it("should clear cookies", () => {
    cookieHelper("name", "value");
    cookieHelper("name", null);

    expect(cookieHelper("name")).toBeUndefined();
  });

  it("should not return null when getting all cookies", () => {
    cookieHelper("full name", null);
    cookieHelper("mydb", null);
    cookieHelper("name", "0");
    const all = cookieHelper() as { name: "0" };

    expect(Object.keys(all)).toHaveLength(1);
    expect(all.name).toBe("0");
  });

  it("should return all cookies", () => {
    cookieHelper("name", "value");
    cookieHelper("type", "animal");
    const all = cookieHelper() as { [key: string]: string };

    expect(all["name"]).toBe("value");
    expect(all["type"]).toBe("animal");
  });
});
