import * as Device from 'expo-device';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '@/core/config/supabase';
import { PastelColors } from '@/shared/theme/pastelColors';

export type TipoReaccion =
  | 'gusta'
  | 'apoyo'
  | 'ternura'
  | 'risa'
  | 'triste'
  | 'enoja'
  | 'asombra'
  | 'asco'
  | 'fuerza'
  | 'atento';

interface ReaccionConfig {
  id: TipoReaccion;
  emoji: string;
  dice: string;
  fondo: string;
  borde: string;
  gesto: 'latido' | 'inclinacion' | 'vibracion' | 'salto' | 'mareo';
}

const REACCIONES: ReaccionConfig[] = [
  { id: 'gusta', emoji: '👍', dice: 'me gusta', fondo: '#D8F6EE', borde: '#6FD1B8', gesto: 'latido' },
  { id: 'apoyo', emoji: '👏', dice: 'apoyo', fondo: '#E2F7E9', borde: '#78CFA0', gesto: 'salto' },
  { id: 'ternura', emoji: '😍', dice: 'qué ternura', fondo: '#FFD6DC', borde: '#E58A98', gesto: 'latido' },
  { id: 'risa', emoji: '😂', dice: 'qué risa', fondo: '#FFF3CD', borde: '#F5C96B', gesto: 'vibracion' },
  { id: 'triste', emoji: '😢', dice: 'qué pena', fondo: '#DCEEFF', borde: '#8BBDF5', gesto: 'inclinacion' },
  { id: 'enoja', emoji: '😡', dice: 'qué coraje', fondo: '#FFD6DC', borde: '#E06D7E', gesto: 'vibracion' },
  { id: 'asombra', emoji: '😲', dice: 'increíble', fondo: '#EAE2FF', borde: '#9F86EC', gesto: 'salto' },
  { id: 'asco', emoji: '🤢', dice: 'qué asco', fondo: '#EBF5DF', borde: '#9BC472', gesto: 'mareo' },
  { id: 'fuerza', emoji: '🙏', dice: 'fuerza', fondo: '#FFE8D6', borde: '#F4BA8C', gesto: 'latido' },
  { id: 'atento', emoji: '👀', dice: 'atento', fondo: '#FFF6D6', borde: '#E8C568', gesto: 'salto' },
];

