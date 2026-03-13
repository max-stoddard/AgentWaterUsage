export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-GB").format(Math.round(value));
}

export function formatCompactNumber(value: number): string {
  const absolute = Math.abs(value);
  const suffixes = [
    { threshold: 1_000_000_000, suffix: "B" },
    { threshold: 1_000_000, suffix: "M" },
    { threshold: 1_000, suffix: "K" }
  ];

  for (const { threshold, suffix } of suffixes) {
    if (absolute >= threshold) {
      const scaled = value / threshold;
      const rounded =
        Math.abs(scaled) >= 100 ? scaled.toFixed(0) : Math.abs(scaled) >= 10 ? scaled.toFixed(1) : scaled.toFixed(2);
      return `${Number(rounded).toLocaleString("en-GB", { maximumFractionDigits: 2 })}${suffix}`;
    }
  }

  return new Intl.NumberFormat("en-GB").format(Math.round(value));
}

export function formatLitres(value: number): string {
  if (value === 0) {
    return "0 L";
  }

  if (Math.abs(value) < 1) {
    return `${(value * 1000).toFixed(1)} mL`;
  }

  if (Math.abs(value) < 100) {
    return `${value.toFixed(2)} L`;
  }

  return `${new Intl.NumberFormat("en-GB", {
    maximumFractionDigits: 1
  }).format(value)} L`;
}

export function formatDateTime(value: number | null): string {
  if (!value) {
    return "Not indexed yet";
  }
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}
