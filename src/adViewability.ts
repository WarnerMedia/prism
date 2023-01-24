// Copyright (c) Warner Media, LLC. All rights reserved. Licensed under the MIT license.
// See the LICENSE file for license information.
import { isElementVisible } from "./utils/browser";

declare global {
  interface Window {
    googletag: googletag.Googletag;
  }
}

export interface SlotMetrics {
  slotId: string;
  slotSize: string;
  adUnitPath?: string;
  totalViewTime: number;
  lastViewStarted: number;
  visibleOnStart: boolean;
  adWasViewed: boolean;
  rfv?: string;
  creativeId?: string;
  lineItemId?: string;
  totalHoverTime: number;
  lastHoverStarted: number;
}

const win = window;
const doc = document;
let adObserver: IntersectionObserver;

export const registeredSlots: SlotMetrics[] = [];

win.googletag =
  win.googletag || ({ cmd: [] } as unknown as googletag.Googletag);

const log = (...args: string[]) => {
  if (win.location.search.search(/[?&]psm_debug=[1t]/) !== -1) {
    // console.log('[PSM]:', ...args);
  }
};

const timeInSeconds = () => Math.round(Date.now() / 1000);

const addDistinctRegisteredSlot = (slot: SlotMetrics) => {
  if (!registeredSlots.some((regSlot) => slot.slotId === regSlot.slotId)) {
    registeredSlots.push(slot);
  }
};

export function initAdViewListeners(): void {
  adObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const slotId = entry.target.id;
        const inViewPercentage = Math.round(entry.intersectionRatio) * 100;
        const rect = entry.boundingClientRect;

        if (entry.isIntersecting) {
          if (
            entry.intersectionRatio >= 0.5 &&
            isElementVisible(entry.target)
          ) {
            log(
              `slotVisibilityChanged - ${slotId} is in view. (${inViewPercentage}% in view)`
            );
            registeredSlots.forEach((slot) => {
              if (slot.slotId === slotId) {
                slot.visibleOnStart = true;
                slot.adWasViewed = true;
                slot.slotSize = `${rect.width}x${rect.height}`;
                updateSlotTimer(slot);
              }
            });
          }
        } else {
          // if an ad is not considered in view, flag it as not visible and reset lastViewStarted
          log(
            `slotVisibilityChanged - ${slotId} is no longer in view. (${inViewPercentage}% in view)`
          );
          registeredSlots.forEach((slot) => {
            if (slot.slotId === slotId) {
              slot.visibleOnStart = false;
              slot.lastViewStarted = 0;
              slot.lastHoverStarted = 0;
            }
          });
        }
      });
    },
    {
      root: null,
      rootMargin: "0px",
      threshold: [0.0, 0.5, 1.0],
    }
  );

  win.googletag.cmd.push(() => {
    win.googletag
      .pubads()
      .addEventListener(
        "slotRenderEnded",
        (e: googletag.events.SlotRenderEndedEvent) => {
          const slotId = e.slot.getSlotElementId();
          const adUnitPath = e.slot.getAdUnitPath();
          const elem = doc.getElementById(slotId);
          let slotSize = "0x0";

          if (e.size) {
            if (typeof e.size === "string") {
              slotSize = e.size;
            } else {
              slotSize = e.size.join("x");
            }
          }

          const slot: SlotMetrics = {
            slotId,
            slotSize,
            adUnitPath,
            totalViewTime: 0,
            lastViewStarted: 0,
            visibleOnStart: false,
            adWasViewed: false,
            rfv: e.slot.getTargeting("rfv")[0],
            creativeId: e.slot.getTargeting("creativeId")[0],
            lineItemId: e.slot.getTargeting("lineItemId")[0],
            totalHoverTime: 0,
            lastHoverStarted: 0,
          };

          addDistinctRegisteredSlot(slot);

          if (elem) {
            adObserver.observe(elem);
            adListeners(elem, slot);
          }
        }
      );

    win.googletag
      .pubads()
      .addEventListener(
        "slotVisibilityChanged",
        (e: googletag.events.SlotVisibilityChangedEvent) => {
          const slotId = e.slot.getSlotElementId();
          registeredSlots.forEach((slot) => {
            if (slot.slotId === slotId) {
              slot.rfv = e.slot.getTargeting("rfv")[0];
              (slot.creativeId = e.slot.getTargeting("creativeId")[0]),
                (slot.lineItemId = e.slot.getTargeting("lineItemId")[0]);
            }
          });
        }
      );

    win.googletag
      .pubads()
      .getSlots()
      .forEach((slot: googletag.Slot) => {
        const slotId = slot.getSlotElementId();
        const elem = doc.getElementById(slotId);
        let rect = {
          width: 0,
          height: 0,
        };

        if (elem) {
          rect = elem.getBoundingClientRect();
        }

        const adSlot: SlotMetrics = {
          slotId,
          slotSize: rect
            ? `${Math.round(rect.width)}x${Math.round(rect.height)}`
            : "0x0",
          adUnitPath: slot.getAdUnitPath(),
          totalViewTime: 0,
          lastViewStarted: 0,
          visibleOnStart: false,
          adWasViewed: false,
          rfv: slot.getTargeting("rfv")[0],
          creativeId: slot.getTargeting("creativeId")[0],
          lineItemId: slot.getTargeting("lineItemId")[0],
          totalHoverTime: 0,
          lastHoverStarted: 0,
        };

        addDistinctRegisteredSlot(adSlot);

        if (elem) {
          adObserver.observe(elem);
          adListeners(elem, adSlot);
        }
      });
  });

  // listen for the inbrain.loaded event and retrieve array of DOM IDs
  // each Inbrain promo item should be registered as a distinct ad slot
  doc.addEventListener("inbrain.loaded", ((e: CustomEvent) => {
    e.detail.forEach((target) => {
      const elem = doc.getElementById(target);

      if (elem) {
        const rect = elem.getBoundingClientRect();

        addDistinctRegisteredSlot({
          slotId: target,
          slotSize: rect
            ? `${Math.round(rect.width)}x${Math.round(rect.height)}`
            : "0x0",
          totalViewTime: 0,
          lastViewStarted: 0,
          visibleOnStart: false,
          adWasViewed: false,
          totalHoverTime: 0,
          lastHoverStarted: 0,
        });

        adObserver.observe(elem);
      }
    });
  }) as EventListener);
}

