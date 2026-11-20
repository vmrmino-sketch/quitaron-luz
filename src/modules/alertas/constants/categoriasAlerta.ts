export type TipoReporte =
  | 'luz'
  | 'agua'
  | 'fuga'
  | 'bache'
  | 'via'
  | 'fuego'
  | 'choque'
  | 'tormenta'
  | 'robo'
  | 'basura'
  | 'mascota';

export interface CategoriaConfig {
  id: TipoReporte;
  etiqueta: string;
  emoji: string;
  fondoPastel: string;
  bordePastel: string;
}

export const CATEGORIAS_ALERTA: Record<TipoReporte, CategoriaConfig> = {
  luz: {
    id: 'luz',
    etiqueta: 'Quitaron la Luz',
    emoji: '💡',
    fondoPastel: '#FFF3CD',
    bordePastel: '#F5C96B',
  },
  agua: {
    id: 'agua',
    etiqueta: 'Quitaron el Agua',
    emoji: '🚰',
    fondoPastel: '#DCEEFF',
    bordePastel: '#8BBDF5',
  },
  fuga: {
    id: 'fuga',
    etiqueta: 'Fuga de Agua',
    emoji: '💦',
    fondoPastel: '#D8F6EE',
    bordePastel: '#6FD1B8',
  },
  bache: {
    id: 'bache',
    etiqueta: 'Bache en la Calle',
    emoji: '🕳️',
    fondoPastel: '#F3E8DC',
    bordePastel: '#CFA882',
  },
  via: {
    id: 'via',
    etiqueta: 'Vía Cerrada / Obra',
    emoji: '🚧',
    fondoPastel: '#FFE8D6',
    bordePastel: '#F4BA8C',
  },
  fuego: {
    id: 'fuego',
    etiqueta: 'Incendio / Fuego',
    emoji: '🔥',
    fondoPastel: '#FFD6DC',
    bordePastel: '#E58A98',
  },
  choque: {
    id: 'choque',
    etiqueta: 'Choque / Tránsito',
    emoji: '🚗',
    fondoPastel: '#FBE4FF',
    bordePastel: '#D79CE3',
  },
  tormenta: {
    id: 'tormenta',
    etiqueta: 'Tormenta / Inundación',
    emoji: '⛈️',
    fondoPastel: '#E3E9FF',
    bordePastel: '#9BAEF5',
  },
  robo: {
    id: 'robo',
    etiqueta: 'Alerta de Seguridad',
    emoji: '🚨',
    fondoPastel: '#FFE0E9',
    bordePastel: '#EB8CA8',
  },
  basura: {
    id: 'basura',
    etiqueta: 'Acumulación Basura',
    emoji: '🗑️',
    fondoPastel: '#EBF5DF',
    bordePastel: '#9BC472',
  },
  mascota: {
    id: 'mascota',
    etiqueta: 'Mascota Perdida',
    emoji: '🐾',
    fondoPastel: '#FFF0F5',
    bordePastel: '#E6A1B8',
  },
};

export const LISTA_CATEGORIAS = Object.values(CATEGORIAS_ALERTA);