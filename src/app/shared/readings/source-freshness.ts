const dateTimeFormatter = new Intl.DateTimeFormat('es-AR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const monthYearFormatter = new Intl.DateTimeFormat('es-AR', {
  month: 'long',
  year: 'numeric',
});

/** Fecha-hora de cotización (p. ej. blue). */
export function formatSourceDateTime(iso: string): string | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return dateTimeFormatter.format(date);
}

/** Período del índice (p. ej. IPC). */
export function formatSourceMonthYear(iso: string): string | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  const label = monthYearFormatter.format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Une partes de frescura con el prefijo del parte. */
export function formatDatosMeta(parts: Array<string | null | undefined>): string | null {
  const clean = parts.filter((part): part is string => !!part && part.trim().length > 0);
  if (clean.length === 0) {
    return null;
  }
  return `Datos: ${clean.join(' · ')}`;
}

export const TNA_NO_TIMESTAMP = 'TNA sin timestamp de API';
export const APY_NO_TIMESTAMP = 'APY sin timestamp de API';
