import * as Device from 'expo-device';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/core/config/supabase';
import { BARRIOS_QUITO, BarrioBase } from '@/core/constants/barrios.constants';

export interface RankingBarrioItem {
  barrioId: string;
  nombre: string;
  totalFichas: number;
  vecinosActivos: number;
}

const AVATARES_JUGADOR = ['🦊', '🐱', '🐼', '🐨', '🦁', '🐸', '🦉', '🦄'];

export function useFichasVecinales(barrioActivo: BarrioBase) {
  const [misFichas, setMisFichas] = useState<number>(0);
  const [rankingBarrios, setRankingBarrios] = useState<RankingBarrioItem[]>([]);
  const [guardando, setGuardando] = useState(false);

  const dispositivoId = Device.deviceName || 'Movil-UIO';
  const avatarJugador =
    AVATARES_JUGADOR[
      dispositivoId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) %
        AVATARES_JUGADOR.length
    ];

  const cargarDatos = useCallback(async () => {
    const { data, error } = await supabase.from('fichas_vecinales').select('*');

    if (!error && data) {
      let fichasMias = 0;
      const mapaBarrios: Record<string, { total: number; vecinos: Set<string> }> = {};

      for (const b of BARRIOS_QUITO) {
        mapaBarrios[b.id] = { total: 0, vecinos: new Set() };
      }

      for (const fila of data) {
        if (fila.dispositivo_id === dispositivoId && fila.barrio_id === barrioActivo.id) {
          fichasMias += fila.fichas || 0;
        }
        if (mapaBarrios[fila.barrio_id]) {
          mapaBarrios[fila.barrio_id].total += fila.fichas || 0;
          mapaBarrios[fila.barrio_id].vecinos.add(fila.dispositivo_id);
        }
      }

      setMisFichas(fichasMias);

      const listaOrdenada: RankingBarrioItem[] = BARRIOS_QUITO.map((b) => ({
        barrioId: b.id,
        nombre: b.nombre,
        totalFichas: mapaBarrios[b.id]?.total || 0,
        vecinosActivos: mapaBarrios[b.id]?.vecinos.size || 0,
      })).sort((a, b) => b.totalFichas - a.totalFichas);

      setRankingBarrios(listaOrdenada);
    }
  }, [barrioActivo.id, dispositivoId]);

  useEffect(() => {
    cargarDatos();

    const canal = supabase
      .channel(`fichas-live-${Math.random().toString(36).slice(2, 6)}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'fichas_vecinales' },
        () => cargarDatos()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [cargarDatos]);

  const sumarFichas = async (cantidad: number) => {
    if (cantidad <= 0) return;
    setGuardando(true);
    const nuevoTotal = misFichas + cantidad;
    setMisFichas(nuevoTotal);

    await supabase.from('fichas_vecinales').upsert(
      {
        dispositivo_id: dispositivoId,
        barrio_id: barrioActivo.id,
        alias_vecino: `vecino ${dispositivoId.slice(0, 10).toLowerCase()}`,
        avatar_emoji: avatarJugador,
        fichas: nuevoTotal,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'dispositivo_id,barrio_id' }
    );

    await cargarDatos();
    setGuardando(false);
  };

  return {
    misFichas,
    avatarJugador,
    rankingBarrios,
    guardando,
    sumarFichas,
  };
}