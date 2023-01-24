/* eslint-disable @typescript-eslint/no-explicit-any */
import { sendRequest } from "./sendRequest";
import { debug } from "./logger";

const win = window as any;

export function processQueue(url: string) {
  return (item: any, done: any) => {
    const bots = ["bot", "crawl", "spider"];
    const reg = new RegExp(bots.join("|"), "i");
    if (reg.test(win.navigator.userAgent)) {
      return done(null, {});
    }
    item.sentAtTimestamp = new Date().toISOString();
    sendRequest(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    })
      .then((res) => done(null, res))
      .catch((err) => {
        debug({
          err,
          methodName: "sendRequest",
          eventType: item.eventType || "queue",
        });
        done(err);
      });
  };
}