export function onHiddenAds() {
  // remove ad slots from the set of visible slots and mark them as inactive
  // so we can restore them when a user tabs back into the document
  registeredSlots.forEach((slot) => {
    if (slot.visibleOnStart) {
      slot.lastViewStarted = 0;
    }
    const elem = doc.getElementById(slot.slotId);

    if (elem) {
      adObserver.unobserve(elem);
    }
  });
}

export function onVisibleAds() {
  // reset the last view started to the current time when the document first becomes visible
  registeredSlots.forEach((slot) => {
    if (slot.visibleOnStart) {
      slot.lastViewStarted = timeInSeconds();
    }
    const elem = doc.getElementById(slot.slotId);

    if (elem) {
      adObserver.observe(elem);
    }
  });
}

export function setAdViewMetrics() {
  registeredSlots.forEach((slot) => {
    if (slot.visibleOnStart) {
      updateSlotTimer(slot);
    }
  });
}

export function resetAdViewMetrics() {
  registeredSlots.forEach((slot) => {
    slot.totalViewTime = 0;
    slot.totalHoverTime = 0;
    slot.adWasViewed = false;
  });
}

function updateSlotTimer(slot: SlotMetrics) {
  const lastStarted = slot.lastViewStarted;
  const currentTime = timeInSeconds();

  // if the timer is currently running
  if (lastStarted) {
    // compute the difference between the current time and the start time
    // to determine the number of seconds the ad slot has been visible since the last
    // time it became visible
    const diff = currentTime - lastStarted;

    slot.totalViewTime += diff;
  }

  // update the last viewed time to the current time
  slot.lastViewStarted = currentTime;
}

function updateAdHoverTimer(event: string, slot: SlotMetrics) {
  const currentTime = timeInSeconds();
  let diff = 0;

  if (slot.lastHoverStarted !== 0) {
    diff = currentTime - slot.lastHoverStarted;
  }

  if (event === "mouseleave") {
    slot.totalHoverTime += diff;
  } else {
    slot.lastHoverStarted = currentTime;
  }
}

function adListeners(target: HTMLElement, slot: SlotMetrics): void {
  target.addEventListener("mouseenter", () => {
    updateAdHoverTimer("mouseenter", slot);
  });

  target.addEventListener("mouseleave", () => {
    updateAdHoverTimer("mouseleave", slot);
  });
}
