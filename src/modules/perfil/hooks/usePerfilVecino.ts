import * as Device from 'expo-device';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/core/config/supabase';
import { BarrioBase } from '@/core/constants/barrios.constants';

export interface MedallaVecinal {
  id: string;
  titulo: string;
  descripcion: string;
  emoji: string;
  fondo: string;
  borde: string;
  desbloqueada: boolean;
  progresoTexto: string;
}

export const AVATARES_DISPONIBLES = [
  { emoji: '🦊', nombre: 'zorro ágil' },
  { emoji: '🐱', nombre: 'gato curioso' },
  { emoji: '🐼', nombre: 'panda tranquilo' },
  { emoji: '🐨', nombre: 'koala atento' },
  { emoji: '🦁', nombre: 'león guardián' },
  { emoji: '🐸', nombre: 'rana exploradora' },
  { emoji: '🦉', nombre: 'búho vigía' },
  { emoji: '🦄', nombre: 'unicornio estelar' },
  { emoji: '🐯', nombre: 'tigre veloz' },
  { emoji: '🐧', nombre: 'pingüino andino' },
];

export const COLORES_ESFERA = [
  { id: 'lavanda', nombre: 'lavanda', fondo: '#EAE2FF', borde: '#9F86EC' },
  { id: 'durazno', nombre: 'durazno', fondo: '#FFE8D6', borde: '#F4BA8C' },
  { id: 'menta', nombre: 'menta', fondo: '#D8F6EE', borde: '#6FD1B8' },
  { id: 'cielo', nombre: 'cielo', fondo: '#DCEEFF', borde: '#8BBDF5' },
  { id: 'rosa', nombre: 'rosa', fondo: '#FFD6DC', borde: '#E58A98' },
];

export function usePerfilVecino(barrioActivo: BarrioBase) {
  const dispositivoId = Device.deviceName || 'Movil-UIO';
  const aliasPorDefecto = `vecino ${dispositivoId.slice(0, 10).toLowerCase()}`;

  const [alias, setAlias] = useState<string>(aliasPorDefecto);
  const [avatarEmoji, setAvatarEmoji] = useState<string>('🦊');
  const [colorId, setColorId] = useState<string>('lavanda');
  const [fichasBarrio, setFichasBarrio] = useState<number>(0);
  const [totalFichasGlobal, setTotalFichasGlobal] = useState<number>(0);
  const [totalComentarios, setTotalComentarios] = useState<number>(0);
  const [cargando, setCargando] = useState<boolean>(true);
  const [guardando, setGuardando] = useState<boolean>(false);

  const cargarPerfil = useCallback(async () => {
    setCargando(true);

    const { data: filasFichas } = await supabase
      .from('fichas_vecinales')
      .select('*')
      .eq('dispositivo_id', dispositivoId);

    if (filasFichas && filasFichas.length > 0) {
      let sumaGlobal = 0;
      let sumaSector = 0;

      for (const fila of filasFichas) {
        sumaGlobal += fila.fichas || 0;
        if (fila.barrio_id === barrioActivo.id) {
          sumaSector = fila.fichas || 0;
        }
      }

      const registroReciente = filasFichas[0];
      if (registroReciente.alias_vecino) setAlias(registroReciente.alias_vecino);
      if (registroReciente.avatar_emoji) setAvatarEmoji(registroReciente.avatar_emoji);
      setTotalFichasGlobal(sumaGlobal);
      setFichasBarrio(sumaSector);

      // Ajustar color sugerido según nivel alcanzado
      if (sumaGlobal >= 40) setColorId('menta');
      else if (sumaGlobal >= 15) setColorId('durazno');
      else setColorId('lavanda');
    } else {
      setFichasBarrio(0);
    }

    const { count } = await supabase
      .from('comentarios_reportes')
      .select('*', { count: 'exact', head: true })
      .eq('dispositivo_id', dispositivoId);

    setTotalComentarios(count || 0);
    setCargando(false);
  }, [barrioActivo.id, dispositivoId]);

  useEffect(() => {
    cargarPerfil();
  }, [cargarPerfil]);

  const guardarPerfil = async (nuevoAlias: string, nuevoAvatar: string) => {
    const limpio = nuevoAlias.trim() || aliasPorDefecto;
    setGuardando(true);
    setAlias(limpio);
    setAvatarEmoji(nuevoAvatar);

    const { error } = await supabase.from('fichas_vecinales').upsert(
      {
        dispositivo_id: dispositivoId,
        barrio_id: barrioActivo.id,
        alias_vecino: limpio.toLowerCase(),
        avatar_emoji: nuevoAvatar,
        fichas: fichasBarrio,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'dispositivo_id,barrio_id' }
    );

    await supabase
      .from('fichas_vecinales')
      .update({
        alias_vecino: limpio.toLowerCase(),
        avatar_emoji: nuevoAvatar,
      })
      .eq('dispositivo_id', dispositivoId);

    await cargarPerfil();
    setGuardando(false);
    return { error };
  };

  const medallas: MedallaVecinal[] = [
    {
      id: 'vecino_nuevo',
      titulo: 'nivel 1: vecino nuevo (lavanda)',
      descripcion: 'Primeros pasos reportando y ayudando en tu sector',
      emoji: '🌱',
      fondo: '#EAE2FF',
      borde: '#9F86EC',
      desbloqueada: true,
      progresoTexto: 'activo',
    },
    {
      id: 'vigia_sector',
      titulo: 'nivel 2: vigía del sector (durazno)',
      descripcion: 'Alcanza 15 puntos verificando y resolviendo alertas',
      emoji: '🔭',
      fondo: '#FFE8D6',
      borde: '#F4BA8C',
      desbloqueada: totalFichasGlobal >= 15,
      progresoTexto: `${Math.min(totalFichasGlobal, 15)}/15 🪙`,
    },
    {
      id: 'guardian_quito',
      titulo: 'nivel 3: guardián de quito (menta)',
      descripcion: 'Supera 40 puntos como referente confiable del barrio',
      emoji: '🛡️',
      fondo: '#D8F6EE',
      borde: '#6FD1B8',
      desbloqueada: totalFichasGlobal >= 40,
      progresoTexto: `${Math.min(totalFichasGlobal, 40)}/40 🪙`,
    },
    {
      id: 'voz_barrio',
      titulo: 'voz activa del muro 3d',
      descripcion: 'Participa comentando o reaccionando en comunidad',
      emoji: '💬',
      fondo: '#DCEEFF',
      borde: '#8BBDF5',
      desbloqueada: totalComentarios >= 1,
      progresoTexto: `${Math.min(totalComentarios, 1)}/1 notas`,
    },
  ];

  return {
    alias,
    setAlias,
    avatarEmoji,
    setAvatarEmoji,
    colorId,
    setColorId,
    fichasBarrio,
    totalFichasGlobal,
    totalComentarios,
    medallas,
    cargando,
    guardando,
    guardarPerfil,
  };
}