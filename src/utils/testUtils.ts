import "jest-extended";
import "@testing-library/jest-dom";

const originalCookie = document.cookie;

export const blockCookieAccess = () => {
  Object.defineProperty(document, "cookie", {
    get: jest.fn(() => {
      throw new Error("denied!");
    }),
    set: jest.fn(() => {
      throw new Error("denied!");
    }),
    configurable: true,
  });
};

export const restoreCookieAccess = () => {
  Object.defineProperty(document, "cookie", {
    value: originalCookie,
    configurable: true,
    writable: true,
  });
};

export const clearAllCookies = () => {
  document.cookie.split("; ").forEach((entry) => {
    document.cookie = `${
      entry.split("=")[0]
    }=; expires=1 Jan 1970 00:00:00 GMT;`;
  });
};

export const isoDate = "2024-01-01T09:09:09.000Z";
const originalDate = Date;
const currentDate = new Date(isoDate);

export const mockDate = () => {
  global.Date = class extends Date {
    constructor(...args: string[]) {
      if (args.length > 0) {
        // @ts-ignore
        return super(...args);
      }
      return currentDate;
    }
  } as DateConstructor;
};

export const clearMockDate = () => {
  global.Date = originalDate;
};

class MockStorage {
  constructor(jestInstance: typeof jest) {
    Object.defineProperty(this, "getItem", {
      enumerable: false,
      value: jestInstance.fn((key: string) =>
        this[key] !== undefined ? this[key] : null
      ),
    });
    Object.defineProperty(this, "setItem", {
      enumerable: false,
      // not mentioned in the spec, but we must always coerce to a string
      value: jestInstance.fn((key: string, val = "") => {
        this[key] = val + "";
      }),
    });
    Object.defineProperty(this, "removeItem", {
      enumerable: false,
      value: jestInstance.fn((key: string) => {
        delete this[key];
      }),
    });
    Object.defineProperty(this, "clear", {
      enumerable: false,
      value: jestInstance.fn(() => {
        Object.keys(this).map((key) => delete this[key]);
      }),
    });
    Object.defineProperty(this, "toString", {
      enumerable: false,
      value: jestInstance.fn(() => {
        return "[object Storage]";
      }),
    });
    Object.defineProperty(this, "key", {
      enumerable: false,
      value: jestInstance.fn((idx: number) => Object.keys(this)[idx] || null),
    });
  } // end constructor

  get length() {
    return Object.keys(this).length;
  }
  // for backwards compatibility
  get __STORE__() {
    return this;
  }
}

export const mockStorage = () => {
  if (typeof global["_localStorage"] !== "undefined") {
    Object.defineProperty(global, "_localStorage", {
      value: new MockStorage(jest),
      writable: false,
    });
  } else {
    // @ts-ignore
    global["localStorage"] = new MockStorage(jest);
  }
  if (typeof global["_sessionStorage"] !== "undefined") {
    Object.defineProperty(global, "_sessionStorage", {
      value: new MockStorage(jest),
      writable: false,
    });
  } else {
    // @ts-ignore
    global["sessionStorage"] = new MockStorage(jest);
  }
};

export let xhr: {
  setRequestHeader: jest.Mock;
  open: jest.Mock;
  send: jest.Mock;
  onload?: () => void;
  onerror?: (err: Error) => void;
  status?: number;
  statusText?: string;
  responseText?: string;
};

export const mockXhr = () => {
  xhr = {
    setRequestHeader: jest.fn(),
    open: jest.fn(),
    send: jest.fn(),
    status: 200,
    statusText: "OK",
    responseText: '{"a":"b"}',
  };

  // @ts-ignore
  global.XMLHttpRequest = jest.fn(() => xhr);
};

export const unmockXhr = () => {
  delete global.XMLHttpRequest;
};

const originalIntl = global.Intl;

export const mockIntl = () => {
  Object.defineProperty(global, "Intl", {
    value: {
      DateTimeFormat: () => ({
        resolvedOptions: () => ({
          calendar: "gregory",
          day: "numeric",
          locale: "en-US",
          month: "numeric",
          numberingSystem: "latn",
          timeZone: "UTC",
          year: "numeric",
        }),
      }),
    },
    configurable: true,
    writable: true,
  });
};

export const clearMockIntl = () => {
  Object.defineProperty(global, "Intl", {
    value: originalIntl,
    configurable: true,
    writable: true,
  });
};

export const MOCK_UUID = "00000000-0000-0000-0000-000000000000";

