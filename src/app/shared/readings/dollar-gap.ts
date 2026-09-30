/** Brecha blue vs oficial sobre el oficial: (blue − oficial) / oficial. */
export function blueOficialSpreadPct(blueVenta: number, oficialVenta: number): number {
  if (oficialVenta <= 0) {
    return 0;
  }
  return ((blueVenta - oficialVenta) / oficialVenta) * 100;
}

/** Cierre educativo de la brecha (mismo lenguaje que el strip del home). */
export function dollarGapVerdict(spreadPct: number): string {
  const spreadLabel = spreadPct.toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  if (spreadPct >= 50) {
    return `Brecha amplia: el blue cotiza ~${spreadLabel}% sobre el oficial.`;
  }
  if (spreadPct >= 25) {
    return `Brecha moderada: blue ~${spreadLabel}% por encima del oficial.`;
  }
  if (spreadPct >= 5) {
    return `Brecha acotada: blue y oficial están más cerca (~${spreadLabel}%).`;
  }
  if (spreadPct > -5) {
    return `Blue y oficial casi alineados (~${spreadLabel}% de diferencia).`;
  }
  return `Lectura rara: el blue quedó por debajo del oficial (~${spreadLabel}%).`;
}
