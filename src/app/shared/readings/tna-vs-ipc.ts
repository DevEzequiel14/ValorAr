/** Anualiza un IPC mensual compuesto: (1 + r)^12 − 1. */
export function annualizeMonthlyPct(monthlyPct: number): number {
  return (Math.pow(1 + monthlyPct / 100, 12) - 1) * 100;
}

/** Glosa bajo KPIs de IPC anualizado (mismo método en features). */
export const IPC_ANUALIZADO_GLOSS =
  'Compuesto del último IPC a escala anual · no es la inflación acumulada del año';

/** Cierre educativo TNA vs IPC anualizado (mismo lenguaje que el strip del home). */
export function tnaVsIpcVerdict(tna: number, ipcAnualizado: number): string {
  const gap = tna - ipcAnualizado;
  if (gap >= 3) {
    return 'La TNA tope de la muestra cubre el IPC anualizado (aprox.).';
  }
  if (gap >= -1.5) {
    return 'TNA tope de la muestra e IPC anualizado quedan a la par.';
  }
  return 'La TNA tope de la muestra no alcanza al IPC anualizado (aprox.).';
}

/** Cierre educativo APY vs IPC anualizado (eco del parte en Rendimientos). */
export function apyVsIpcVerdict(apy: number, ipcAnualizado: number): string {
  const gap = apy - ipcAnualizado;
  if (gap >= 3) {
    return 'El APY tope de la muestra cubre el IPC anualizado (aprox.).';
  }
  if (gap >= -1.5) {
    return 'APY tope de la muestra e IPC anualizado quedan a la par.';
  }
  return 'El APY tope de la muestra no alcanza al IPC anualizado (aprox.).';
}
