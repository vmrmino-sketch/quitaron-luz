import * as Device from 'expo-device';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/core/config/supabase';
import { BarrioBase } from '@/core/constants/barrios.constants';

export type CategoriaEvento = 'minga' | 'futbol' | 'feria' | 'mascotas' | 'cultura';

export interface CategoriaEventoConfig {
  id: CategoriaEvento;
  etiqueta: string;
  emoji: string;
  fondo: string;
  borde: string;
}

export const CATEGORIAS_EVENTO: Record<CategoriaEvento, CategoriaEventoConfig> = {
  minga: {
    id: 'minga',
    etiqueta: 'minga vecinal',
    emoji: '🧹',
    fondo: '#D8F6EE',
    borde: '#6FD1B8',
  },
  futbol: {
    id: 'futbol',
    etiqueta: 'fútbol barrial',
    emoji: '⚽',
    fondo: '#FFF3CD',
    borde: '#F5C96B',
  },
  feria: {
    id: 'feria',
    etiqueta: 'feria local',
    emoji: '🛍️',
    fondo: '#FFE8D6',
    borde: '#F4BA8C',
  },
  mascotas: {
    id: 'mascotas',
    etiqueta: 'paseo mascotas',
    emoji: '🐾',
    fondo: '#FFD6DC',
    borde: '#E58A98',
  },
  cultura: {
    id: 'cultura',
    etiqueta: 'cultura / música',
    emoji: '🎶',
    fondo: '#EAE2FF',
    borde: '#9F86EC',
  },
};

export const LISTA_CATEGORIAS_EVENTO = Object.values(CATEGORIAS_EVENTO);

export interface EventoBarrioItem {
  id: string;
  barrio_id: string;
  dispositivo_id: string;
  organizador: string;
  categoria: CategoriaEvento;
  titulo: string;
  lugar: string;
  fecha_hora: string;
  created_at: string;
  totalAsistentes: number;
  yoAsisto: boolean;
}

export function useEventosBarrio(barrioActivo: BarrioBase) {
  const [eventos, setEventos] = useState<EventoBarrioItem[]>([]);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);

  const dispositivoId = Device.deviceName || 'Movil-UIO';

  const cargarEventos = useCallback(async () => {
    setCargando(true);

    const { data: listaEventos, error } = await supabase
      .from('eventos_barrio')
      .select('*')
      .eq('barrio_id', barrioActivo.id)
      .order('created_at', { ascending: false });

    const { data: listaAsistentes } = await supabase
      .from('asistentes_eventos')
      .select('evento_id, dispositivo_id');

    if (!error && listaEventos) {
      const mapeados: EventoBarrioItem[] = listaEventos.map((ev: any) => {
        const asistentesEv = (listaAsistentes || []).filter(
          (a: any) => a.evento_id === ev.id
        );
        return {
          ...ev,
          totalAsistentes: asistentesEv.length,
          yoAsisto: asistentesEv.some((a: any) => a.dispositivo_id === dispositivoId),
        };
      });

      setEventos(mapeados);
    }

    setCargando(false);
  }, [barrioActivo.id, dispositivoId]);

  useEffect(() => {
    cargarEventos();

    const canal = supabase
      .channel(`eventos-live-${barrioActivo.id}-${Math.random().toString(36).slice(2, 6)}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'eventos_barrio' },
        () => cargarEventos()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'asistentes_eventos' },
        () => cargarEventos()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [barrioActivo.id, cargarEventos]);

  const acreditarFichas = async (puntos: number) => {
    const { data: perfil } = await supabase
      .from('fichas_vecinales')
      .select('fichas, alias_vecino, avatar_emoji')
      .eq('dispositivo_id', dispositivoId)
      .eq('barrio_id', barrioActivo.id)
      .maybeSingle();

    const nuevoTotal = (perfil?.fichas || 0) + puntos;

    await supabase.from('fichas_vecinales').upsert(
      {
        dispositivo_id: dispositivoId,
        barrio_id: barrioActivo.id,
        alias_vecino:
          perfil?.alias_vecino || `vecino ${dispositivoId.slice(0, 10).toLowerCase()}`,
        avatar_emoji: perfil?.avatar_emoji || '🦊',
        fichas: nuevoTotal,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'dispositivo_id,barrio_id' }
    );
  };

  const crearEvento = async (params: {
    categoria: CategoriaEvento;
    titulo: string;
    lugar: string;
    fechaHora: string;
  }) => {
    setProcesando(true);

    const { data: perfil } = await supabase
      .from('fichas_vecinales')
      .select('alias_vecino')
      .eq('dispositivo_id', dispositivoId)
      .limit(1)
      .maybeSingle();

    const nombreOrg =
      perfil?.alias_vecino || `vecino ${dispositivoId.slice(0, 10).toLowerCase()}`;

    const { data, error } = await supabase
      .from('eventos_barrio')
      .insert({
        barrio_id: barrioActivo.id,
        dispositivo_id: dispositivoId,
        organizador: nombreOrg,
        categoria: params.categoria,
        titulo: params.titulo.trim(),
        lugar: params.lugar.trim(),
        fecha_hora: params.fechaHora.trim(),
      })
      .select()
      .single();

    if (!error && data) {
      // Auto-confirmar asistencia del organizador y dar +3 fichas
      await supabase.from('asistentes_eventos').insert({
        evento_id: data.id,
        dispositivo_id: dispositivoId,
      });
      await acreditarFichas(3);
    }

    await cargarEventos();
    setProcesando(false);
    return { error };
  };

  const alternarAsistencia = async (evento: EventoBarrioItem) => {
    if (evento.yoAsisto) {
      await supabase
        .from('asistentes_eventos')
        .delete()
        .eq('evento_id', evento.id)
        .eq('dispositivo_id', dispositivoId);
    } else {
      await supabase.from('asistentes_eventos').insert({
        evento_id: evento.id,
        dispositivo_id: dispositivoId,
      });
      await acreditarFichas(2);
    }
    await cargarEventos();
  };

  const eliminarEvento = async (id: string) => {
    await supabase.from('eventos_barrio').delete().eq('id', id);
    await cargarEventos();
  };

  return {
    eventos,
    cargando,
    procesando,
    dispositivoId,
    crearEvento,
    alternarAsistencia,
    eliminarEvento,
  };
}