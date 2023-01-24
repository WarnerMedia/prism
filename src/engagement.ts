// Copyright (c) Warner Media, LLC. All rights reserved. Licensed under the MIT license.
// See the LICENSE file for license information.
import { EngagementMetrics } from "./payloadCore";
import { detectDocumentSize, throttle } from "./utils/browser";
import { HEARTBEAT_INTERVAL } from "./utils/constants";

const win = window;
const doc = document;

const documentEvents = ["mousedown", "mousemove", "keydown"];
const windowEvents = ["scroll", "focus"];

export let lastEngagementEvent: number;
export let hbStartTimestamp: string = new Date().toISOString();

export let engagement: EngagementMetrics = {
  totalTime: 0,
  engagedTime: 0,
  interval: HEARTBEAT_INTERVAL / 1000,
  maxScrollDepth: win.scrollY < 0 ? 0 : win.scrollY,
  currentScrollPosition: win.scrollY < 0 ? 0 : win.scrollY,
  didScrollUpDuringInterval: false,
};

function handleEngagementEvent() {
  const current = win.scrollY < 0 ? 0 : win.scrollY;
  const totalHeight = detectDocumentSize()[1];

  if (current > engagement.currentScrollPosition) {
    engagement.maxScrollDepth = current >= totalHeight ? totalHeight : current;
  }
  if (current < engagement.currentScrollPosition) {
    engagement.didScrollUpDuringInterval = true;
  }
  engagement.currentScrollPosition = current;

  const now = new Date();

  // if we have a timestamp that denotes the last engagement event
  if (lastEngagementEvent) {
    // calculate the difference between the current time and the last engagement event in seconds
    const diff = Math.round((now.getTime() - lastEngagementEvent) / 1000);

    // if the difference is within a 3 second window, consider the difference "engaged" time
    // and add it to the engaged time total
    if (diff <= 3) {
      engagement.engagedTime += diff;
    }
  }

  // reset the last engagement event time to the current time
  lastEngagementEvent = now.getTime();
}

export function initEngagementEvents() {
  documentEvents.forEach((event) => {
    doc.addEventListener(event, throttle(handleEngagementEvent, 1000));
  });

  windowEvents.forEach((event) => {
    win.addEventListener(event, throttle(handleEngagementEvent, 1000));
  });
}

export function setEngagementMetrics() {
  const now = new Date();
  const start = new Date(hbStartTimestamp);

  engagement.totalTime = Math.round((now.getTime() - start.getTime()) / 1000);
}

export function resetHbInterval() {
  const scroll = win.scrollY < 0 ? 0 : win.scrollY;
  engagement = {
    totalTime: 0,
    engagedTime: 0,
    interval: HEARTBEAT_INTERVAL / 1000,
    maxScrollDepth: scroll,
    currentScrollPosition: scroll,
    didScrollUpDuringInterval: false,
  };
  hbStartTimestamp = new Date().toISOString();
  lastEngagementEvent = Date.now();
}
