export interface Rendimiento {
  moneda: string;
  apy: number;
}

export interface Performance {
  entidad: string;
  rendimientos: Rendimiento[];
}
