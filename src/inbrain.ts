// Copyright (c) Warner Media, LLC. All rights reserved. Licensed under the MIT license.
// See the LICENSE file for license information.
// /* eslint-disable @typescript-eslint/no-explicit-any  */
import { cookie } from "./utils/cookie/src";
import { sendRequest } from "./utils/sendRequest";
import { URLS } from "./utils/constants";
import { Psm } from "./Psm";
import { error, debug } from "./utils/logger";
import { hydratePayload } from "./utils/hydratePayload";
import { PayloadCore, InbrainMetrics } from "./payloadCore";

const win = window as any;
const doc = document as any;
const promoLoadedEventsSent = [];
const promoVisibleEventsSent = [];
const controlEventsSent = [];
const carouselDefaultConfig = {
  watchSlidesProgress: true,
  slidesPerView: "auto",
  spaceBetween: 20,
  navigation: {
    nextEl: ".inbrain-control-next",
    prevEl: ".inbrain-control-prev",
  },
};
let core: PayloadCore;
let inbrainMetrics: InbrainMetrics;

// Utility method for logs.
const log = (...args: string[]) => {
  if (win.location.search.search(/[?&]psm_debug=[1t]/) !== -1) {
    // console.log('[PSM]:', ...args);
  }
};

// Utility method to make requests.
function sendEvent(options) {
  const { env, data } = options;

  try {
    sendRequest(URLS.identity[env], {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch (err) {
    debug({
      err,
      eventType: "inbrain",
      methodName: "sendEvent",
    });
  }
}

// Checks to see if the promo should render into the page.
function shouldRender({ domain, pages }) {
  // Checks for a domain match
  if (win.location.hostname != domain) {
    return false;
  }

  // Checks for a page path match allowing wildcards
  const matches: boolean[] = [];

  try {
    pages.forEach((path) => {
      const splitPathForPromo = path.split("/");
      const splitPathFromWindow = window.location.pathname.split("/");

      let pathMatch = true;
      splitPathFromWindow.forEach((pathitem, index) => {
        if (splitPathForPromo[index] != "*") {
          if (splitPathForPromo[index] != pathitem) {
            pathMatch = false;
          }
        }
      });
      matches.push(pathMatch);
    });
  } catch (err) {
    error({
      err,
      eventType: "inbrain",
      methodName: "shouldRender",
    });
    return false;
  }

  return matches.indexOf(true) != -1;
}

// Wait for an element that satisfies a DOM selector to exist, then resolve with the element.
function elementReady(selector: string): Promise<Element> {
  return new Promise((resolve) => {
    let elem = doc.querySelector(selector);

    if (elem) {
      resolve(elem);
    }

    new MutationObserver((_, observer) => {
      elem = doc.querySelector(selector);

      if (elem) {
        resolve(elem);
        observer.disconnect();
      }
    }).observe(doc.documentElement, {
      childList: true,
      subtree: true,
    });
  });
}

// Initializes the swiper carousel.
function initCarousel(config) {
  config = config || carouselDefaultConfig;
  config.watchSlidesProgress = true;
  config.slidesPerView = "auto";

  return new Promise((resolve, reject) => {
    const swiperStyles = doc.createElement("link");
    swiperStyles.type = "text/css";
    swiperStyles.rel = "stylesheet";
    swiperStyles.href = URLS.cdnOrigin + URLS.carouselStyles;
    const s = doc.head.getElementsByTagName("link")[0];

    if (s && s.parentElement) {
      s.parentElement.insertBefore(swiperStyles, s);
    } else {
      doc.head.appendChild(swiperStyles);
    }

    const swiperScript = doc.createElement("script");
    swiperScript.type = "text/javascript";
    swiperScript.src = URLS.cdnOrigin + URLS.carouselScript;
    swiperScript.addEventListener("load", () => {
      // @ts-ignore
      win.inbrainCarousel = new Swiper(".inbrain-carousel", config);

      resolve(true);
    });
    doc.head.appendChild(swiperScript);
  });
}

// Grabs the correct promo content URL and adds in needed params.
function getContentURL(psm, env: string) {
  const hhid = cookie.get("hhid") as any;
  const usp = cookie.get("usprivacy") as string;
  const location = psm.getLocationProperties();
  const device = psm.getDeviceProperties();
  const ids = psm.getIds();
  const brand = psm.getBrand();

  let inbrainURL = URLS.inbrain[env];
  inbrainURL += `?ukid=${encodeURIComponent(psm.ukid)}`;
  inbrainURL += `&csid=${encodeURIComponent(psm.getCSID())}`;
  inbrainURL += `&url=${encodeURIComponent(window.location.href)}`;
  inbrainURL += `&usp=${encodeURIComponent(usp)}`;
  inbrainURL += `&inBrainTemplateBeta=${psm.queryFlag("inBrainTemplateBeta")}`;
  inbrainURL += `&inBrainRecommendationsBeta=${psm.queryFlag(
    "inBrainRecommendationsBeta"
  )}`;
  inbrainURL += `&deviceType=${encodeURIComponent(device.type)}`;
  inbrainURL += `&location=${encodeURIComponent(location.state)}`;
  inbrainURL += `&language=${encodeURIComponent(location.language)}`;
  inbrainURL += `&ecid=${encodeURIComponent(ids.ecid)}`;
  inbrainURL += `&kruxid=${encodeURIComponent(ids.kruxid)}`;
  inbrainURL += `&brand=${encodeURIComponent(brand)}`;

  if (hhid) {
    inbrainURL += `&hhid=${encodeURIComponent(hhid)}`;
  }

  return inbrainURL;
}

function setInbrainMetrics(options) {
  const { psm, id, promoPosition, destinationURL } = options;
  inbrainMetrics = {
    id,
    promoPosition,
    destinationURL,
    featureFlagValues: psm.getFlags(),
  };
}

export function getInbrainMetrics(): InbrainMetrics {
  return inbrainMetrics;
}

export async function initInbrain(psm: Psm, payloadCore: PayloadCore) {
  // grab the environment from prism
  const env = psm.config.psmEnvironment.toUpperCase();
  core = payloadCore;

  // Checks inbrain FF to see if inbrain is enabled also ensure optimizely is not in control
  // of InBrain.
  if (!win.optimizelyInControlOfInBrain && !psm.queryFlag("inbrain")) {
    return;
  }

  // Checks to see if optimizely is in control of inbrain, if so then checks the optimizely flag
  // to see if it is off, if so do not load the library, otherwise proceed.
  if (win.optimizelyInControlOfInBrain && !win.optimizelyInBrainEnabled) {
    return;
  }

  // Check to ensure the load within the US
  if (psm.ukid == "Unknown") {
    return;
  }

  log("INBRAIN v2.0.5");

  let response = null;
  try {
    // grab inbrain promo content for this domain from the CDN
    response = await sendRequest(getContentURL(psm, env));
  } catch (err) {
    error({
      err,
      eventType: "inbrain",
      methodName: "initInbrain",
    });
    return;
  }

  if (!response) {
    return;
  }

  const { domain, pages, target, placement, html, carousel } = response;

  // make sure domain and page matches the promo
  if (!shouldRender({ domain, pages })) {
    return;
  }

  // wait until target element exists in the DOM
  elementReady(target).then(() => {
    let renderedHTML;
    try {
      renderedHTML = decodeURIComponent(html);
    } catch (err) {
      error({
        err,
        eventType: "inbrain",
        methodName: "initInbrainV2",
      });
      return;
    }

    switch (placement) {
      case "within":
        doc.querySelector(target).innerHTML = renderedHTML;
        break;
      case "before":
        doc
          .querySelector(target)
          .insertAdjacentHTML("beforebegin", renderedHTML);
        break;
      case "after":
        doc.querySelector(target).insertAdjacentHTML("afterend", renderedHTML);
        break;
    }

    // Initializes the carousel.
    initCarousel(carousel).then(() => {
      // Send off impression events for promos loaded into the carousel.
      sendPromoLoadedEvents({ psm, env });

      // listen for the user to click the carousel scroll button then send
      // viewable impressions for the promos in the carousel, but only for
      // promos that haven't sent viewable impression
      win.inbrainCarousel.on("slideChange", function () {
        sendPromoLoadedEvents({ psm, env });
        sendPromoVisibleEvents({ psm, env });
      });

      win.addEventListener("resize", () => {
        sendPromoLoadedEvents({ psm, env });
      });

      // Send inbrain viewed events once a promo item is more than 50% in the viewport
      // for at least 1 second.
      new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting || entry.intersectionRatio >= 0.5) {
              sendPromoVisibleEvents({ psm, env });
              observer.disconnect();
            }
          });
        },
        {
          root: null,
          rootMargin: "0px",
          threshold: [0.0, 0.5, 1.0],
        }
      ).observe(doc.querySelector(target));
    });

    // Attach click event listeners to all promos.
    grabAllPromos().forEach((elem: any) => {
      const id = elem.dataset.inbrain;
      const promoPosition = elem.dataset.slotindex;
      const destinationURL = elem.href;

      elem.addEventListener("click", () => {
        setInbrainMetrics({ psm, id, promoPosition, destinationURL });
        hydratePayload(psm, core);
        core.trackInbrain("Inbrain Click", new Date().toISOString(), (data) => {
          sendEvent({
            env,
            data,
          });
        });
      });
    });
  });
}

