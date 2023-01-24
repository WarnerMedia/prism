declare module "@segment/top-domain" {
  export default function topDomain(url: string): string;
  export function levels(url: string): string[];
  export function cookie(
    name?: string,
    value?: string | null,
    options?: {
      maxage?: number;
      expires?: Date;
      domain?: string;
      path?: string;
      secure?: boolean;
      samesite?: string;
    }
  ): void | string | object;
}
