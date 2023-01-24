export interface PayloadMap {
  [key: string]: unknown;
}

export interface PayloadData {
  add: (key: string, value?: string) => void;
  addMap: (map: PayloadMap) => void;
  addJson: (key: string, json: Record<string, unknown>) => void;
  build: () => PayloadMap;
}

export function isJson(property: unknown): boolean {
  const record = property as Record<string, unknown> | null | undefined;
  return (
    typeof record !== "undefined" &&
    record !== null &&
    (record.constructor === {}.constructor ||
      record.constructor === [].constructor)
  );
}

export function isNonEmptyJson(property: Record<string, unknown>): boolean {
  if (!isJson(property)) {
    return false;
  }
  for (const key in property) {
    if (Object.prototype.hasOwnProperty.call(property, key)) {
      return true;
    }
  }
  return false;
}

export function payloadBuilder(): PayloadData {
  const payload: PayloadMap = {};

  const add = (key: string, value?: unknown): void => {
    if (value != null && value !== "") {
      // null also checks undefined
      payload[key] = value;
    }
  };

  const addMap = (map: PayloadMap): void => {
    for (const key in map) {
      if (Object.prototype.hasOwnProperty.call(map, key)) {
        add(key, map[key]);
      }
    }
  };

  const addJson = (key: string, json?: Record<string, unknown>): void => {
    if (json && isNonEmptyJson(json)) {
      const str = JSON.stringify(json);
      add(key, str);
    }
  };

  const build = (): PayloadMap => {
    return payload;
  };

  return {
    add,
    addMap,
    addJson,
    build,
  };
}
