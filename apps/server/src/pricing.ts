import type { PricingEntry, WaterRange } from "@agentic-insights/shared";

export const BENCHMARK_COEFFICIENTS: WaterRange = {
  low: 0.010585,
  central: 0.016904,
  high: 0.029926
};

const OPENAI_PRICING_URL = "https://openai.com/api/pricing/";
const OPENAI_MODELS_URL = "https://platform.openai.com/docs/models";
const ANTHROPIC_PRICING_URL = "https://docs.anthropic.com/en/docs/about-claude/pricing";
const ANTHROPIC_MODELS_URL = "https://docs.anthropic.com/en/docs/about-claude/models/all-models";

function entry(
  provider: string,
  model: string,
  inputUsdPerMillion: number,
  cachedInputUsdPerMillion: number,
  outputUsdPerMillion: number,
  docsUrl: string
): PricingEntry {
  return {
    provider,
    model,
    inputUsdPerMillion,
    cachedInputUsdPerMillion,
    outputUsdPerMillion,
    docsUrl
  };
}

function normalizeProvider(provider: string): string {
  const normalized = provider.trim().toLowerCase();
  return normalized === "claude" ? "anthropic" : normalized;
}

function buildPricingRegistry() {
  const canonicalEntries: PricingEntry[] = [
    entry("openai", "gpt-5.4", 2.5, 0.25, 15, OPENAI_PRICING_URL),
    entry("openai", "gpt-5.2", 1.75, 0.175, 14, OPENAI_PRICING_URL),
    entry("openai", "gpt-5.1", 1.25, 0.125, 10, OPENAI_PRICING_URL),
    entry("openai", "gpt-5", 1.25, 0.125, 10, OPENAI_PRICING_URL),
    entry("openai", "gpt-5-mini", 0.25, 0.025, 2, OPENAI_PRICING_URL),
    entry("openai", "gpt-5-nano", 0.05, 0.005, 0.4, OPENAI_PRICING_URL),
    entry("openai", "gpt-5.2-chat-latest", 1.75, 0.175, 14, OPENAI_PRICING_URL),
    entry("openai", "gpt-5.1-chat-latest", 1.25, 0.125, 10, OPENAI_PRICING_URL),
    entry("openai", "gpt-5-chat-latest", 1.25, 0.125, 10, OPENAI_PRICING_URL),
    entry("openai", "gpt-5.2-codex", 1.75, 0.175, 14, OPENAI_PRICING_URL),
    entry("openai", "gpt-5.1-codex", 1.25, 0.125, 10, OPENAI_PRICING_URL),
    entry("openai", "gpt-5.1-codex-max", 1.25, 0.125, 10, OPENAI_PRICING_URL),
    entry("openai", "gpt-5-codex", 1.25, 0.125, 10, OPENAI_PRICING_URL),
    entry("openai", "gpt-5.2-pro", 21, 0, 168, OPENAI_PRICING_URL),
    entry("openai", "gpt-5-pro", 15, 0, 120, OPENAI_PRICING_URL),
    entry("openai", "gpt-4.1", 2, 0.5, 8, OPENAI_PRICING_URL),
    entry("openai", "gpt-4.1-mini", 0.4, 0.1, 1.6, OPENAI_PRICING_URL),
    entry("openai", "gpt-4.1-nano", 0.1, 0.025, 0.4, OPENAI_PRICING_URL),
    entry("openai", "gpt-4o", 2.5, 1.25, 10, OPENAI_PRICING_URL),
    entry("openai", "gpt-4o-2024-05-13", 5, 0, 15, OPENAI_PRICING_URL),
    entry("openai", "gpt-4o-mini", 0.15, 0.075, 0.6, OPENAI_PRICING_URL),
    entry("anthropic", "claude-opus-4-1", 15, 1.5, 75, ANTHROPIC_PRICING_URL),
    entry("anthropic", "claude-opus-4", 15, 1.5, 75, ANTHROPIC_PRICING_URL),
    entry("anthropic", "claude-sonnet-4-6", 3, 0.3, 15, ANTHROPIC_MODELS_URL),
    entry("anthropic", "claude-sonnet-4", 3, 0.3, 15, ANTHROPIC_PRICING_URL),
    entry("anthropic", "claude-3-7-sonnet-latest", 3, 0.3, 15, ANTHROPIC_PRICING_URL),
    entry("anthropic", "claude-3-5-sonnet-latest", 3, 0.3, 15, ANTHROPIC_PRICING_URL),
    entry("anthropic", "claude-haiku-4-5", 1, 0.1, 5, ANTHROPIC_MODELS_URL),
    entry("anthropic", "claude-3-5-haiku-latest", 0.8, 0.08, 4, ANTHROPIC_PRICING_URL),
    entry("anthropic", "claude-3-haiku-20240307", 0.25, 0.03, 1.25, ANTHROPIC_PRICING_URL),
    entry("anthropic", "claude-3-opus-20240229", 15, 1.5, 75, ANTHROPIC_PRICING_URL)
  ];

  const aliases = new Map<string, PricingEntry>();
  const register = (pricing: PricingEntry, aliasModels: string[] = [], aliasProviders: string[] = []) => {
    const providers = [pricing.provider, ...aliasProviders].map((provider) => normalizeProvider(provider));
    const models = [pricing.model, ...aliasModels].map((model) => model.trim().toLowerCase());
    for (const provider of providers) {
      for (const model of models) {
        aliases.set(`${provider}:${model}`, pricing);
      }
    }
  };

  for (const pricing of canonicalEntries) {
    register(pricing);
  }

  register(
    canonicalEntries.find((pricing) => pricing.provider === "openai" && pricing.model === "gpt-5-mini")!,
    ["gpt-5.1-codex-mini"]
  );
  register(
    canonicalEntries.find((pricing) => pricing.provider === "openai" && pricing.model === "gpt-5.2-codex")!,
    ["gpt-5.3-codex"]
  );
  register(
    canonicalEntries.find((pricing) => pricing.provider === "openai" && pricing.model === "gpt-5.1-codex")!,
    ["gpt-5.1-codex-max-old"]
  );
  register(
    canonicalEntries.find((pricing) => pricing.provider === "anthropic" && pricing.model === "claude-opus-4-1")!,
    ["claude-opus-4-1-20250805"],
    ["claude"]
  );
  register(
    canonicalEntries.find((pricing) => pricing.provider === "anthropic" && pricing.model === "claude-opus-4")!,
    ["claude-opus-4-20250514"],
    ["claude"]
  );
  register(
    canonicalEntries.find((pricing) => pricing.provider === "anthropic" && pricing.model === "claude-sonnet-4-6")!,
    ["claude-sonnet-4.6", "claude-sonnet-4-6-latest"],
    ["claude"]
  );
  register(
    canonicalEntries.find((pricing) => pricing.provider === "anthropic" && pricing.model === "claude-sonnet-4")!,
    ["claude-sonnet-4-20250514"],
    ["claude"]
  );
  register(
    canonicalEntries.find((pricing) => pricing.provider === "anthropic" && pricing.model === "claude-3-7-sonnet-latest")!,
    ["claude-3-7-sonnet-20250219", "claude-sonnet-3.7"],
    ["claude"]
  );
  register(
    canonicalEntries.find((pricing) => pricing.provider === "anthropic" && pricing.model === "claude-3-5-sonnet-latest")!,
    ["claude-3-5-sonnet-20241022", "claude-sonnet-3.5"],
    ["claude"]
  );
  register(
    canonicalEntries.find((pricing) => pricing.provider === "anthropic" && pricing.model === "claude-haiku-4-5")!,
    ["claude-haiku-4.5", "claude-haiku-4-5-latest"],
    ["claude"]
  );
  register(
    canonicalEntries.find((pricing) => pricing.provider === "anthropic" && pricing.model === "claude-3-5-haiku-latest")!,
    ["claude-3-5-haiku-20241022", "claude-haiku-3.5"],
    ["claude"]
  );
  register(
    canonicalEntries.find((pricing) => pricing.provider === "anthropic" && pricing.model === "claude-3-haiku-20240307")!,
    ["claude-3-haiku-latest", "claude-haiku-3"],
    ["claude"]
  );
  register(
    canonicalEntries.find((pricing) => pricing.provider === "anthropic" && pricing.model === "claude-3-opus-20240229")!,
    ["claude-3-opus-latest", "claude-opus-3"],
    ["claude"]
  );

  return {
    canonicalEntries,
    aliases
  };
}

