import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../src/App";

const fetchMock = vi.fn<typeof fetch>();

function mockDashboardResponses() {
  fetchMock.mockImplementation(async (input) => {
    const url = String(input);
    if (url.startsWith("/api/overview")) {
      return new Response(
        JSON.stringify({
          tokenTotals: {
            totalTokens: 1000,
            supportedTokens: 900,
            excludedTokens: 50,
            unestimatedTokens: 50
          },
          waterLitres: {
            low: 0.5,
            central: 1.2,
            high: 2.1
          },
          coverage: {
            supportedEvents: 9,
            excludedEvents: 1,
            tokenOnlyEvents: 1
          },
          coverageSummary: {
            sessions: 12,
            prompts: 47,
            excludedModels: 2
          },
          coverageDetails: [
            {
              provider: "openai",
              model: "gpt-5.4",
              source: "VS Code extension",
              tokens: 900,
              events: 9,
              classification: "supported",
              reason: null
            },
            {
              provider: "anthropic",
              model: "claude-sonnet-4-20250514",
              source: "Claude Code",
              tokens: 120,
              events: 3,
              classification: "supported",
              reason: null
            },
            {
              provider: "ollama",
              model: "qwen3.5:9b",
              source: "CLI",
              tokens: 50,
              events: 1,
              classification: "excluded",
              reason: "Unsupported provider: ollama"
            },
            {
              provider: "openai",
              model: "gpt-5.4",
              source: "CLI",
              tokens: 50,
              events: 1,
              classification: "token_only",
              reason: "Token totals are available, but token splits needed for pricing-weighted estimation are missing."
            }
          ],
          diagnostics: {
            state: "ready",
            codexHome: "/tmp/.codex",
            message: null
          },
          exclusions: [
            {
              provider: "ollama",
              model: "qwen3.5:9b",
              source: "CLI",
              tokens: 50,
              events: 1,
              reason: "Unsupported provider: ollama"
            }
          ],
          lastIndexedAt: Date.parse("2026-03-09T12:00:00.000Z"),
          calibration: {
            referenceEventCostUsd: 0.123,
            computedAt: Date.parse("2026-03-09T12:00:00.000Z"),
            supportedEventCount: 9,
            supportedMedianSource: "local_median_event_cost_usd"
          }
        }),
        { status: 200 }
      );
    }

    if (url.startsWith("/api/methodology")) {
      return new Response(
        JSON.stringify({
          pricingTable: [
            {
              provider: "openai",
              model: "gpt-5.2-codex",
              inputUsdPerMillion: 1.75,
              cachedInputUsdPerMillion: 0.175,
              outputUsdPerMillion: 14,
              docsUrl: "https://openai.com/api/pricing/"
            },
            {
              provider: "anthropic",
              model: "claude-sonnet-4",
              inputUsdPerMillion: 3,
              cachedInputUsdPerMillion: 0.3,
              outputUsdPerMillion: 15,
              docsUrl: "https://docs.anthropic.com/en/docs/about-claude/pricing"
            }
          ],
          benchmarkCoefficients: {
            low: 0.010585,
            central: 0.016904,
            high: 0.029926
          },
          calibration: {
            referenceEventCostUsd: 0.123,
            computedAt: Date.parse("2026-03-09T12:00:00.000Z"),
            supportedEventCount: 9,
            supportedMedianSource: "local_median_event_cost_usd"
          },
          exclusions: [],
          sourceLinks: [
            {
              label: "CACM DOI: Making AI Less 'Thirsty' (Li, Yang, Islam, Ren)",
              url: "https://doi.org/10.1145/3724499"
            },
            {
              label: "arXiv: Uncovering and Addressing the Secret Water Footprint of AI Models",
              url: "https://arxiv.org/abs/2304.03271"
            },
            { label: "OpenAI API pricing", url: "https://openai.com/api/pricing/" },
            { label: "Anthropic API pricing", url: "https://docs.anthropic.com/en/docs/about-claude/pricing" }
          ]
        }),
        { status: 200 }
      );
    }

    if (url.includes("bucket=day")) {
      return new Response(
        JSON.stringify({
          bucket: "day",
          points: [
            {
              startTs: Date.parse("2026-03-09T00:00:00.000Z"),
              key: "2026-03-09",
              label: "9 Mar 2026",
              tokens: 1000,
              excludedTokens: 50,
              unestimatedTokens: 50,
              waterLitres: {
                low: 0.5,
                central: 1.2,
                high: 2.1
              }
            }
          ]
        }),
        { status: 200 }
      );
    }

    if (url.includes("bucket=week")) {
      return new Response(
        JSON.stringify({
          bucket: "week",
          points: [
            {
              startTs: Date.parse("2026-03-09T00:00:00.000Z"),
              key: "2026-W11",
              label: "Week of 9 Mar 2026",
              tokens: 2000,
              excludedTokens: 100,
              unestimatedTokens: 100,
              waterLitres: {
                low: 1,
                central: 2.4,
                high: 4.2
              }
            }
          ]
        }),
        { status: 200 }
      );
    }

    return new Response(
      JSON.stringify({
        bucket: "month",
        points: [
          {
            startTs: Date.parse("2026-01-01T00:00:00.000Z"),
            key: "2026-01",
            label: "Jan 2026",
            tokens: 600,
            excludedTokens: 0,
            unestimatedTokens: 0,
            waterLitres: {
              low: 0.2,
              central: 0.6,
              high: 0.9
            }
          },
          {
            startTs: Date.parse("2026-02-01T00:00:00.000Z"),
            key: "2026-02",
            label: "Feb 2026",
            tokens: 0,
            excludedTokens: 0,
            unestimatedTokens: 0,
            waterLitres: {
              low: 0,
              central: 0,
              high: 0
            }
          },
          {
            startTs: Date.parse("2026-03-01T00:00:00.000Z"),
            key: "2026-03",
            label: "Mar 2026",
            tokens: 400,
            excludedTokens: 50,
            unestimatedTokens: 50,
            waterLitres: {
              low: 0.3,
              central: 0.6,
              high: 1.2
            }
          }
        ]
      }),
      { status: 200 }
    );
  });
}

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  window.location.hash = "";
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  fetchMock.mockReset();
  window.location.hash = "";
});

