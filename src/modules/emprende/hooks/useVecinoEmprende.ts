import * as Device from 'expo-device';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/core/config/supabase';
import { BarrioBase } from '@/core/constants/barrios.constants';

export type CategoriaEmprende = 'comida' | 'servicio' | 'mascota' | 'trueque';

export interface CategoriaEmprendeConfig {
  id: CategoriaEmprende;
  etiqueta: string;
  emoji: string;
  fondo: string;
  borde: string;
}

export const CATEGORIAS_EMPRENDE: Record<CategoriaEmprende, CategoriaEmprendeConfig> = {
  comida: {
    id: 'comida',
    etiqueta: 'comida / tienda',
    emoji: '🍲',
    fondo: '#FFE8D6',
    borde: '#F4BA8C',
  },
  servicio: {
    id: 'servicio',
    etiqueta: 'oficio / técnico',
    emoji: '🛠️',
    fondo: '#DCEEFF',
    borde: '#8BBDF5',
  },
  mascota: {
    id: 'mascota',
    etiqueta: 'mascota / ayuda',
    emoji: '🐾',
    fondo: '#FFD6DC',
    borde: '#E58A98',
  },
  trueque: {
    id: 'trueque',
    etiqueta: 'trueque / venta',
    emoji: '🤝',
    fondo: '#D8F6EE',
    borde: '#6FD1B8',
  },
};

export const LISTA_CATEGORIAS_EMPRENDE = Object.values(CATEGORIAS_EMPRENDE);

export interface AvisoEmprendeItem {
  id: string;
  barrio_id: string;
  dispositivo_id: string;
  autor: string;
  avatar_emoji: string;
  categoria: CategoriaEmprende;
  titulo: string;
  detalle: string;
  contacto: string;
  created_at: string;
}

export function useVecinoEmprende(barrioActivo: BarrioBase) {
  const [avisos, setAvisos] = useState<AvisoEmprendeItem[]>([]);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);

  const dispositivoId = Device.deviceName || 'Movil-UIO';

  const cargarAvisos = useCallback(async () => {
    setCargando(true);
    const { data, error } = await supabase
      .from('avisos_emprende')
      .select('*')
      .eq('barrio_id', barrioActivo.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setAvisos(data as AvisoEmprendeItem[]);
    }
    setCargando(false);
  }, [barrioActivo.id]);

  useEffect(() => {
    cargarAvisos();

    const canal = supabase
      .channel(`emprende-live-${barrioActivo.id}-${Math.random().toString(36).slice(2, 6)}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'avisos_emprende', filter: `barrio_id=eq.${barrioActivo.id}` },
        () => cargarAvisos()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [barrioActivo.id, cargarAvisos]);

  const publicarAviso = async (params: {
    categoria: CategoriaEmprende;
    titulo: string;
    detalle: string;
    contacto: string;
  }) => {
    setProcesando(true);

    const { data: perfil } = await supabase
      .from('fichas_vecinales')
      .select('alias_vecino, avatar_emoji, fichas')
      .eq('dispositivo_id', dispositivoId)
      .eq('barrio_id', barrioActivo.id)
      .maybeSingle();

    const autorFinal =
      perfil?.alias_vecino || `vecino ${dispositivoId.slice(0, 10).toLowerCase()}`;
    const avatarFinal = perfil?.avatar_emoji || '🦊';

    const { error } = await supabase.from('avisos_emprende').insert({
      barrio_id: barrioActivo.id,
      dispositivo_id: dispositivoId,
      autor: autorFinal,
      avatar_emoji: avatarFinal,
      categoria: params.categoria,
      titulo: params.titulo.trim(),
      detalle: params.detalle.trim(),
      contacto: params.contacto.trim(),
    });

    if (!error) {
      await supabase.from('fichas_vecinales').upsert(
        {
          dispositivo_id: dispositivoId,
          barrio_id: barrioActivo.id,
          alias_vecino: autorFinal,
          avatar_emoji: avatarFinal,
          fichas: (perfil?.fichas || 0) + 3,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'dispositivo_id,barrio_id' }
      );
      await cargarAvisos();
    }

    setProcesando(false);
    return { error };
  };

  const eliminarAviso = async (id: string) => {
    await supabase.from('avisos_emprende').delete().eq('id', id);
    await cargarAvisos();
  };

  return {
    avisos,
    cargando,
    procesando,
    dispositivoId,
    publicarAviso,
    eliminarAviso,
  };
}