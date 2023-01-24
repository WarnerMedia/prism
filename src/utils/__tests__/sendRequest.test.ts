import { sendRequest } from "../sendRequest";
import { xhr, mockXhr, unmockXhr } from "../testUtils";

describe("sendRequest()", () => {
  beforeEach(mockXhr);

  afterEach(unmockXhr);

  it("should be a function", () => {
    expect(sendRequest).toBeFunction();
  });

  it("should work as expected when response is received", () => {
    const p = sendRequest("/foo", { headers: { a: "b" } }).then((res) => {
      expect(res).toMatchObject({
        a: "b",
      });

      expect(xhr.setRequestHeader).toHaveBeenCalledTimes(1);
      expect(xhr.open).toHaveBeenCalledTimes(1);
      expect(xhr.open).toHaveBeenCalledWith("get", "/foo");
      expect(xhr.send).toHaveBeenCalledTimes(1);
      expect(xhr.send).toHaveBeenCalledWith(null);
    });

    expect(xhr.onload).toBeFunction();
    expect(xhr.onerror).toBeFunction();

    xhr.onload();

    return p;
  });

  it("should handle errors", () => {
    const p = sendRequest("/foo", { headers: { a: "b" } })
      .then((res) => {
        expect(res).toBeUndefined();

        expect(xhr.setRequestHeader).toHaveBeenCalledTimes(1);
        expect(xhr.open).toHaveBeenCalledTimes(1);
        expect(xhr.open).toHaveBeenCalledWith("get", "/foo");
        expect(xhr.send).toHaveBeenCalledTimes(1);
        expect(xhr.send).toHaveBeenCalledWith(null);
      })
      .catch((err) => {
        expect(err).toBeDefined();
      });

    expect(xhr.onload).toBeFunction();
    expect(xhr.onerror).toBeFunction();

    xhr.onerror(new Error("oops!"));

    return p;
  });
});
