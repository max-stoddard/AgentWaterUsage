import type { PricingCatalogMetadata, PricingEntry } from "@agentic-insights/shared";

const PORTKEY_PRICE_SCALE = 10_000;

interface PortkeyPriceNode {
  price?: number;
}

interface PortkeyPayAsYouGoPricing {
  request_token?: PortkeyPriceNode;
  request_text_token?: PortkeyPriceNode;
  cache_read_input_token?: PortkeyPriceNode;
  cache_read_text_input_token?: PortkeyPriceNode;
  response_token?: PortkeyPriceNode;
  response_text_token?: PortkeyPriceNode;
}

interface PortkeyPricingConfig {
  pay_as_you_go?: PortkeyPayAsYouGoPricing;
}

export interface PortkeyPricingFile {
  [model: string]: {
    pricing_config?: PortkeyPricingConfig;
  };
}

export interface PortkeyPricingFileIndexEntry {
  name: string;
  path: string;
  download_url: string | null;
  type: "file" | "dir";
}

export interface GeneratedPricingProviderSource {
  provider: string;
  fileName: string;
  sourceUrl: string;
  sourceLabel: string;
}

export interface GeneratedPricingCatalog {
  metadata: PricingCatalogMetadata;
  providerSources: GeneratedPricingProviderSource[];
  entries: PricingEntry[];
}

function dollarsPerTokenToPerMillion(value: number): number {
  return Number((value * PORTKEY_PRICE_SCALE).toFixed(6));
}

function getPrice(value: PortkeyPriceNode | undefined): number {
  return typeof value?.price === "number" && Number.isFinite(value.price) ? value.price : 0;
}

function getProviderFromFileName(fileName: string): string {
  return fileName.replace(/\.json$/i, "").trim().toLowerCase();
}

function toPricingEntry(
  provider: string,
  model: string,
  sourceUrl: string,
  sourceLabel: string,
  pricingConfig: PortkeyPricingConfig | undefined
): PricingEntry | null {
  const payAsYouGo = pricingConfig?.pay_as_you_go;
  if (!payAsYouGo || model === "default") {
    return null;
  }

  const inputPrice = getPrice(payAsYouGo.request_text_token ?? payAsYouGo.request_token);
  const cachedInputPrice = getPrice(payAsYouGo.cache_read_text_input_token ?? payAsYouGo.cache_read_input_token);
  const outputPrice = getPrice(payAsYouGo.response_text_token ?? payAsYouGo.response_token);
  const hasTextTokenPricing =
    "request_text_token" in payAsYouGo ||
    "request_token" in payAsYouGo ||
    "response_text_token" in payAsYouGo ||
    "response_token" in payAsYouGo;

  if (!hasTextTokenPricing) {
    return null;
  }

  return {
    provider,
    model,
    inputUsdPerMillion: dollarsPerTokenToPerMillion(inputPrice),
    cachedInputUsdPerMillion: dollarsPerTokenToPerMillion(cachedInputPrice),
    outputUsdPerMillion: dollarsPerTokenToPerMillion(outputPrice),
    sourceUrl,
    sourceLabel
  };
}

export function transformPortkeyPricingCatalog(
  indexEntries: PortkeyPricingFileIndexEntry[],
  files: Map<string, PortkeyPricingFile>,
  generatedAt: string
): GeneratedPricingCatalog {
  const providerSources: GeneratedPricingProviderSource[] = [];
  const entries: PricingEntry[] = [];

  for (const indexEntry of indexEntries) {
    if (indexEntry.type !== "file" || !indexEntry.download_url || !indexEntry.name.endsWith(".json")) {
      continue;
    }

    const file = files.get(indexEntry.name);
    if (!file) {
      continue;
    }

    const provider = getProviderFromFileName(indexEntry.name);
    const sourceLabel = `Portkey pricing: ${indexEntry.name}`;
    providerSources.push({
      provider,
      fileName: indexEntry.name,
      sourceUrl: indexEntry.download_url,
      sourceLabel
    });

    for (const [model, config] of Object.entries(file)) {
      const entry = toPricingEntry(provider, model, indexEntry.download_url, sourceLabel, config.pricing_config);
      if (entry) {
        entries.push(entry);
      }
    }
  }

  entries.sort((left, right) => {
    if (left.provider !== right.provider) {
      return left.provider.localeCompare(right.provider);
    }

    return left.model.localeCompare(right.model);
  });

  providerSources.sort((left, right) => left.provider.localeCompare(right.provider));

  return {
    metadata: {
      generatedAt,
      sourceRepoUrl: "https://github.com/Portkey-AI/models",
      sourceDirectoryUrl: "https://github.com/Portkey-AI/models/tree/main/pricing",
      licenseUrl: "https://raw.githubusercontent.com/Portkey-AI/models/main/LICENSE",
      providerCount: providerSources.length,
      modelCount: entries.length
    },
    providerSources,
    entries
  };
}
