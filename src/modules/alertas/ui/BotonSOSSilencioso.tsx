import * as Device from 'expo-device';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from 'react-native';
import { supabase } from '@/core/config/supabase';
import { BarrioBase } from '@/core/constants/barrios.constants';
import { PastelColors } from '@/shared/theme/pastelColors';

export interface AlertaSOSItem {
  id: string;
  barrio_id: string;
  dispositivo_id: string;
  autor: string;
  avatar_emoji: string;
  motivo: string;
  latitud: number;
  longitud: number;
  estado: 'activo' | 'a_salvo';
  apoyos_vecinos: number;
  created_at: string;
}

const MOTIVOS_CUIDADO = [
  { id: 'caminando tarde a casa', emoji: '🚶', etiqueta: 'camino a casa' },
  { id: 'actividad sospechosa', emoji: '👀', etiqueta: 'algo sospechoso' },
  { id: 'necesito acompañamiento', emoji: '🤝', etiqueta: 'acompañamiento' },
];

export function BotonSOSSilencioso({
  barrioActivo,
}: {
  barrioActivo: BarrioBase;
}) {
  const [alertasActivas, setAlertasActivas] = useState<AlertaSOSItem[]>([]);
  const [motivoSeleccionado, setMotivoSeleccionado] = useState(MOTIVOS_CUIDADO[0].id);
  const [enviando, setEnviando] = useState(false);

  const dispositivoId = Device.deviceName || 'Movil-UIO';
  const pulsoAnim = useRef(new Animated.Value(1)).current;

  const cargarAlertasSOS = useCallback(async () => {
    const hace2Horas = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('alertas_sos_sector')
      .select('*')
      .eq('barrio_id', barrioActivo.id)
      .eq('estado', 'activo')
      .gte('created_at', hace2Horas)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setAlertasActivas(data as AlertaSOSItem[]);
    }
  }, [barrioActivo.id]);

  useEffect(() => {
    cargarAlertasSOS();

    const canal = supabase
      .channel(`sos-cuidado-${barrioActivo.id}-${Math.random().toString(36).slice(2, 6)}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'alertas_sos_sector',
          filter: `barrio_id=eq.${barrioActivo.id}`,
        },
        () => cargarAlertasSOS()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [barrioActivo.id, cargarAlertasSOS]);

  useEffect(() => {
    if (alertasActivas.length === 0) {
      pulsoAnim.setValue(1);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulsoAnim, {
          toValue: 1.03,
          duration: 650,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulsoAnim, {
          toValue: 1,
          duration: 650,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [alertasActivas.length, pulsoAnim]);

  const activarSOSSilencioso = async () => {
    if (enviando) return;
    setEnviando(true);

    Vibration.vibrate([0, 120, 80, 120]);

    const lat = barrioActivo.latitud;
    const lng = barrioActivo.longitud;

    const { data: perfil } = await supabase
      .from('fichas_vecinales')
      .select('alias_vecino, avatar_emoji')
      .eq('dispositivo_id', dispositivoId)
      .eq('barrio_id', barrioActivo.id)
      .maybeSingle();

    const autorFinal =
      perfil?.alias_vecino || `vecino ${dispositivoId.slice(0, 10).toLowerCase()}`;
    const avatarFinal = perfil?.avatar_emoji || '🦊';

    const { error } = await supabase.from('alertas_sos_sector').insert({
      barrio_id: barrioActivo.id,
      dispositivo_id: dispositivoId,
      autor: autorFinal,
      avatar_emoji: avatarFinal,
      motivo: motivoSeleccionado,
      latitud: lat,
      longitud: lng,
      estado: 'activo',
    });

    if (!error) {
      await supabase.from('comentarios_reportes').insert({
        reporte_id: null,
        barrio_id: barrioActivo.id,
        etiqueta_sector: 'alerta',
        dispositivo_id: dispositivoId,
        autor: autorFinal,
        contenido: `[EMOJI:ojo] 🛡️ Red de cuidado activa (${motivoSeleccionado}) en ${barrioActivo.nombre} (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      });

      await cargarAlertasSOS();
    } else {
      Alert.alert('No se pudo enviar', error.message);
    }

    setEnviando(false);
  };

  const marcarASalvo = async (id: string) => {
    Vibration.vibrate(90);
    await supabase
      .from('alertas_sos_sector')
      .update({ estado: 'a_salvo' })
      .eq('id', id);
    await cargarAlertasSOS();
  };

  const enviarApoyoVecinal = async (alerta: AlertaSOSItem) => {
    Vibration.vibrate(60);
    await supabase
      .from('alertas_sos_sector')
      .update({ apoyos_vecinos: (alerta.apoyos_vecinos || 0) + 1 })
      .eq('id', alerta.id);
    await cargarAlertasSOS();
  };

  return (
    <View style={styles.contenedor3D}>
      <View style={styles.filaHeader}>
        <View style={styles.tituloRow}>
          <Text style={styles.iconoEscudo}>🛡️</Text>
          <View>
            <Text style={styles.titulo}>Red de Cuidado y SOS Silencioso</Text>
            <Text style={styles.subtitulo}>
              Mantén presionado 1.2s para avisar a vecinos del sector
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.filaMotivos}>
        {MOTIVOS_CUIDADO.map((m) => {
          const activo = m.id === motivoSeleccionado;
          return (
            <TouchableOpacity
              key={m.id}
              activeOpacity={0.85}
              onPress={() => setMotivoSeleccionado(m.id)}
              style={[
                styles.chipMotivo,
                activo && styles.chipMotivoActivo,
              ]}
            >
              <Text style={styles.chipMotivoTexto}>
                {m.emoji} {m.etiqueta}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        activeOpacity={0.85}
        delayLongPress={1200}
        onLongPress={activarSOSSilencioso}
        onPress={() =>
          Alert.alert(
            '🛡️ Activación Discreta',
            'Mantén presionado el botón durante 1.2 segundos para enviar una alerta silenciosa a los vecinos de tu sector.'
          )
        }
        disabled={enviando}
        style={[styles.btnSOS3D, enviando && { opacity: 0.6 }]}
      >
        <Text style={styles.btnSOSTexto}>
          {enviando
            ? '📡 Enviando alerta discreta...'
            : '🤫 Mantén presionado: SOS Silencioso'}
        </Text>
      </TouchableOpacity>

      {alertasActivas.length > 0 && (
        <Animated.View
          style={[styles.listaActivas, { transform: [{ scale: pulsoAnim }] }]}
        >
          {alertasActivas.map((alerta) => {
            const esMia = alerta.dispositivo_id === dispositivoId;
            return (
              <View key={alerta.id} style={styles.tarjetaSOSActiva}>
                <View style={styles.filaTopSOS}>
                  <Text style={styles.autorSOS}>
                    {alerta.avatar_emoji || '🦊'} {alerta.autor.toLowerCase()}
                  </Text>
                  <Text style={styles.coordSOS}>
                    📍 {Number(alerta.latitud).toFixed(4)}, {Number(alerta.longitud).toFixed(4)}
                  </Text>
                </View>

                <Text style={styles.motivoSOS}>
                  🚨 Motivo: {alerta.motivo}
                </Text>

                {esMia ? (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => marcarASalvo(alerta.id)}
                    style={styles.btnASalvo3D}
                  >
                    <Text style={styles.btnASalvoTexto}>✅ Ya llegué bien (Desactivar)</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => enviarApoyoVecinal(alerta)}
                    style={styles.btnApoyarSOS3D}
                  >
                    <Text style={styles.btnApoyarSOSTexto}>
                      👀 Estoy pendiente ({alerta.apoyos_vecinos} vecinos)
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor3D: {
    backgroundColor: '#FFF5F7',
    borderColor: '#E598A3',
    borderWidth: 1.5,
    borderBottomWidth: 4.5,
    borderRadius: 22,
    padding: 14,
    gap: 11,
  },
  filaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tituloRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  iconoEscudo: { fontSize: 22 },
  titulo: { fontSize: 13.5, fontWeight: '900', color: '#5E2129' },
  subtitulo: { fontSize: 11, fontWeight: '700', color: '#8A4A54' },
  filaMotivos: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  chipMotivo: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E8B7BF',
    borderWidth: 1.2,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  chipMotivoActivo: {
    backgroundColor: '#FFD6DC',
    borderColor: '#D96B7C',
  },
  chipMotivoTexto: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#5E2129',
    textTransform: 'lowercase',
  },
  btnSOS3D: {
    backgroundColor: '#FFD6DC',
    borderColor: '#D96B7C',
    borderWidth: 1.6,
    borderBottomWidth: 4,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  btnSOSTexto: { fontSize: 13, fontWeight: '900', color: '#5E2129' },
  listaActivas: { gap: 10, marginTop: 2 },
  tarjetaSOSActiva: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D96B7C',
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 12,
    gap: 8,
  },
  filaTopSOS: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  autorSOS: {
    fontSize: 12.5,
    fontWeight: '900',
    color: PastelColors.textoPrincipal,
    textTransform: 'lowercase',
  },
  coordSOS: { fontSize: 10.5, fontWeight: '800', color: PastelColors.textoSecundario },
  motivoSOS: { fontSize: 12.5, fontWeight: '800', color: '#5E2129' },
  btnASalvo3D: {
    backgroundColor: PastelColors.menta,
    borderColor: PastelColors.mentaBorde,
    borderWidth: 1.5,
    borderBottomWidth: 3,
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  btnASalvoTexto: { fontSize: 12, fontWeight: '900', color: PastelColors.textoPrincipal },
  btnApoyarSOS3D: {
    backgroundColor: '#FFF3CD',
    borderColor: '#F5C96B',
    borderWidth: 1.5,
    borderBottomWidth: 3,
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  btnApoyarSOSTexto: { fontSize: 12, fontWeight: '900', color: PastelColors.textoPrincipal },
});