const registry = buildPricingRegistry();

export const PRICING_TABLE: PricingEntry[] = registry.canonicalEntries;

export function getPricingEntry(provider: string, model: string): PricingEntry | null {
  const normalizedProvider = normalizeProvider(provider);
  const normalizedModel = model.trim().toLowerCase();
  return registry.aliases.get(`${normalizedProvider}:${normalizedModel}`) ?? null;
}

export function calculateEventCostUsd(
  pricing: PricingEntry,
  inputTokens: number,
  cachedInputTokens: number,
  outputTokens: number
): number {
  return (
    (inputTokens / 1_000_000) * pricing.inputUsdPerMillion +
    (cachedInputTokens / 1_000_000) * pricing.cachedInputUsdPerMillion +
    (outputTokens / 1_000_000) * pricing.outputUsdPerMillion
  );
}

export function getMethodologySourceLinks(): Array<{ label: string; url: string }> {
  return [
    {
      label: "CACM DOI: Making AI Less 'Thirsty' (Li, Yang, Islam, Ren)",
      url: "https://doi.org/10.1145/3724499"
    },
    {
      label: "arXiv: Uncovering and Addressing the Secret Water Footprint of AI Models",
      url: "https://arxiv.org/abs/2304.03271"
    },
    { label: "OpenAI API pricing", url: OPENAI_PRICING_URL },
    { label: "OpenAI model docs", url: OPENAI_MODELS_URL },
    { label: "Anthropic API pricing", url: ANTHROPIC_PRICING_URL },
    { label: "Anthropic model docs", url: ANTHROPIC_MODELS_URL }
  ];
}
