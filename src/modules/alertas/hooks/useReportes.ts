import * as Device from 'expo-device';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/core/config/supabase';
import { BarrioBase } from '@/core/constants/barrios.constants';

export type TipoReporte = 'luz' | 'agua' | 'via';

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
  created_at: string;
}

export function useReportes(barrio?: BarrioBase) {
  const [reportes, setReportes] = useState<ReporteAlerta[]>([]);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);

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

  const reportarOConfirmar = async (params: {
    barrio: BarrioBase;
    tipo: TipoReporte;
    titulo: string;
    descripcion: string;
    latitud?: number;
    longitud?: number;
  }) => {
    setProcesando(true);
    const dispositivo = Device.deviceName || 'Movil-UIO';
    const lat = params.latitud ?? params.barrio.latitud;
    const lon = params.longitud ?? params.barrio.longitud;

    const { data, error } = await supabase.rpc('registrar_o_confirmar_reporte', {
      p_barrio_id: params.barrio.id,
      p_tipo: params.tipo,
      p_titulo: params.titulo,
      p_descripcion: params.descripcion,
      p_lat: lat,
      p_lon: lon,
      p_dispositivo_id: dispositivo,
    });

    await cargarReportes();
    setProcesando(false);
    return { data: data as ReporteAlerta | null, error };
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
    recargar: cargarReportes,
    reportarOConfirmar,
    eliminarReporte,
  };
}