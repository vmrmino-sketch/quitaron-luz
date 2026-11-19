import * as Device from 'expo-device';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/core/config/supabase';
import { BarrioBase } from '@/core/constants/barrios.constants';

export interface MensajeBarrio {
  id: string;
  barrio_id: string;
  autor: string;
  contenido: string;
  created_at: string;
}

export function useChatBarrio(barrioActivo: BarrioBase) {
  const [mensajes, setMensajes] = useState<MensajeBarrio[]>([]);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);

  const cargarMensajes = useCallback(async () => {
    setCargando(true);
    const { data, error } = await supabase
      .from('mensajes_barrio')
      .select('*')
      .eq('barrio_id', barrioActivo.id) // Aislamiento estricto: solo este barrio
      .order('created_at', { ascending: true });

    if (!error && data) {
      setMensajes(data as MensajeBarrio[]);
    }
    setCargando(false);
  }, [barrioActivo.id]);

  useEffect(() => {
    setMensajes([]); // Limpia vista al cambiar de barrio
    cargarMensajes();

    const canal = supabase
      .channel(`chat-barrio-${barrioActivo.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mensajes_barrio',
          filter: `barrio_id=eq.${barrioActivo.id}`, // Solo escucha mensajes de este barrio
        },
        (payload) => {
          const nuevo = payload.new as MensajeBarrio;
          setMensajes((prev) =>
            prev.some((m) => m.id === nuevo.id) ? prev : [...prev, nuevo]
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [barrioActivo.id, cargarMensajes]);

  const enviarMensaje = async (texto: string) => {
    const limpio = texto.trim();
    if (!limpio) return { error: null };

    setEnviando(true);
    const autor = Device.deviceName || 'Vecino UIO';

    const { data, error } = await supabase
      .from('mensajes_barrio')
      .insert({
        barrio_id: barrioActivo.id,
        autor,
        contenido: limpio,
      })
      .select()
      .single();

    if (!error && data) {
      const insertado = data as MensajeBarrio;
      setMensajes((prev) =>
        prev.some((m) => m.id === insertado.id) ? prev : [...prev, insertado]
      );
    }

    setEnviando(false);
    return { error };
  };

  return { mensajes, cargando, enviando, enviarMensaje };
}