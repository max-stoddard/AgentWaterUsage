import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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
          diagnostics: {
            state: "ready",
            codexHome: "/tmp/.codex",
            message: null
          },
          exclusions: [
            {
              provider: "ollama",
              model: "qwen3.5:9b",
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
              model: "gpt-5.3-codex",
              inputUsdPerMillion: 1.75,
              cachedInputUsdPerMillion: 0.175,
              outputUsdPerMillion: 14,
              docsUrl: "https://developers.openai.com/api/docs/models/gpt-5.3-codex"
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
            { label: "OpenAI API pricing", url: "https://openai.com/api/pricing/" }
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
        points: []
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
  it("loads the overview hub, keeps placeholder tabs lightweight, and defers water trend loading to the water tab", async () => {
    mockDashboardResponses();

    const { container } = render(<App />);
    const primaryNav = screen.getByRole("navigation", { name: "Primary" });

    expect(within(primaryNav).getByRole("link", { name: "Home" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByLabelText("Loading dashboard")).toBeInTheDocument();

    await screen.findByRole("heading", { name: /See your coding-agent usage at a glance/i });
    await waitFor(() => {
      expect(screen.getAllByText("1.20 L").length).toBeGreaterThan(0);
    });
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    expect(screen.queryByText(/What you can see today/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Estimated litres/i)).toBeInTheDocument();
    expect(screen.getByText(/Prompt insights/i)).toBeInTheDocument();
    expect(screen.getByText(/Energy estimates/i)).toBeInTheDocument();
    expect(screen.getByText(/CO2 estimates/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Open methodology/i })).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalledWith("/api/methodology");
    expect(screen.queryByText(/Water-weighted local estimate/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Track your water estimate/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Water usage by day/i)).not.toBeInTheDocument();
    expect(container.querySelectorAll('img[src="/agent.svg"]').length).toBeGreaterThan(0);
    expect(screen.getByText(/Copyright Max Stoddard 2026/i)).toBeInTheDocument();
    expect(screen.getByText(/Last indexed 9 Mar 2026/i)).toBeInTheDocument();

    fireEvent.click(within(primaryNav).getByRole("link", { name: "Prompts" }));
    expect(await screen.findByRole("heading", { name: /Prompt insights are coming next/i })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    fireEvent.click(within(primaryNav).getByRole("link", { name: "Energy" }));
    expect(await screen.findByRole("heading", { name: /Energy estimates are on the roadmap/i })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    fireEvent.click(within(primaryNav).getByRole("link", { name: "CO2" }));
    expect(await screen.findByRole("heading", { name: /CO2 estimates are on the roadmap/i })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    fireEvent.click(within(primaryNav).getByRole("link", { name: "Water" }));
    expect(await screen.findByRole("heading", { name: /Track your water estimate/i })).toBeInTheDocument();
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
    expect(screen.getByText(/Water usage by day/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /View exclusions and pricing/i })).toBeInTheDocument();

    const dayTab = screen.getByRole("tab", { name: "Day" });
    dayTab.focus();
    fireEvent.keyDown(dayTab, { key: "ArrowRight", code: "ArrowRight" });

    await waitFor(() => {
      expect(screen.getByRole("tab", { name: "Week" })).toHaveAttribute("aria-selected", "true");
    });
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("bucket=week"));
    });
    expect(screen.getByText(/Water usage by week/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Month" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("bucket=month"));
    });
    expect(await screen.findByText("No water estimate available for this bucket.")).toBeInTheDocument();

    fireEvent.click(within(primaryNav).getByRole("link", { name: "Methodology" }));
    expect(await screen.findByRole("heading", { name: /How local usage is turned into the current water estimate/i })).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: /How local usage becomes a water estimate/i })).toBeInTheDocument();
    expect(screen.getByText(/50 tokens excluded because unsupported provider/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /CACM DOI: Making AI Less 'Thirsty' \(Li, Yang, Islam, Ren\)/i })
    ).toHaveAttribute("href", "https://doi.org/10.1145/3724499");
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/methodology");
    });
    expect(fetchMock).toHaveBeenCalledTimes(5);

    fireEvent.click(within(primaryNav).getByRole("link", { name: "Home" }));
    expect(await screen.findByRole("heading", { name: /See your coding-agent usage at a glance/i })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(5);
  });

  it("does not fetch dashboard data until a data-backed view is active", async () => {
    mockDashboardResponses();
    window.location.hash = "#prompts";

    render(<App />);
    const primaryNav = screen.getByRole("navigation", { name: "Primary" });

    expect(screen.getByRole("heading", { name: /Prompt insights are coming next/i })).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();

    fireEvent.click(within(primaryNav).getByRole("link", { name: "Home" }));

    await screen.findByLabelText("Loading dashboard");
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
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
    expect(screen.queryByText(/agentic-insights --codex-home/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Water-weighted local estimate/i)).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
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
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
