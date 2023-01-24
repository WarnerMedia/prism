import { CookieOptions } from ".";

export const debug = (...args: (string | object | number | boolean)[]) => {
  if (window.location.search.search(/[?&]psm_debug=[1t]/) !== -1) {
    console.info(...args);
  }
};

export function cookieHelper(
  name?: string,
  value?: string,
  options?: Partial<CookieOptions>
): string | object | void {
  switch (arguments.length) {
    case 3:
    case 2:
      return set(name, value, options);
    case 1:
      return get(name);
    default:
      return all();
  }
}

/**
 * Set cookie `name` to `value`.
 */
function set(name: string, value: string, options: Partial<CookieOptions>) {
  options = options || {};
  let str = encode(name) + "=" + encode(value);

  if (options.encode === false) {
    str = name + "=" + value;
  }

  if (null == value) options.maxage = -1;

  if (options.maxage && !options.expires) {
    options.expires = new Date(+new Date() + options.maxage);
  }

  if (options.path) str += "; Path=" + options.path;
  if (options.domain) str += "; Domain=" + options.domain;
  if (options.expires) str += "; Expires=" + options.expires.toUTCString();
  if (options.samesite) str += "; SameSite=" + options.samesite;
  if (options.secure) str += "; Secure";

  debug("[COOKIE]: cookie.helper.set()", str, options);

  document.cookie = str;
}

/**
 * Return all cookies.
 */
function all(): object {
  let str: string;
  try {
    str = document.cookie;
  } catch (err) {
    if (typeof console !== "undefined" && typeof console.error === "function") {
      console.error(err.stack || err);
    }
    return {};
  }
  return parse(str);
}

/**
 * Get cookie `name`.
 */
function get(name: string): string {
  const val = all()[name];

  debug(`[COOKIE]: helper.get() - getting ${name} cookie value ${val}`);

  return val;
}

/**
 * Parse cookie `str`.
 */
function parse(str: string): { [key: string]: string } {
  const obj = {};
  const pairs = str.split(/ *; */);
  let pair: string[];

  if ("" == pairs[0]) return obj;

  for (let i = 0; i < pairs.length; ++i) {
    const cookieName = pairs[i].substr(0, pairs[i].indexOf("="));
    const cookieValue = pairs[i].substr(pairs[i].indexOf("=") + 1);
    obj[decode(cookieName)] = decode(cookieValue);
  }

  return obj;
}

function encode(value: string | number | boolean): string {
  try {
    return encodeURIComponent(value);
  } catch (err) {
    // ignore
  }
}

function decode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch (err) {
    // ignore
  }
}