// Grabs all promos loaded into the carousel.
function grabCarouselPromos(grabIDs = false) {
  const elements = document.querySelectorAll(".swiper-slide-visible a");
  if (grabIDs) {
    const elementIDs = [];
    elements.forEach((el: any) => {
      elementIDs.push(el.dataset.inbrain);
    });
    return elementIDs;
  }
  return elements;
}

// Grabs all promos, regardless of whether or not they are in the carousel.
function grabAllPromos() {
  return doc.querySelectorAll("[data-inbrain]");
}

// Utility method to send all promo loaded events.
function sendPromoLoadedEvents({ psm, env }) {
  grabCarouselPromos().forEach((elem) => {
    const id = elem.dataset.inbrain;

    if (!promoLoadedEventsSent.includes(id)) {
      setInbrainMetrics({ psm, id });
      hydratePayload(psm, core);
      core.trackInbrain(
        "Inbrain Promo Loaded",
        new Date().toISOString(),
        (data) => {
          sendEvent({
            env,
            data,
          });
        }
      );
      promoLoadedEventsSent.push(id);
    }
  });
}

// Utility method to send all promo visible events.
function sendPromoVisibleEvents({ psm, env }) {
  grabCarouselPromos().forEach((elem) => {
    const id = elem.dataset.inbrain;

    if (!promoVisibleEventsSent.includes(id)) {
      setInbrainMetrics({ psm, id });
      hydratePayload(psm, core);
      core.trackInbrain(
        "Inbrain Promo Visible",
        new Date().toISOString(),
        (data) => {
          sendEvent({
            env,
            data,
          });
        }
      );
      promoVisibleEventsSent.push(id);
    }
  });
}

function sendInbrainControlEvents({ html, psm, env }) {
  const renderedHTML = decodeURIComponent(html);
  const arr = renderedHTML.split('data-slotindex="');

  for (let i = 1; i < arr.length; i++) {
    const promoPosition = arr[i].charAt(0);

    const dataset = arr[i].match(/data-inbrain="(.+)"/g);
    const elem = dataset[0].split("=")[1];
    const id = elem.replace('"', "");

    if (!controlEventsSent.includes(id)) {
      setInbrainMetrics({ psm, id, promoPosition });
      hydratePayload(psm, core);
      core.trackInbrain("Inbrain Control", new Date().toISOString(), (data) => {
        sendEvent({
          env,
          data,
        });
      });
      controlEventsSent.push(id);
    }
  }
}
