export type RequestOptions = {
  method?: string;
  headers?: Record<string, string>;
  body?: Parameters<XMLHttpRequest["send"]>[0];
};

interface RequestErrorOptions {
  request: XMLHttpRequest;
  url: string;
  opts: RequestOptions;
}

export class SendRequestError extends Error {
  context: {
    url: string;
    code: number;
    headers: Record<string, string>;
    method: string;
  };

  constructor(options: RequestErrorOptions) {
    const { request, url, opts } = options;
    const message = request.responseText
      ? request.responseText
      : "network failure";

    super(message);
    // this.name = 'SendRequestError';
    this.context = {
      url: url,
      code: request.status,
      headers: opts.headers,
      method: opts.method,
    };
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function sendRequest(
  url: string,
  options: RequestOptions = {}
): Promise<any> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();

    request.open(options.method || "get", url);
    request.onload = () => {
      if (((request.status / 100) | 0) == 2) {
        try {
          // GET requests will return a parseable response
          resolve(JSON.parse(request.responseText));
        } catch (err) {
          // POST requests to Doppler do not include a response, or return an error string
          resolve(request.responseText);
        }
      } else {
        // Non 200 status codes
        reject(new SendRequestError({ request, url, opts: options }));
      }
    };
    request.onerror = () => {
      reject(new SendRequestError({ request, url, opts: options }));
    };

    for (const i in options.headers) {
      request.setRequestHeader(i, options.headers[i]);
    }

    request.send(options.body || null);
  });
}