function AvatarReaccionCascada3D({
  config,
  indice,
  cantidad,
  activo,
  onPress,
}: {
  config: ReaccionConfig;
  indice: number;
  cantidad: number;
  activo: boolean;
  onPress: () => void;
}) {
  // Cascada en eje Y independiente para la expresión en letras y para el emoji
  const textoCascadaY = useRef(new Animated.Value(-22)).current;
  const textoOpacity = useRef(new Animated.Value(0)).current;
  const emojiCascadaY = useRef(new Animated.Value(-28)).current;
  const emojiOpacity = useRef(new Animated.Value(0)).current;

  // Movimiento continuo del emoji + toque
  const loopAnim = useRef(new Animated.Value(0)).current;
  const popScale = useRef(new Animated.Value(1)).current;

  const ejecutarCascada = useCallback(() => {
    textoCascadaY.setValue(-22);
    textoOpacity.setValue(0);
    emojiCascadaY.setValue(-28);
    emojiOpacity.setValue(0);

    const retardo = Math.min(indice * 90, 720);

    Animated.sequence([
      Animated.delay(retardo),
      Animated.parallel([
        // 1. Cae primero la expresión en letras desde arriba hacia abajo
        Animated.timing(textoOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(textoCascadaY, { toValue: 0, friction: 4.5, tension: 115, useNativeDriver: true }),
        // 2. Milisegundos después cae la esfera 3D del emoji en cascada
        Animated.sequence([
          Animated.delay(75),
          Animated.parallel([
            Animated.timing(emojiOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
            Animated.spring(emojiCascadaY, { toValue: 0, friction: 4.5, tension: 105, useNativeDriver: true }),
          ]),
        ]),
      ]),
    ]).start();
  }, [emojiCascadaY, emojiOpacity, indice, textoCascadaY, textoOpacity]);

  useEffect(() => {
    ejecutarCascada();

    // Repite el ola-cascada suavemente cada cierto tiempo para que siempre tenga vida
    const intervalo = setInterval(() => {
      ejecutarCascada();
    }, 5200);

    return () => clearInterval(intervalo);
  }, [ejecutarCascada]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(loopAnim, { toValue: 1, duration: 340, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(loopAnim, { toValue: -1, duration: 340, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(loopAnim, { toValue: 0, duration: 300, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.delay(750 + indice * 90),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [indice, loopAnim]);

  const manejarToque = () => {
    ejecutarCascada();
    Animated.sequence([
      Animated.spring(popScale, { toValue: 1.4, friction: 3, tension: 210, useNativeDriver: true }),
      Animated.spring(popScale, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  const scaleLoop = loopAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: config.gesto === 'latido' ? [0.92, 1, 1.22] : [1, 1, 1],
  });

  const translateY = loopAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: config.gesto === 'salto' ? [0, 0, -5] : [0, 0, 0],
  });

  const translateX = loopAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: config.gesto === 'vibracion' ? [-3, 0, 3] : [0, 0, 0],
  });

  const rotate = loopAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange:
      config.gesto === 'mareo'
        ? ['-18deg', '0deg', '18deg']
        : config.gesto === 'inclinacion'
        ? ['-14deg', '0deg', '14deg']
        : ['0deg', '0deg', '0deg'],
  });

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={manejarToque}
      style={[
        styles.miniCard3D,
        {
          backgroundColor: activo ? config.fondo : 'rgba(255,255,255,0.92)',
          borderColor: activo ? config.borde : '#E2D9F8',
          borderWidth: activo ? 1.8 : 1.2,
        },
      ]}
    >
      {/* Expresión en letras minúsculas cayendo en cascada en Y */}
      <Animated.View
        style={[
          styles.globoMini,
          {
            backgroundColor: config.fondo,
            borderColor: config.borde,
            opacity: textoOpacity,
            transform: [{ translateY: textoCascadaY }],
          },
        ]}
      >
        <Text style={styles.globoMiniTexto}>{config.dice}</Text>
      </Animated.View>

      {/* Esfera 3D del emoji cayendo en cascada en Y + haciendo su gesto */}
      <Animated.View
        style={[
          styles.filaEsfera,
          {
            opacity: emojiOpacity,
            transform: [{ translateY: emojiCascadaY }],
          },
        ]}
      >
        <Animated.View
          style={[
            styles.esfera3D,
            {
              backgroundColor: config.fondo,
              borderColor: config.borde,
              transform: [
                { scale: Animated.multiply(scaleLoop, popScale) },
                { translateY },
                { translateX },
                { rotate },
              ],
            },
          ]}
        >
          <View style={styles.brillo3D} />
          <Text style={styles.emojiTexto}>{config.emoji}</Text>
        </Animated.View>

        {cantidad > 0 && (
          <View style={[styles.badgeContador, { backgroundColor: config.borde }]}>
            <Text style={styles.badgeContadorTexto}>{cantidad}</Text>
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

export function BarraReaccionesAnimadas({ reporteId }: { reporteId: string }) {
  const [conteos, setConteos] = useState<Record<string, number>>({});
  const [miReaccion, setMiReaccion] = useState<TipoReaccion | null>(null);
  const dispositivoId = Device.deviceName || 'Movil-UIO';

  const cargarReacciones = useCallback(async () => {
    const { data, error } = await supabase
      .from('reacciones_reportes')
      .select('dispositivo_id, tipo_reaccion')
      .eq('reporte_id', reporteId);

    if (!error && data) {
      const mapa: Record<string, number> = {};
      let mia: TipoReaccion | null = null;
      for (const fila of data) {
        mapa[fila.tipo_reaccion] = (mapa[fila.tipo_reaccion] || 0) + 1;
        if (fila.dispositivo_id === dispositivoId) {
          mia = fila.tipo_reaccion as TipoReaccion;
        }
      }
      setConteos(mapa);
      setMiReaccion(mia);
    }
  }, [dispositivoId, reporteId]);

  useEffect(() => {
    cargarReacciones();
    const canal = supabase
      .channel(`reacciones-${reporteId}-${Math.random().toString(36).slice(2, 6)}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reacciones_reportes', filter: `reporte_id=eq.${reporteId}` },
        () => cargarReacciones()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [cargarReacciones, reporteId]);

  const alternarReaccion = async (tipo: TipoReaccion) => {
    if (miReaccion === tipo) {
      setMiReaccion(null);
      setConteos((prev) => ({ ...prev, [tipo]: Math.max(0, (prev[tipo] || 1) - 1) }));
      await supabase
        .from('reacciones_reportes')
        .delete()
        .eq('reporte_id', reporteId)
        .eq('dispositivo_id', dispositivoId);
    } else {
      const anterior = miReaccion;
      setMiReaccion(tipo);
      setConteos((prev) => ({
        ...prev,
        ...(anterior ? { [anterior]: Math.max(0, (prev[anterior] || 1) - 1) } : {}),
        [tipo]: (prev[tipo] || 0) + 1,
      }));
      await supabase.from('reacciones_reportes').upsert(
        { reporte_id: reporteId, dispositivo_id: dispositivoId, tipo_reaccion: tipo },
        { onConflict: 'reporte_id,dispositivo_id' }
      );
    }
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollFila}
    >
      {REACCIONES.map((item, idx) => (
        <AvatarReaccionCascada3D
          key={item.id}
          config={item}
          indice={idx}
          cantidad={conteos[item.id] || 0}
          activo={miReaccion === item.id}
          onPress={() => alternarReaccion(item.id)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollFila: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 6,
  },
  miniCard3D: {
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 15,
    borderBottomWidth: 3.5,
    gap: 4,
    overflow: 'hidden',
    shadowColor: '#3D3556',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  globoMini: {
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: 999,
    borderWidth: 1,
  },
  globoMiniTexto: {
    fontSize: 9.5,
    fontWeight: '800',
    color: PastelColors.textoPrincipal,
    textTransform: 'lowercase',
  },
  filaEsfera: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  esfera3D: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    borderBottomWidth: 3.5,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  brillo3D: {
    position: 'absolute',
    top: 3,
    left: 6,
    width: 8,
    height: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.75)',
    transform: [{ rotate: '-20deg' }],
  },
  emojiTexto: {
    fontSize: 15,
  },
  badgeContador: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 999,
  },
  badgeContadorTexto: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
  },
});