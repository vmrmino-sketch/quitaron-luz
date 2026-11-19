export interface BarrioBase {
  id: 'solanda' | 'centro-historico' | 'la-carolina';
  grupoId: 'grupo-solanda' | 'grupo-centro' | 'grupo-carolina';
  nombre: string;
  sector: string;
  latitud: number;
  longitud: number;
  radioMetros: number;
  colorPastel: string;
  bordePastel: string;
}

export const BARRIOS_QUITO: BarrioBase[] = [
  {
    id: 'solanda',
    grupoId: 'grupo-solanda',
    nombre: 'Solanda',
    sector: 'Sur de Quito',
    latitud: -0.2756,
    longitud: -78.5425,
    radioMetros: 1300,
    colorPastel: '#D8F6EE',
    bordePastel: '#8CD8C4',
  },
  {
    id: 'centro-historico',
    grupoId: 'grupo-centro',
    nombre: 'Centro Histórico',
    sector: 'Centro de Quito',
    latitud: -0.2201,
    longitud: -78.5123,
    radioMetros: 1200,
    colorPastel: '#FFE8D6',
    bordePastel: '#F4BA8C',
  },
  {
    id: 'la-carolina',
    grupoId: 'grupo-carolina',
    nombre: 'La Carolina',
    sector: 'Norte de Quito',
    latitud: -0.1843,
    longitud: -78.4846,
    radioMetros: 1300,
    colorPastel: '#EAE2FF',
    bordePastel: '#B8A4F5',
  },
];