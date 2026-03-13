import { describe, expect, it } from "vitest";
import { transformPortkeyPricingCatalog } from "../src/pricing-catalog-transform.js";

describe("Portkey pricing catalog transform", () => {
  it("transforms provider files into deterministic per-million pricing entries", () => {
    const catalog = transformPortkeyPricingCatalog(
      [
        {
          name: "anthropic.json",
          path: "pricing/anthropic.json",
          download_url: "https://raw.githubusercontent.com/Portkey-AI/models/main/pricing/anthropic.json",
          type: "file"
        }
      ],
      new Map([
        [
          "anthropic.json",
          {
            default: {
              pricing_config: {
                pay_as_you_go: {
                  request_token: { price: 0 },
                  response_token: { price: 0 }
                }
              }
            },
            "claude-sonnet-4-5": {
              pricing_config: {
                pay_as_you_go: {
                  request_token: { price: 0.0003 },
                  response_token: { price: 0.0015 },
                  cache_read_input_token: { price: 0.00003 }
                }
              }
            },
            "image-only-model": {
              pricing_config: {
                pay_as_you_go: {}
              }
            }
          }
        ]
      ]),
      "2026-03-13T12:00:00.000Z"
    );

    expect(catalog.metadata).toEqual({
      generatedAt: "2026-03-13T12:00:00.000Z",
      sourceRepoUrl: "https://github.com/Portkey-AI/models",
      sourceDirectoryUrl: "https://github.com/Portkey-AI/models/tree/main/pricing",
      licenseUrl: "https://raw.githubusercontent.com/Portkey-AI/models/main/LICENSE",
      providerCount: 1,
      modelCount: 1
    });
    expect(catalog.providerSources).toEqual([
      {
        provider: "anthropic",
        fileName: "anthropic.json",
        sourceUrl: "https://raw.githubusercontent.com/Portkey-AI/models/main/pricing/anthropic.json",
        sourceLabel: "Portkey pricing: anthropic.json"
      }
    ]);
    expect(catalog.entries).toEqual([
      {
        provider: "anthropic",
        model: "claude-sonnet-4-5",
        inputUsdPerMillion: 3,
        cachedInputUsdPerMillion: 0.3,
        outputUsdPerMillion: 15,
        sourceUrl: "https://raw.githubusercontent.com/Portkey-AI/models/main/pricing/anthropic.json",
        sourceLabel: "Portkey pricing: anthropic.json"
      }
    ]);
  });
});