// UserAgents sourced from https://www.whatismybrowser.com/guides/the-latest-user-agent/
// We should consider finding a library/tool to get this info instead of this
export const USER_AGENTS = {
  chrome: {
    android: [
      "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Mobile Safari/537.36",
      "Mozilla/5.0 (Linux; Android 10; SM-A205U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Mobile Safari/537.36",
      "Mozilla/5.0 (Linux; Android 10; SM-A102U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Mobile Safari/537.36",
      "Mozilla/5.0 (Linux; Android 10; SM-G960U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Mobile Safari/537.36",
      "Mozilla/5.0 (Linux; Android 10; SM-N960U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Mobile Safari/537.36",
      "Mozilla/5.0 (Linux; Android 10; LM-Q720) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Mobile Safari/537.36",
      "Mozilla/5.0 (Linux; Android 10; LM-X420) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Mobile Safari/537.36",
      "Mozilla/5.0 (Linux; Android 10; LM-Q710(FGN)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Mobile Safari/537.36",
    ],
    iOS: [
      "Mozilla/5.0 (iPhone; CPU iPhone OS 14_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/87.0.4280.77 Mobile/15E148 Safari/604.1",
      "Mozilla/5.0 (iPad; CPU OS 14_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/87.0.4280.77 Mobile/15E148 Safari/604.1",
      "Mozilla/5.0 (iPod; CPU iPhone OS 14_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/87.0.4280.77 Mobile/15E148 Safari/604.1",
    ],
    linux: [
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 11_2_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36",
    ],
    macOS: [
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36",
    ],
    windows: [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36",
      "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36",
      "Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36",
    ],
  },
  edge: {
    android: [
      "Mozilla/5.0 (Linux; Android 10; HD1913) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Mobile Safari/537.36 EdgA/46.1.2.5140",
      "Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Mobile Safari/537.36 EdgA/46.1.2.5140",
      "Mozilla/5.0 (Linux; Android 10; Pixel 3 XL) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Mobile Safari/537.36 EdgA/46.1.2.5140",
      "Mozilla/5.0 (Linux; Android 10; ONEPLUS A6003) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Mobile Safari/537.36 EdgA/46.1.2.5140",
    ],
    iOS: [
      "Mozilla/5.0 (iPhone; CPU iPhone OS 14_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 EdgiOS/46.1.10 Mobile/15E148 Safari/605.1.15",
    ],
    macOS: [
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 11_2_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36 Edg/89.0.774.57",
    ],
    windows: [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36 Edg/89.0.774.57",
      "Mozilla/5.0 (Windows Mobile 10; Android 10.0; Microsoft; Lumia 950XL) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Mobile Safari/537.36 Edge/40.15254.603",
    ],
  },
  firefox: {
    android: [
      "Mozilla/5.0 (Android 11; Mobile; rv:68.0) Gecko/68.0 Firefox/86.0",
      "Mozilla/5.0 (Android 11; Mobile; LG-M255; rv:86.0) Gecko/86.0 Firefox/86.0",
    ],
    iOS: [
      "Mozilla/5.0 (iPhone; CPU iPhone OS 11_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/32.0 Mobile/15E148 Safari/605.1.15",
      "Mozilla/5.0 (iPad; CPU OS 11_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/32.0 Mobile/15E148 Safari/605.1.15",
      "Mozilla/5.0 (iPod touch; CPU iPhone OS 11_2_3 like Mac OS X) AppleWebKit/604.5.6 (KHTML, like Gecko) FxiOS/32.0 Mobile/15E148 Safari/605.1.15",
    ],
    linux: [
      "Mozilla/5.0 (X11; Linux i686; rv:86.0) Gecko/20100101 Firefox/86.0",
      "Mozilla/5.0 (Linux x86_64; rv:86.0) Gecko/20100101 Firefox/86.0",
      "Mozilla/5.0 (X11; Ubuntu; Linux i686; rv:86.0) Gecko/20100101 Firefox/86.0",
      "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:86.0) Gecko/20100101 Firefox/86.0",
      "Mozilla/5.0 (X11; Fedora; Linux x86_64; rv:86.0) Gecko/20100101 Firefox/86.0",
      "Mozilla/5.0 (X11; Linux i686; rv:78.0) Gecko/20100101 Firefox/78.0",
      "Mozilla/5.0 (Linux x86_64; rv:78.0) Gecko/20100101 Firefox/78.0",
      "Mozilla/5.0 (X11; Ubuntu; Linux i686; rv:78.0) Gecko/20100101 Firefox/78.0",
      "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:78.0) Gecko/20100101 Firefox/78.0",
      "Mozilla/5.0 (X11; Fedora; Linux x86_64; rv:78.0) Gecko/20100101 Firefox/78.0",
    ],
    macOS: [
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 11.2; rv:86.0) Gecko/20100101 Firefox/86.0",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 11.2; rv:78.0) Gecko/20100101 Firefox/78.0",
    ],
    windows: [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:86.0) Gecko/20100101 Firefox/86.0",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:78.0) Gecko/20100101 Firefox/78.0",
    ],
  },
  internetExplorer: {
    windows: [
      "Mozilla/5.0 (Windows NT 6.1; Trident/7.0; rv:11.0) like Gecko",
      "Mozilla/5.0 (Windows NT 6.2; Trident/7.0; rv:11.0) like Gecko",
      "Mozilla/5.0 (Windows NT 6.3; Trident/7.0; rv:11.0) like Gecko",
      "Mozilla/5.0 (Windows NT 10.0; Trident/7.0; rv:11.0) like Gecko",
    ],
  },
  opera: {
    android: [
      "Mozilla/5.0 (Linux; Android 10; VOG-L29) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Mobile Safari/537.36 OPR/61.2.3076.56749, Mozilla/5.0 (Linux; Android 10; SM-G970F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Mobile Safari/537.36 OPR/61.2.3076.56749",
      "Mozilla/5.0 (Linux; Android 10; SM-N975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Mobile Safari/537.36 OPR/61.2.3076.56749",
    ],
    linux: [
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36 OPR/74.0.3911.232",
    ],
    macOS: [
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 11_2_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36 OPR/74.0.3911.232",
    ],
    windows: [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36 OPR/74.0.3911.232",
      "Mozilla/5.0 (Windows NT 10.0; WOW64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36 OPR/74.0.3911.232",
    ],
  },
  safari: {
    iOS: [
      "Mozilla/5.0 (iPhone; CPU iPhone OS 14_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1",
      "Mozilla/5.0 (iPad; CPU OS 14_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1",
      "Mozilla/5.0 (iPod touch; CPU iPhone 14_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1",
    ],
    macOS: [
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 11_2_3) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Safari/605.1.15",
    ],
    windows: [],
  },
};

