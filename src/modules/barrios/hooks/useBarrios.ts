import { useEffect, useState } from 'react';
import { supabase } from '@/core/config/supabase';
import { BARRIOS_QUITO, BarrioBase } from '@/core/constants/barrios.constants';

export function useBarrios() {
  const [barrios, setBarrios] = useState<BarrioBase[]>(BARRIOS_QUITO);
  const [barrioActivo, setBarrioActivo] = useState<BarrioBase>(BARRIOS_QUITO[0]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    let montado = true;
    async function cargarBarrios() {
      setCargando(true);
      const { data, error } = await supabase.from('barrios').select('*');
      if (!error && data && data.length > 0 && montado) {
        const mezclados = BARRIOS_QUITO.map((base) => {
          const remoto = data.find((d: any) => d.id === base.id);
          return remoto
            ? {
                ...base,
                nombre: remoto.nombre ?? base.nombre,
                sector: remoto.sector ?? base.sector,
                latitud: remoto.latitud ?? base.latitud,
                longitud: remoto.longitud ?? base.longitud,
                radioMetros: remoto.radio_metros ?? base.radioMetros,
              }
            : base;
        });
        setBarrios(mezclados);
      }
      if (montado) setCargando(false);
    }
    cargarBarrios();
    return () => {
      montado = false;
    };
  }, []);

  return {
    barrios,
    barrioActivo,
    seleccionarBarrio: setBarrioActivo,
    cargando,
  };
}