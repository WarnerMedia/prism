# Prism

Prism is a web SDK that captures user data and generates IDs for user tracking. More info on the IDs it generates and Inbrain can be found in [`IDs`](###IDs) & [`Inbrain.`](###Inbrain)

## Repo Scripts

- `yarn clean`: Remove all build files and installed packages
- `yarn build`: Build all of the following packages, to be output in the `dist/` directory:
  - `prism-sdk.global.js` & `prism-sdk.global.js.map`: IIFE build and source map
  - `prism-sdk.js` & `prism-sdk.js.map`: CJS build and source map
  - `prism-sdk.mjs` & `prism-sdk.mjs.map`: ESM build and source map
- `yarn test`: Run unit tests

## Pre-Requisites

1. Populate [`src/utils/constants.ts`](src/utils/constants.ts) with necessary endpoints. Descripions of the outputs needed from each endpoint can be found in the [`Endpoints`](###Endpoints) section.

## Running the Repo

1. `yarn`: Install packages
2. `yarn build`: Build the Prism bundle

## Additional Info

### IDs

- `UKID`
  - Short for Unknown ID
  - First party ID assigned to a user when they visit a site with the Prism SDK for the first time.
- `CSID`
  - Short for Cross-Site ID
  - Third party ID assigned to a user that persists across all sites that include the Prism SDK in a given browser if third party cookies are enabled.

### Inbrain

- A recommendation engine that inserts promotional content in a banner carousel based on the user's information.

### Endpoints

- cdnOrigin
  - Accepts:
  - Returns:
- thirdPartyCookie
  - Accepts: GET requests
  - Returns: HTML file
- carouselScript
  - Accepts: GET requests
  - Returns: script for carousel swiper
- carouselStyles
  - Accepts: GET requests
  - Returns: CSS file for carousel styling
- locate
  - Accepts: GET requests
  - Returns: JSON object with location data matching the following structure:
    ```js
      {
        "asn": {
          "id": // string
          "name": // string
        },
        "continent": // string
        "continentName": // string
        "country": // string
        "country_alpha2": // string
        "country_alpha3": // string
        "ip_address": // string
        "lat": // Optional string
        "lon": // Optional string
        "proxy": // null or string
        "states": {
          "cities": // array of strings
          "counties": // array of strings
          "state": // string
          "zipcodes": // array of strings
        }
      }
    ```
- featureFlag
  - Accepts: GET requests
  - Returns: JSON object with Feature Flag values matching this structure:
    ```js
      [{
        "enabled": // Boolean
        "flagId": // String
        "flagName": // Optional string
        "updatedSinceLastQuery": // Optional boolean
        "userId": // Optional string
        "userIdType": // Optional string
      }]
    ```
- identity

  - Accepts: POST requests of JSON objects matching the following structure:

    ```js
      {
        "appId": "abcdefgh-ijkl-mnop-qrst-uvwxyz012345",
        "ukid": "abcdefgh-ijkl-mnop-qrst-uvwxyz012345", // Required
        "hhid": "abcdefgh-ijkl-mnop-qrst-uvwxyz012345",
        "inid": "abcdefgh-ijkl-mnop-qrst-uvwxyz012345",
        "brand": "example",
        "subBrand": "store",
        "domain": "example.org",
        "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:75.0) Gecko/20100101 Firefox/75.0",
        "platform": "web",
        "ip": "127.0.0.1",
        "city": "MARIETTA",
        "state": "GA",
        "zips": ["30066"],
        "country": "US",
        "library": {
          "name": "prism",
          "version": "1.0"
        },
        "cookies": {
          "portmeirion_id": "abcdefgh-ijkl-mnop-qrst-uvwxyz012345",
          "br_user_type": "Anonymous"
        },
        "ids": {
          // these are examples id's and not the definitive naming convention
          "kruxid": "123",
          "mid": "abc"
        },
        "session": {
          "sessionid": "000000000-00000000-00000000000-000001",
          "sessionDuration": 390820389423,
          "psmLastActiveTimestamp": "2021-03-17T20:01:45.525Z",
          "psmSessionStart": "2021-03-17T20:01:45.525Z",
          "isSessionStart": true,
          "previousSession": {
            "sessionid": "000000000-00000000-00000000000-000000",
            "sessionDuration": 390820389422,
            "psmLastActiveTimestamp": "2021-03-17T20:01:45.522Z",
            "psmSessionStart": "2021-03-17T20:01:45.522Z",
            "isSessionStart": false,
          }
        },
        "contentMetadata": {
          "page": {
            "section": "asdf",
            "author": "asdf"
          },
        },
        "hhidVersion": 8
      }
    ```

  - Returns: JSON object with optional warnings

- inbrain

  - Accepts: GET requests with added query parameters
  - Returns: one of the JSON responses:

    - Missing or unsupported content type

      - Unsupported media type with a 400 returned

    - Content size too small or too large
      - Invalid ContentLength with a 400 returned
    - Missing request body

      - Unable to read body with a 400 returned

    - Missing ukid or appid

      - missing required field with a 400 returned

    - Completed successfully
      - 201 returned with the following response structure:
      ```js
        {
            "domain": // String of the domain Prism is currently loaded on
            "html": // URI encoded string of the HTML for the Inbrain banner,
            "pages": // Array of page strings to insert the Inbrain promotion on, eg ["/"] for the homepage only,
            "placement": // String of
            "target": // String of HTML target the Inbrain banner is to be inserted after
        }
      ```

- idresolve
  - Accepts: POST requests of JSON objects matching the following structure:
    ```js
      ukid: // Required string
      ids: {
        csid: // Optional string
        convivaid: // Optional string
        ecid: // Optional string
        kruxid: // Optional string
      }
    ```
  - Returns: JSON object matching this structure:
    ```js
    {
      "hhid": // optional string
      "inid": // optional string
     "segs": // optional string
      "hhidVersion": // optional string
      "resolvedUserData": { [key: string]: any };
    }
    ```
- logs
  - Accepts: POST requests of JSON logging objects
  - Returns: N/A

## License

Copyright (c) Warner Media, LLC. All rights reserved. Licensed under the MIT license.
See the [LICENSE](./LICENSE) file for license information.

## CLA Assistant Change

Testing the CLA Assistant to make sure it is working.
