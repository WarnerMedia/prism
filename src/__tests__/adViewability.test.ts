import "jest-extended";
import { advanceBy, advanceTo, clear } from "jest-date-mock";
import {
  intersectionMockInstance,
  mockAllIsIntersecting,
} from "../utils/testUtils";
import {
  initAdViewListeners,
  onHiddenAds,
  onVisibleAds,
  registeredSlots,
  setAdViewMetrics,
} from "../adViewability";

jest.mock("../utils/browser", () => ({
  isElementVisible: jest.fn(() => true),
}));

const documentBody = `
    <div id="slot-1" class="ad-slot"></div>
    <div id="slot-2" class="ad-slot native-slot"></div>
`;

const createSlot = (id: string) => ({
  getSlotElementId: jest.fn().mockImplementation(() => id),
  getAdUnitPath: jest.fn().mockImplementation(() => `${id}-unit`),
  getTargeting: jest.fn().mockImplementation(() => []),
});

const processCommandQueue = () => {
  // @ts-ignore
  window.googletag.cmd.forEach((cmd) => cmd());
};

const listeners = {};
const fireEvent = (eventType, event) => {
  for (const listener of listeners[eventType] || []) {
    listener(event);
  }
};

const pubads = {
  addEventListener: jest.fn().mockImplementation((name, cb) => {
    listeners[name] = listeners[name] || [];
    listeners[name].push(cb);
  }),
  getSlots: jest
    .fn()
    .mockImplementation(() => [createSlot("slot-1"), createSlot("slot-2")]),
};

const googletag = {
  apiReady: true,
  cmd: [],
  pubads: jest.fn().mockImplementation(() => pubads),
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
window.googletag = googletag as any;

describe("Ad Viewability", () => {
  beforeEach(() => {
    document.body.innerHTML = documentBody;
  });

  afterEach(() => {
    window.googletag.cmd = [];
    registeredSlots.length = 0;
  });

  it("should enqueue a function to the command array", () => {
    mockAllIsIntersecting(true);
    initAdViewListeners();

    expect(window.googletag.cmd).toHaveLength(1);
    expect(window.googletag.cmd[0]).toBeFunction();
  });

  it("should invoke getSlots", () => {
    mockAllIsIntersecting(true);
    initAdViewListeners();
    processCommandQueue();
    const observer = intersectionMockInstance(
      document.getElementById("slot-1")
    );

    expect(pubads.getSlots).toHaveBeenCalledTimes(1);
    expect(observer.observe).toHaveBeenCalledTimes(2);
  });

  it("should handle slotRenderEnded events with slot size as string", () => {
    initAdViewListeners();
    processCommandQueue();

    fireEvent("slotRenderEnded", {
      slot: createSlot("slot-3"),
      size: "300x250",
    });

    expect(registeredSlots).toHaveLength(3);
    expect(registeredSlots.find((slot) => slot.slotId === "slot-3")).toEqual({
      adUnitPath: "slot-3-unit",
      lastViewStarted: 0,
      slotId: "slot-3",
      slotSize: "300x250",
      totalViewTime: 0,
      visibleOnStart: false,
      adWasViewed: false,
      creativeId: undefined,
      lastHoverStarted: 0,
      lineItemId: undefined,
      rfv: undefined,
      totalHoverTime: 0,
    });
  });

  it("should handle slotRenderEnded events with slot size as array", () => {
    initAdViewListeners();
    processCommandQueue();

    fireEvent("slotRenderEnded", {
      slot: createSlot("slot-3"),
      size: ["300", "250"],
    });

    expect(registeredSlots).toHaveLength(3);
    expect(registeredSlots.find((slot) => slot.slotId === "slot-3")).toEqual({
      adUnitPath: "slot-3-unit",
      lastViewStarted: 0,
      slotId: "slot-3",
      slotSize: "300x250",
      totalViewTime: 0,
      visibleOnStart: false,
      adWasViewed: false,
      creativeId: undefined,
      lastHoverStarted: 0,
      lineItemId: undefined,
      rfv: undefined,
      totalHoverTime: 0,
    });
  });

  it("should expose registeredSlots", () => {
    initAdViewListeners();
    processCommandQueue();

    expect(registeredSlots).toHaveLength(2);
  });

  it("should mark ads as inactive with onHiddenAds", () => {
    initAdViewListeners();
    processCommandQueue();
    mockAllIsIntersecting(true);
    onHiddenAds();

    registeredSlots.forEach((slot) => {
      expect(slot.lastViewStarted).toBe(0);
    });
  });

  it("should set lastViewStarted to current time with onVisibleAds", () => {
    advanceTo(new Date(1612155600000));
    initAdViewListeners();
    processCommandQueue();
    mockAllIsIntersecting(true);
    onVisibleAds();

    registeredSlots.forEach((slot) => {
      expect(slot.lastViewStarted).toBe(1612155600);
    });

    clear();
  });

  it("should update the total time in-view with setAdViewMetrics", () => {
    advanceTo(new Date(1612155600000));
    initAdViewListeners();
    processCommandQueue();
    mockAllIsIntersecting(true);
    advanceBy(5000);
    setAdViewMetrics();

    registeredSlots.forEach((slot) => {
      expect(slot.totalViewTime).toBe(5);
    });

    clear();
  });
});
