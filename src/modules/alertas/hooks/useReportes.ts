import * as Device from 'expo-device';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/core/config/supabase';
import { BarrioBase } from '@/core/constants/barrios.constants';
import { TipoReporte } from '../constants/categoriasAlerta';

export interface ReporteAlerta {
  id: string;
  barrio_id: string;
  tipo: TipoReporte;
  titulo: string;
  descripcion: string;
  latitud: number;
  longitud: number;
  confirmaciones: number;
  umbral_consenso: number;
  estado: 'pendiente' | 'verificado';
  votos_solucion?: number;
  dispositivos_solucion?: string[];
  resuelto_at?: string | null;
  media_url?: string | null;
  media_type?: 'image' | 'video' | null;
  created_at: string;
}

const AVATARES_VECINO = ['🦊', '🐱', '🐼', '🐨', '🦁', '🐸', '🦉', '🦄'];

export function calcularDuracionTexto(inicioIso: string, finIso?: string | null): string | null {
  if (!finIso) return null;
  const inicio = new Date(inicioIso).getTime();
  const fin = new Date(finIso).getTime();
  const diffMin = Math.max(1, Math.round((fin - inicio) / 60000));
  if (diffMin < 60) return `${diffMin} min`;
  const horas = Math.floor(diffMin / 60);
  const mins = diffMin % 60;
  return mins > 0 ? `${horas}h ${mins}m` : `${horas}h`;
}

export function useReportes(barrio?: BarrioBase) {
  const [reportes, setReportes] = useState<ReporteAlerta[]>([]);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);

  const dispositivoId = Device.deviceName || 'Movil-UIO';

  const cargarReportes = useCallback(async () => {
    setCargando(true);
    let query = supabase
      .from('reportes')
      .select('*')
      .order('created_at', { ascending: false });

    if (barrio) {
      query = query.eq('barrio_id', barrio.id);
    }

    const { data, error } = await query;
    if (!error && data) {
      setReportes(data as ReporteAlerta[]);
    }
    setCargando(false);
  }, [barrio]);

  useEffect(() => {
    cargarReportes();

    const nombreCanal = `reportes-${barrio?.id ?? 'todos'}-${Math.random().toString(36).slice(2, 7)}`;
    const canal = supabase
      .channel(nombreCanal)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reportes' },
        () => {
          cargarReportes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [barrio?.id, cargarReportes]);

  const acreditarFichasPorAccion = async (barrioId: string, puntos: number) => {
    const avatar =
      AVATARES_VECINO[
        dispositivoId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % AVATARES_VECINO.length
      ];

    const { data: actual } = await supabase
      .from('fichas_vecinales')
      .select('fichas, alias_vecino, avatar_emoji')
      .eq('dispositivo_id', dispositivoId)
      .eq('barrio_id', barrioId)
      .maybeSingle();

    const nuevoTotal = (actual?.fichas || 0) + puntos;

    await supabase.from('fichas_vecinales').upsert(
      {
        dispositivo_id: dispositivoId,
        barrio_id: barrioId,
        alias_vecino: actual?.alias_vecino || `vecino ${dispositivoId.slice(0, 10).toLowerCase()}`,
        avatar_emoji: actual?.avatar_emoji || avatar,
        fichas: nuevoTotal,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'dispositivo_id,barrio_id' }
    );
  };

  const reportarOConfirmar = async (params: {
    barrio: BarrioBase;
    tipo: TipoReporte;
    titulo: string;
    descripcion: string;
    latitud?: number;
    longitud?: number;
    media_url?: string | null;
    media_type?: 'image' | 'video' | null;
  }) => {
    setProcesando(true);
    const lat = params.latitud ?? params.barrio.latitud;
    const lon = params.longitud ?? params.barrio.longitud;

    const { data, error } = await supabase.rpc('registrar_o_confirmar_reporte', {
      p_barrio_id: params.barrio.id,
      p_tipo: params.tipo,
      p_titulo: params.titulo,
      p_descripcion: params.descripcion,
      p_lat: lat,
      p_lon: lon,
      p_dispositivo_id: dispositivoId,
    });

    if (!error && data) {
      if (params.media_url) {
        const reporteCreado = Array.isArray(data) ? data[0] : data;
        if (reporteCreado?.id) {
          await supabase
            .from('reportes')
            .update({
              media_url: params.media_url,
              media_type: params.media_type ?? 'image',
            })
            .eq('id', reporteCreado.id);
        }
      }
      await acreditarFichasPorAccion(params.barrio.id, 5);
    }

    await cargarReportes();
    setProcesando(false);
    return { data: data as ReporteAlerta | null, error };
  };

  const votarSolucionado = async (reporte: ReporteAlerta) => {
    setProcesando(true);
    const { data, error } = await supabase.rpc('votar_solucion_reporte', {
      p_reporte_id: reporte.id,
      p_dispositivo_id: dispositivoId,
    });

    if (!error) {
      await acreditarFichasPorAccion(reporte.barrio_id, 3);
      await cargarReportes();
    }
    setProcesando(false);
    return { data, error };
  };

  const eliminarReporte = async (id: string) => {
    setProcesando(true);
    const { error } = await supabase.from('reportes').delete().eq('id', id);

    if (!error) {
      setReportes((prev) => prev.filter((item) => item.id !== id));
    }

    setProcesando(false);
    return { error };
  };

  return {
    reportes,
    cargando,
    procesando,
    dispositivoId,
    recargar: cargarReportes,
    reportarOConfirmar,
    votarSolucionado,
    eliminarReporte,
  };
}