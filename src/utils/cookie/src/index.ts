import findTopDomain from "@segment/top-domain";
import { cookieHelper, debug } from "./helper";

export interface CookieModule {
  options(options?: CookieOptions): void | CookieOptions;
  set(name: string, value: string | object | boolean): boolean;
  get(name: string): string | object | boolean | null;
  remove(name: string): boolean;
}

export interface CookieOptions {
  maxage?: number;
  expires?: Date;
  domain?: string | null;
  path?: string;
  secure?: boolean;
  samesite?: string;
  useRootDomain?: boolean;
  encode?: boolean;
}

export class Cookie implements CookieModule {
  private _options: CookieOptions = {};

  constructor(options?: CookieOptions) {
    this.options = this.options.bind(this);
    this.set = this.set.bind(this);
    this.get = this.get.bind(this);
    this.getAll = this.getAll.bind(this);
    this.remove = this.remove.bind(this);
    this.options(options);
  }

  options(options?: CookieOptions): undefined | CookieOptions {
    if (arguments.length === 0) return this._options;

    options = options || {};

    let domain: CookieOptions["domain"] =
      options.domain || `.${findTopDomain(window.location.href)}`;

    if (domain === ".") {
      domain = null;
    }

    this._options = {
      maxage: 31536000000,
      path: "/",
      samesite: "Lax",
      encode: true,
      ...options,
      domain,
    };

    // http://curl.haxx.se/rfc/cookie_spec.html
    // https://publicsuffix.org/list/effective_tld_names.dat
    //
    // try setting a dummy cookie with the options
    // if the cookie isn't set, it probably means
    // that the domain is on the public suffix list
    // like myapp.deployment.com or localhost / ip.
    this.set("psm:test", true, this._options);
    if (!this.get("psm:test")) {
      debug(
        "[Cookie]: psm:test cookie could not be set at domain: ",
        this._options.domain
      );
      const reg = new RegExp(document.location.hostname, "g");
      if (document.referrer !== "" && document.referrer.search(reg) === -1) {
        this._options.samesite = "None";
      } else {
        this._options.domain = null;
      }
    }
    this.remove("psm:test");

    debug("[COOKIE]: this._options", this._options);
  }

  set(
    name: string,
    value: string | object | boolean,
    options: Partial<CookieOptions> = {}
  ): boolean {
    const opts = { ...this._options, ...options };

    debug("[COOKIE]: this.set() options", opts);

    try {
      if (typeof value !== "string") {
        value = JSON.stringify(value);
      }
      // @ts-ignore
      cookieHelper(name, value === "null" ? null : value, opts);
      return true;
    } catch (err) {
      debug("[COOKIE]: this.set() encountered an error", err);
      return false;
    }
  }

  get(name: string): string | object | boolean | null {
    const value = cookieHelper(name) as string | undefined;

    try {
      return JSON.parse(value);
    } catch (err) {
      // debug('[COOKIE]: this.get() encountered an error', err);
      return value || null;
    }
  }

  getAll() {
    return cookieHelper();
  }

  remove(name: string): boolean {
    try {
      cookieHelper(name, null, { ...this._options });
      return true;
    } catch (err) {
      debug("[COOKIE]: this.remove() encountered an error", err);
      return false;
    }
  }
}

export const cookie = new Cookie();
export { findTopDomain };
