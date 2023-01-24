// Copyright (c) Warner Media, LLC. All rights reserved. Licensed under the MIT license.
// See the LICENSE file for license information.
import { onHiddenAds, onVisibleAds } from "./adViewability";
import { HEARTBEAT_INTERVAL } from "./utils/constants";
import { resetHbInterval } from "./engagement";
import { resetAdViewMetrics } from "./adViewability";

const win = window;
const doc = document;

let refreshIntervalId: number | null = null;

export function initHeartbeat<T extends []>(
  callback: (..._: T) => void,
  sendBeacon: () => void
) {
  doc.addEventListener(
    "visibilitychange",
    () => {
      if (doc.visibilityState === "hidden") {
        onHiddenAds();
        // pause heartbeats
        win.clearInterval(refreshIntervalId as number);
        refreshIntervalId = null;
        sendBeacon();
      } else {
        onVisibleAds();
        // resume heartbeats
        resetAdViewMetrics();
        resetHbInterval();
        refreshIntervalId =
          refreshIntervalId || win.setInterval(callback, HEARTBEAT_INTERVAL);
      }
    },
    false
  );

  refreshIntervalId = win.setInterval(callback, HEARTBEAT_INTERVAL);
}