describe("App", () => {
  it("loads the single-page dashboard with hero metric, chart, coverage, and roadmap", async () => {
    mockDashboardResponses();

    const { container } = render(<App />);

    await waitFor(() => {
      expect(screen.getAllByText("1.20 L").length).toBeGreaterThan(0);
    });

    expect(screen.getByText(/Water used/i)).toBeInTheDocument();
    expect(screen.getByText(/Understand your agent/i)).toBeInTheDocument();
    expect(screen.getByText(/footprint locally\./i)).toBeInTheDocument();
    expect(screen.queryByText(/Local coding agent insights/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Between 500.0 mL and 2.10 L/i)).toBeInTheDocument();
    expect(screen.getByText(/Based on 9 supported usage events/i)).toBeInTheDocument();
    expect(screen.getByText(/90% coverage/i)).toBeInTheDocument();

    expect(screen.getByText(/Usage over time/i)).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Day" })).toHaveAttribute("aria-selected", "true");
    expect(await screen.findByTestId("water-chart")).toBeInTheDocument();

    const breakdownHeading = screen.getByText("Usage breakdown");
    const breakdownSection = breakdownHeading.closest("section");
    expect(breakdownSection).not.toBeNull();
    expect(screen.getByText("sessions")).toBeInTheDocument();
    expect(screen.getByText("prompts")).toBeInTheDocument();
    expect(breakdownSection).toHaveTextContent("tokens");

    expect(screen.getByText(/Prompt insights/i)).toBeInTheDocument();
    expect(screen.getByText(/Energy estimates/i)).toBeInTheDocument();
    expect(screen.getByText(/CO2 estimates/i)).toBeInTheDocument();

    expect(container.querySelectorAll('img[src="/agent.svg"]').length).toBeGreaterThan(0);
    expect(screen.getByText(/Copyright Max Stoddard 2026/i)).toBeInTheDocument();
    expect(screen.getByText(/Last indexed 9 Mar 2026/i)).toBeInTheDocument();
  });

  it("switches time bucket via the toggle and fetches new timeseries", async () => {
    mockDashboardResponses();

    const { container } = render(<App />);

    await waitFor(() => {
      expect(screen.getAllByText("1.20 L").length).toBeGreaterThan(0);
    });

    const dayTab = screen.getByRole("tab", { name: "Day" });
    dayTab.focus();
    fireEvent.keyDown(dayTab, { key: "ArrowRight", code: "ArrowRight" });

    await waitFor(() => {
      expect(screen.getByRole("tab", { name: "Week" })).toHaveAttribute("aria-selected", "true");
    });
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("bucket=week"));
    });

    fireEvent.click(screen.getByRole("tab", { name: "Month" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("bucket=month"));
    });
    await waitFor(() => {
      expect(container.querySelectorAll(".recharts-bar-rectangle").length).toBeGreaterThanOrEqual(3);
    });
  });

  it("shows tooltip details when a bucket bar is hovered", async () => {
    mockDashboardResponses();

    const { container } = render(<App />);

    const chart = await screen.findByTestId("water-chart");

    expect(chart).toBeInTheDocument();

    await waitFor(() => {
      expect(container.querySelector(".recharts-wrapper")).not.toBeNull();
    });

    const chartWrapper = container.querySelector(".recharts-wrapper");
    fireEvent.mouseMove(chartWrapper as Element, {
      clientX: 512,
      clientY: 140
    });

    expect(await screen.findByTestId("water-chart-tooltip")).toBeInTheDocument();
    expect(screen.getByText("9 Mar 2026")).toBeInTheDocument();
    expect(screen.getByText("1,000 tokens")).toBeInTheDocument();
  });

  it("opens the methodology drawer and shows pricing and sources", async () => {
    mockDashboardResponses();

    render(<App />);

    await waitFor(() => {
      expect(screen.getAllByText("1.20 L").length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getAllByRole("button", { name: /How it works/i })[0]!);

    expect(await screen.findByRole("dialog", { name: /How it works/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/methodology");
    });

    expect(await screen.findByRole("button", { name: "Prompts" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Water" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Energy" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Carbon" })).toBeInTheDocument();
    expect(screen.getByText(/Sessions are distinct Codex and Claude Code runs/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Energy" }));
    expect(screen.getByText(/Energy estimates are not live yet/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Carbon" }));
    expect(screen.getByText(/Carbon estimates are also still upcoming/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Water" }));

    expect(await screen.findByText(/gpt-5.2-codex/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /CACM DOI: Making AI Less 'Thirsty' \(Li, Yang, Islam, Ren\)/i })
    ).toHaveAttribute("href", "https://doi.org/10.1145/3724499");
  });

  it("shows per-model coverage details with sources in the expanded summary", async () => {
    mockDashboardResponses();

    render(<App />);

    await waitFor(() => {
      expect(screen.getAllByText("1.20 L").length).toBeGreaterThan(0);
    });

    expect(screen.getByText("Usage breakdown")).toBeInTheDocument();
    expect(screen.getByText("See how many prompts and sessions were counted, how many tokens are included in the estimate, and which model sources are driving the total.")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("47")).toBeInTheDocument();
    expect(screen.getByText("900")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Show all model sources/i }));

    expect(screen.getAllByText("openai / gpt-5.4")).toHaveLength(2);
    expect(screen.getByText("anthropic / claude-sonnet-4-20250514")).toBeInTheDocument();
    expect(screen.getByText("Claude Code · 120 tokens")).toBeInTheDocument();
    expect(screen.getByText("VS Code extension · 900 tokens")).toBeInTheDocument();
    expect(screen.getByText("CLI · 50 tokens — unsupported provider: ollama")).toBeInTheDocument();
    expect(
      screen.getByText(
        "CLI · 50 tokens — token totals are available, but token splits needed for pricing-weighted estimation are missing."
      )
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Show fewer sources/i })).toBeInTheDocument();
  });

  it("shows neutral onboarding guidance when no local usage history is available", async () => {
    fetchMock.mockImplementation(async (input) => {
      const url = String(input);
      if (url.startsWith("/api/overview")) {
        return new Response(
          JSON.stringify({
            tokenTotals: {
              totalTokens: 0,
              supportedTokens: 0,
              excludedTokens: 0,
              unestimatedTokens: 0
            },
            waterLitres: {
              low: 0,
              central: 0,
              high: 0
            },
            coverage: {
              supportedEvents: 0,
              excludedEvents: 0,
              tokenOnlyEvents: 0
            },
            coverageSummary: {
              sessions: 0,
              prompts: 0,
              excludedModels: 0
            },
            coverageDetails: [],
            diagnostics: {
              state: "no_data",
              codexHome: "/home/dev/.codex",
              message: "No Codex usage files were found in this directory yet."
            },
            exclusions: [],
            lastIndexedAt: null,
            calibration: null
          }),
          { status: 200 }
        );
      }

      throw new Error(`Unexpected request: ${url}`);
    });

    render(<App />);

    expect((await screen.findAllByText(/No local usage history detected/i)).length).toBeGreaterThan(0);
    expect(screen.getByText(/No readable local usage history was found at the current path yet/i)).toBeInTheDocument();
    expect(screen.getByText("No usage files were found in this directory yet.")).toBeInTheDocument();
    expect(screen.getByText("/home/dev/.codex")).toBeInTheDocument();
    expect(screen.getByText(/Prompt insights/i)).toBeInTheDocument();
  });

  it("shows a neutral read error when the current local path cannot be read", async () => {
    fetchMock.mockImplementation(async (input) => {
      const url = String(input);
      if (url.startsWith("/api/overview")) {
        return new Response(
          JSON.stringify({
            tokenTotals: {
              totalTokens: 0,
              supportedTokens: 0,
              excludedTokens: 0,
              unestimatedTokens: 0
            },
            waterLitres: {
              low: 0,
              central: 0,
              high: 0
            },
            coverage: {
              supportedEvents: 0,
              excludedEvents: 0,
              tokenOnlyEvents: 0
            },
            coverageSummary: {
              sessions: 0,
              prompts: 0,
              excludedModels: 0
            },
            coverageDetails: [],
            diagnostics: {
              state: "read_error",
              codexHome: "/bad/path/.codex",
              message: "Configured Codex home does not exist."
            },
            exclusions: [],
            lastIndexedAt: null,
            calibration: null
          }),
          { status: 200 }
        );
      }

      throw new Error(`Unexpected request: ${url}`);
    });

    render(<App />);

    expect((await screen.findAllByText(/Could not read local usage data/i)).length).toBeGreaterThan(0);
    expect(screen.getByText(/The dashboard could not read the current local usage path/i)).toBeInTheDocument();
    expect(screen.getByText("Configured data path does not exist.")).toBeInTheDocument();
  });
});