const originalUserAgent = global.navigator.userAgent;

export const mockUserAgent = () => {
  Object.defineProperty(global.navigator, "userAgent", {
    value:
      "Mozilla/5.0 (darwin) AppleWebKit/537.36 (KHTML, like Gecko) jsdom/16.3.0",
    writable: true,
  });
};

export const clearMockUserAgent = () => {
  Object.defineProperty(global.navigator, "userAgent", {
    value: originalUserAgent,
    writable: true,
  });
};

type Item = {
  callback: IntersectionObserverCallback;
  elements: Set<Element>;
  created: number;
};

const observers = new Map<IntersectionObserver, Item>();

beforeEach(() => {
  /**
   * Create a custom IntersectionObserver mock, allowing us to intercept the observe and unobserve calls.
   * We keep track of the elements being observed, so when `mockAllIsIntersecting` is triggered it will
   * know which elements to trigger the event on.
   */
  global.IntersectionObserver = jest.fn((cb, options = {}) => {
    const item = {
      callback: cb,
      elements: new Set<Element>(),
      created: Date.now(),
    };
    const instance: IntersectionObserver = {
      thresholds: Array.isArray(options.threshold)
        ? options.threshold
        : [options.threshold ?? 0],
      root: options.root ?? null,
      rootMargin: options.rootMargin ?? "",
      observe: jest.fn((element: Element) => {
        item.elements.add(element);
      }),
      unobserve: jest.fn((element: Element) => {
        item.elements.delete(element);
      }),
      disconnect: jest.fn(() => {
        observers.delete(instance);
      }),
      takeRecords: jest.fn(),
    };

    observers.set(instance, item);

    return instance;
  });
});

afterEach(() => {
  // @ts-ignore
  global.IntersectionObserver.mockClear();
  observers.clear();
});

function triggerIntersection(
  elements: Element[],
  trigger: boolean | number,
  observer: IntersectionObserver,
  item: Item
) {
  const entries: IntersectionObserverEntry[] = [];

  const isIntersecting =
    typeof trigger === "number"
      ? observer.thresholds.some((threshold) => trigger >= threshold)
      : trigger;

  const ratio =
    typeof trigger === "number"
      ? observer.thresholds.find((threshold) => trigger >= threshold) ?? 0
      : trigger
      ? 1
      : 0;

  elements.forEach((element) => {
    entries.push({
      boundingClientRect: element.getBoundingClientRect(),
      intersectionRatio: ratio,
      intersectionRect: isIntersecting
        ? element.getBoundingClientRect()
        : {
            bottom: 0,
            height: 0,
            left: 0,
            right: 0,
            top: 0,
            width: 0,
            x: 0,
            y: 0,
            toJSON(): any {
              // empty
            },
          },
      isIntersecting,
      rootBounds: observer.root
        ? (observer.root as Element).getBoundingClientRect()
        : null,
      target: element,
      time: Date.now() - item.created,
    });
  });

  // Trigger the IntersectionObserver callback with all the entries
  item.callback(entries, observer);
}

/**
 * Set the `isIntersecting` on all current IntersectionObserver instances
 * @param isIntersecting {boolean | number}
 */
export function mockAllIsIntersecting(isIntersecting: boolean | number) {
  for (const [observer, item] of observers) {
    triggerIntersection(
      Array.from(item.elements),
      isIntersecting,
      observer,
      item
    );
  }
}

/**
 * Call the `intersectionMockInstance` method with an element, to get the (mocked)
 * `IntersectionObserver` instance. You can use this to spy on the `observe` and
 * `unobserve` methods.
 */
export function intersectionMockInstance(
  element: Element
): IntersectionObserver {
  for (const [observer, item] of observers) {
    if (item.elements.has(element)) {
      return observer;
    }
  }

  throw new Error(
    "Failed to find IntersectionObserver for element. Is it being observer?"
  );
}
