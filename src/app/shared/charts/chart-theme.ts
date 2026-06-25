import { ChartOptions } from 'chart.js';

export const CHART_CSS_VARS = {
  textPrimary: '--color-text-primary',
  accentPrimary: '--color-accent-primary',
  accentSecondary: '--color-accent-secondary',
  backgroundSecondary: '--color-background-secondary',
} as const;

export function getCssVariable(variable: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
}

export function getChartTextColor(): string {
  return getCssVariable(CHART_CSS_VARS.textPrimary);
}

export function getChartFont(size = 12, family = 'Arial') {
  return { size, family };
}

export function getChartTicks(options?: { color?: string; size?: number; family?: string }) {
  return {
    color: options?.color ?? getChartTextColor(),
    font: getChartFont(options?.size, options?.family),
  };
}

export function getChartLegend(color?: string) {
  const textColor = color ?? getChartTextColor();

  return {
    display: true as const,
    position: 'top' as const,
    labels: {
      color: textColor,
      font: getChartFont(),
    },
  };
}

export function getChartPlugins(color?: string) {
  return {
    legend: getChartLegend(color),
    tooltip: { enabled: true },
  };
}

export function getChartScaleTitle(text: string, color?: string) {
  const textColor = color ?? getChartTextColor();

  return {
    display: true as const,
    text,
    color: textColor,
    font: getChartFont(),
  };
}

export function getChartBaseOptions(): Pick<ChartOptions, 'responsive' | 'maintainAspectRatio'> {
  return {
    responsive: true,
    maintainAspectRatio: false,
  };
}

export function getAccentPrimaryColor(): string {
  return getCssVariable(CHART_CSS_VARS.accentPrimary);
}

export function getAccentSecondaryColor(): string {
  return getCssVariable(CHART_CSS_VARS.accentSecondary);
}

export function getBackgroundSecondaryColor(): string {
  return getCssVariable(CHART_CSS_VARS.backgroundSecondary);
}
