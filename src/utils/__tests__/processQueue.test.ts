import { processQueue } from "../processQueue";
import { sendRequest } from "../sendRequest";
import { clearMockDate, isoDate, mockDate } from "../testUtils";

jest.mock("../sendRequest", () => ({
  sendRequest: jest.fn().mockResolvedValue("success"),
}));

describe("processQueue()", () => {
  beforeEach(() => {
    mockDate();
  });

  afterEach(() => {
    clearMockDate();
  });

  it("should return a callback function", () => {
    expect(processQueue("https://example.com")).toBeFunction();
  });

  it("should call sendRequest", () => {
    const item = { foo: "bar" };
    const options = {
      body: JSON.stringify({ ...item, sentAtTimestamp: isoDate }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    };
    const done = (err, res) => {
      expect(err).toBeNull();
      expect(res).toBe("success");
      expect(sendRequest).toHaveBeenCalledTimes(1);
      expect(sendRequest).toHaveBeenCalledWith(
        "https://example.com/api",
        options
      );
    };

    const processFn = processQueue("https://example.com/api");

    processFn(item, done);
  });
});
