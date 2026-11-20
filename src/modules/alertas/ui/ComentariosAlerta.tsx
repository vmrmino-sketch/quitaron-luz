import * as Device from 'expo-device';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '@/core/config/supabase';
import { PastelColors } from '@/shared/theme/pastelColors';

interface ComentarioItem {
  id: string;
  reporte_id?: string | null;
  barrio_id?: string | null;
  etiqueta_sector?: string | null;
  dispositivo_id: string;
  autor: string;
  contenido: string;
  created_at: string;
}

interface EmojiParlanteConfig {
  id: string;
  emoji: string;
  dice: string;
  fondo: string;
  borde: string;
  gesto: 'latido' | 'vibracion' | 'salto' | 'inclinacion' | 'mareo';
}

interface AccionRapida3DConfig {
  id: string;
  emoji: string;
  emojiAsociadoId: string;
  texto: string;
  mensajeCompleto: string;
  fondo: string;
  borde: string;
  gesto: 'latido' | 'salto' | 'vibracion';
}

interface ComentariosProps {
  reporteId?: string;
  barrioId?: string;
  nombreBarrio?: string;
}

const AVATARES_VECINOS = ['🦊', '🐱', '🐼', '🐨', '🦁', '🐸', '🦉', '🦄'];

const EMOJIS_PARLANTES: EmojiParlanteConfig[] = [
  { id: 'gusta', emoji: '👍', dice: 'me gusta', fondo: '#D8F6EE', borde: '#6FD1B8', gesto: 'latido' },
  { id: 'apoyo', emoji: '👏', dice: 'apoyo', fondo: '#E2F7E9', borde: '#78CFA0', gesto: 'salto' },
  { id: 'ternura', emoji: '😍', dice: 'qué ternura', fondo: '#FFD6DC', borde: '#E58A98', gesto: 'latido' },
  { id: 'risa', emoji: '😂', dice: 'qué risa', fondo: '#FFF3CD', borde: '#F5C96B', gesto: 'vibracion' },
  { id: 'triste', emoji: '😢', dice: 'qué pena', fondo: '#DCEEFF', borde: '#8BBDF5', gesto: 'inclinacion' },
  { id: 'enojo', emoji: '😡', dice: 'qué coraje', fondo: '#FFD6DC', borde: '#E06D7E', gesto: 'vibracion' },
  { id: 'asombro', emoji: '😲', dice: 'increíble', fondo: '#EAE2FF', borde: '#9F86EC', gesto: 'salto' },
  { id: 'asco', emoji: '🤢', dice: 'qué asco', fondo: '#EBF5DF', borde: '#9BC472', gesto: 'mareo' },
  { id: 'fuerza', emoji: '🙏', dice: 'fuerza', fondo: '#FFE8D6', borde: '#F4BA8C', gesto: 'latido' },
  { id: 'ojo', emoji: '👀', dice: 'atento', fondo: '#FFF6D6', borde: '#E8C568', gesto: 'salto' },
  { id: 'voy', emoji: '🏃', dice: 'voy por ahí', fondo: '#D8F6EE', borde: '#6FD1B8', gesto: 'salto' },
  { id: 'reporte', emoji: '📲', dice: 'ya reporté', fondo: '#EAE2FF', borde: '#9F86EC', gesto: 'vibracion' },
];

const ETIQUETAS_SECTOR: AccionRapida3DConfig[] = [
  { id: 'charla', emoji: '☕', emojiAsociadoId: 'gusta', texto: 'charla', mensajeCompleto: 'charla', fondo: '#EAE2FF', borde: '#9F86EC', gesto: 'latido' },
  { id: 'alerta', emoji: '⚠️', emojiAsociadoId: 'ojo', texto: 'aviso', mensajeCompleto: 'alerta', fondo: '#FFF3CD', borde: '#F5C96B', gesto: 'vibracion' },
  { id: 'dato', emoji: '💡', emojiAsociadoId: 'asombro', texto: 'dato útil', mensajeCompleto: 'dato', fondo: '#D8F6EE', borde: '#6FD1B8', gesto: 'salto' },
  { id: 'plan', emoji: '🎉', emojiAsociadoId: 'apoyo', texto: 'plan', mensajeCompleto: 'plan', fondo: '#FFE8D6', borde: '#F4BA8C', gesto: 'salto' },
];

const RESPUESTAS_RAPIDAS_TARJETA: AccionRapida3DConfig[] = [
  { id: 'voy', emoji: '🏃', emojiAsociadoId: 'voy', texto: 'voy por ahí', mensajeCompleto: 'voy por ahí', fondo: '#D8F6EE', borde: '#6FD1B8', gesto: 'salto' },
  { id: 'atento', emoji: '👀', emojiAsociadoId: 'ojo', texto: 'sigo atento', mensajeCompleto: 'sigo atento', fondo: '#FFF3CD', borde: '#F5C96B', gesto: 'latido' },
  { id: 'reporte', emoji: '📲', emojiAsociadoId: 'reporte', texto: 'ya reporté', mensajeCompleto: 'ya reporté', fondo: '#EAE2FF', borde: '#9F86EC', gesto: 'vibracion' },
  { id: 'fuerza', emoji: '🙏', emojiAsociadoId: 'fuerza', texto: 'mucha fuerza', mensajeCompleto: 'mucha fuerza', fondo: '#FFE8D6', borde: '#F4BA8C', gesto: 'latido' },
];

const REACCIONES_MINI: EmojiParlanteConfig[] = [
  { id: 'gusta', emoji: '👍', dice: 'me gusta', fondo: '#D8F6EE', borde: '#6FD1B8', gesto: 'latido' },
  { id: 'apoyo', emoji: '👏', dice: 'apoyo', fondo: '#E2F7E9', borde: '#78CFA0', gesto: 'salto' },
  { id: 'risa', emoji: '😂', dice: 'qué risa', fondo: '#FFF3CD', borde: '#F5C96B', gesto: 'vibracion' },
  { id: 'triste', emoji: '😢', dice: 'qué pena', fondo: '#DCEEFF', borde: '#8BBDF5', gesto: 'inclinacion' },
  { id: 'enojo', emoji: '😡', dice: 'qué coraje', fondo: '#FFD6DC', borde: '#E06D7E', gesto: 'vibracion' },
  { id: 'asombro', emoji: '😲', dice: 'increíble', fondo: '#EAE2FF', borde: '#9F86EC', gesto: 'salto' },
  { id: 'fuerza', emoji: '🙏', dice: 'fuerza', fondo: '#FFE8D6', borde: '#F4BA8C', gesto: 'latido' },
];

function obtenerAvatarVecino(seed: string) {
  let suma = 0;
  for (let i = 0; i < seed.length; i++) {
    suma += seed.charCodeAt(i);
  }
  return AVATARES_VECINOS[suma % AVATARES_VECINOS.length];
}

function detectarEmojiEnTexto(texto: string): string | null {
  for (const item of EMOJIS_PARLANTES) {
    if (texto.includes(item.emoji)) return item.id;
  }
  if (texto.includes('❤') || texto.includes('🥰')) return 'ternura';
  if (texto.includes('🤣')) return 'risa';
  if (texto.includes('🤬') || texto.includes('😠')) return 'enojo';
  if (texto.includes('😭') || texto.includes('😔')) return 'triste';
  if (texto.includes('😱') || texto.includes('🤯')) return 'asombro';
  if (texto.includes('🤮')) return 'asco';
  return null;
}

function empaquetarComentario(texto: string, emojiId: string | null): string {
  const idFinal = emojiId || detectarEmojiEnTexto(texto);
  if (!idFinal) return texto;
  return `[EMOJI:${idFinal}] ${texto}`.trim();
}

function desempaquetarComentario(raw: string): {
  textoLimpio: string;
  emojiConfig: EmojiParlanteConfig | null;
} {
  const match = raw.match(/^\[EMOJI:([a-z]+)\]\s*(.*)$/s);
  if (match) {
    const found = EMOJIS_PARLANTES.find((e) => e.id === match[1]) || null;
    return { textoLimpio: match[2], emojiConfig: found };
  }
  const detectado = detectarEmojiEnTexto(raw);
  const found = detectado ? EMOJIS_PARLANTES.find((e) => e.id === detectado) || null : null;
  return { textoLimpio: raw, emojiConfig: found };
}

function ChipAccionCascada3D({
  config,
  indice,
  activo = false,
  onPress,
}: {
  config: AccionRapida3DConfig;
  indice: number;
  activo?: boolean;
  onPress: () => void;
}) {
  const textoY = useRef(new Animated.Value(-18)).current;
  const textoOp = useRef(new Animated.Value(0)).current;
  const emojiY = useRef(new Animated.Value(-22)).current;
  const emojiOp = useRef(new Animated.Value(0)).current;
  const loopAnim = useRef(new Animated.Value(0)).current;
  const popScale = useRef(new Animated.Value(1)).current;

  const lanzarCascada = useCallback(() => {
    textoY.setValue(-18);
    textoOp.setValue(0);
    emojiY.setValue(-22);
    emojiOp.setValue(0);

    Animated.sequence([
      Animated.delay(indice * 85),
      Animated.parallel([
        Animated.timing(textoOp, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(textoY, { toValue: 0, friction: 4.5, tension: 115, useNativeDriver: true }),
        Animated.sequence([
          Animated.delay(70),
          Animated.parallel([
            Animated.timing(emojiOp, { toValue: 1, duration: 220, useNativeDriver: true }),
            Animated.spring(emojiY, { toValue: 0, friction: 4.5, tension: 105, useNativeDriver: true }),
          ]),
        ]),
      ]),
    ]).start();
  }, [emojiOp, emojiY, indice, textoOp, textoY]);

  useEffect(() => {
    lanzarCascada();
    const timer = setInterval(lanzarCascada, 5200);
    return () => clearInterval(timer);
  }, [lanzarCascada]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(loopAnim, { toValue: 1, duration: 340, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(loopAnim, { toValue: -1, duration: 340, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(loopAnim, { toValue: 0, duration: 300, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.delay(800 + indice * 100),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [indice, loopAnim]);

  const presionar = () => {
    lanzarCascada();
    Animated.sequence([
      Animated.spring(popScale, { toValue: 1.35, friction: 3, tension: 200, useNativeDriver: true }),
      Animated.spring(popScale, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  const scaleLoop = loopAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: config.gesto === 'latido' ? [0.92, 1, 1.2] : [1, 1, 1],
  });
  const translateY = loopAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: config.gesto === 'salto' ? [0, 0, -4] : [0, 0, 0],
  });
  const translateX = loopAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: config.gesto === 'vibracion' ? [-2.5, 0, 2.5] : [0, 0, 0],
  });

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={presionar}
      style={[
        styles.tarjetaRapida3D,
        {
          backgroundColor: activo ? config.fondo : '#FFFFFF',
          borderColor: activo ? config.borde : '#DCD2F7',
          borderWidth: activo ? 1.8 : 1.2,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.globoRapido3D,
          {
            backgroundColor: config.fondo,
            borderColor: config.borde,
            opacity: textoOp,
            transform: [{ translateY: textoY }],
          },
        ]}
      >
        <Text numberOfLines={1} style={styles.globoRapidoTexto}>
          {config.texto}
        </Text>
      </Animated.View>

      <Animated.View
        style={[
          styles.esferaRapida3D,
          {
            backgroundColor: config.fondo,
            borderColor: config.borde,
            opacity: emojiOp,
            transform: [
              { translateY: emojiY },
              { scale: Animated.multiply(scaleLoop, popScale) },
              { translateY },
              { translateX },
            ],
          },
        ]}
      >
        <View style={styles.brilloEspecular3D} />
        <Text style={styles.emojiRapido3DTexto}>{config.emoji}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

function AvatarEmoji3DParlante({
  config,
  indice = 0,
  seleccionado = false,
  cantidad,
  onPress,
}: {
  config: EmojiParlanteConfig;
  indice?: number;
  seleccionado?: boolean;
  cantidad?: number;
  onPress?: () => void;
}) {
  const textoCascadaY = useRef(new Animated.Value(-22)).current;
  const textoOpacity = useRef(new Animated.Value(0)).current;
  const emojiCascadaY = useRef(new Animated.Value(-28)).current;
  const emojiOpacity = useRef(new Animated.Value(0)).current;

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
        Animated.timing(textoOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(textoCascadaY, { toValue: 0, friction: 4.5, tension: 115, useNativeDriver: true }),
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
    const intervalo = setInterval(ejecutarCascada, 5200);
    return () => clearInterval(intervalo);
  }, [ejecutarCascada]);

  useEffect(() => {
    const animacion = Animated.loop(
      Animated.sequence([
        Animated.timing(loopAnim, { toValue: 1, duration: 340, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(loopAnim, { toValue: -1, duration: 340, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(loopAnim, { toValue: 0, duration: 300, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.delay(750 + indice * 90),
      ])
    );
    animacion.start();
    return () => animacion.stop();
  }, [indice, loopAnim]);

  const manejarToque = () => {
    ejecutarCascada();
    Animated.sequence([
      Animated.spring(popScale, { toValue: 1.38, friction: 3, tension: 200, useNativeDriver: true }),
      Animated.spring(popScale, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
    if (onPress) onPress();
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
        styles.tarjetaEmoji3D,
        {
          backgroundColor: seleccionado ? config.fondo : '#FFFFFF',
          borderColor: seleccionado ? config.borde : '#E2D9F8',
          borderWidth: seleccionado ? 1.8 : 1.2,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.globoDialogo3D,
          {
            backgroundColor: config.fondo,
            borderColor: config.borde,
            opacity: textoOpacity,
            transform: [{ translateY: textoCascadaY }],
          },
        ]}
      >
        <Text numberOfLines={1} style={styles.globoDialogoTexto}>
          {config.dice}
        </Text>
      </Animated.View>

      <Animated.View
        style={[
          styles.filaEsferaMini,
          {
            opacity: emojiOpacity,
            transform: [{ translateY: emojiCascadaY }],
          },
        ]}
      >
        <Animated.View
          style={[
            styles.esferaAvatar3D,
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
          <View style={styles.brilloEspecular3D} />
          <Text style={styles.emojiAvatar3DTexto}>{config.emoji}</Text>
        </Animated.View>

        {cantidad !== undefined && cantidad > 0 && (
          <View style={[styles.badgeContadorMini, { backgroundColor: config.borde }]}>
            <Text style={styles.badgeContadorMiniTexto}>{cantidad}</Text>
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

function MiniReaccionesComentario({
  comentarioId,
  dispositivoId,
}: {
  comentarioId: string;
  dispositivoId: string;
}) {
  const [conteos, setConteos] = useState<Record<string, number>>({});
  const [miEmoji, setMiEmoji] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    const { data, error } = await supabase
      .from('reacciones_comentarios')
      .select('dispositivo_id, emoji')
      .eq('comentario_id', comentarioId);

    if (!error && data) {
      const mapa: Record<string, number> = {};
      let mio: string | null = null;
      for (const r of data) {
        mapa[r.emoji] = (mapa[r.emoji] || 0) + 1;
        if (r.dispositivo_id === dispositivoId) mio = r.emoji;
      }
      setConteos(mapa);
      setMiEmoji(mio);
    }
  }, [comentarioId, dispositivoId]);

  useEffect(() => {
    cargar();
    const canal = supabase
      .channel(`mini-reac-${comentarioId}-${Math.random().toString(36).slice(2, 6)}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reacciones_comentarios', filter: `comentario_id=eq.${comentarioId}` },
        () => cargar()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [cargar, comentarioId]);

  const tocar = async (item: EmojiParlanteConfig) => {
    if (miEmoji === item.emoji) {
      setMiEmoji(null);
      setConteos((p) => ({ ...p, [item.emoji]: Math.max(0, (p[item.emoji] || 1) - 1) }));
      await supabase
        .from('reacciones_comentarios')
        .delete()
        .eq('comentario_id', comentarioId)
        .eq('dispositivo_id', dispositivoId);
    } else {
      const ant = miEmoji;
      setMiEmoji(item.emoji);
      setConteos((p) => ({
        ...p,
        ...(ant ? { [ant]: Math.max(0, (p[ant] || 1) - 1) } : {}),
        [item.emoji]: (p[item.emoji] || 0) + 1,
      }));
      await supabase.from('reacciones_comentarios').upsert(
        { comentario_id: comentarioId, dispositivo_id: dispositivoId, emoji: item.emoji },
        { onConflict: 'comentario_id,dispositivo_id' }
      );
    }
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filaMiniReac}
    >
      {REACCIONES_MINI.map((item, idx) => (
        <AvatarEmoji3DParlante
          key={item.emoji}
          config={item}
          indice={idx}
          seleccionado={miEmoji === item.emoji}
          cantidad={conteos[item.emoji] || 0}
          onPress={() => tocar(item)}
        />
      ))}
    </ScrollView>
  );
}

function TarjetaComentarioCascada3D({
  comentario,
  indice,
  esMio,
  miAvatarPerfil,
  dispositivoId,
  onBorrar,
}: {
  comentario: ComentarioItem;
  indice: number;
  esMio: boolean;
  miAvatarPerfil: string;
  dispositivoId: string;
  onBorrar: (id: string) => void;
}) {
  const dropY = useRef(new Animated.Value(-38)).current;
  const scale = useRef(new Animated.Value(0.88)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const tiltX = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const retardo = Math.min(indice * 80, 500);
    Animated.sequence([
      Animated.delay(retardo),
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(dropY, { toValue: 0, friction: 5.5, tension: 100, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 5, tension: 110, useNativeDriver: true }),
        Animated.timing(tiltX, { toValue: 0, duration: 340, useNativeDriver: true }),
      ]),
    ]).start();
  }, [dropY, indice, opacity, scale, tiltX]);

  const rotateX = tiltX.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-22deg'] });
  const avatar = esMio ? miAvatarPerfil : obtenerAvatarVecino(comentario.dispositivo_id);
  const { textoLimpio, emojiConfig } = desempaquetarComentario(comentario.contenido);
  const etiquetaObj = ETIQUETAS_SECTOR.find((e) => e.mensajeCompleto === comentario.etiqueta_sector);

  return (
    <Animated.View
      style={[
        styles.tarjeta3DWrapper,
        {
          opacity,
          transform: [{ perspective: 700 }, { translateY: dropY }, { scale }, { rotateX }],
        },
      ]}
    >
      <View style={[styles.tarjeta3DCuerpo, esMio ? styles.cuerpoMio3D : styles.cuerpoVecino3D]}>
        <View style={[styles.medalla3D, esMio ? styles.medallaMia : styles.medallaVecino]}>
          <Text style={styles.medallaEmoji}>{avatar}</Text>
        </View>

        <View style={styles.columnaTexto}>
          <View style={styles.filaMeta}>
            <View style={styles.filaChipsMeta}>
              <View style={[styles.chipRol, esMio ? styles.chipRolMio : styles.chipRolVecino]}>
                <Text style={styles.chipRolTexto}>
                  {esMio ? `✨ ${comentario.autor.toLowerCase()}` : `📍 ${comentario.autor.toLowerCase()}`}
                </Text>
              </View>
              {etiquetaObj && comentario.barrio_id && (
                <View style={[styles.chipEtiqueta, { backgroundColor: etiquetaObj.fondo }]}>
                  <Text style={styles.chipEtiquetaTexto}>
                    {etiquetaObj.emoji} {etiquetaObj.texto}
                  </Text>
                </View>
              )}
            </View>

            {esMio && (
              <TouchableOpacity
                activeOpacity={0.75}
                style={styles.btnBorrar3D}
                onPress={() => onBorrar(comentario.id)}
              >
                <Text style={styles.btnBorrarTexto}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {!!textoLimpio && <Text style={styles.textoComentario3D}>{textoLimpio}</Text>}

          {emojiConfig && (
            <View style={{ alignSelf: 'flex-start', marginTop: 4 }}>
              <AvatarEmoji3DParlante config={emojiConfig} seleccionado />
            </View>
          )}

          <MiniReaccionesComentario comentarioId={comentario.id} dispositivoId={dispositivoId} />
        </View>
      </View>
    </Animated.View>
  );
}

export function ComentariosAlerta({ reporteId, barrioId, nombreBarrio }: ComentariosProps) {
  const esModoSector = Boolean(barrioId && !reporteId);
  const [abierto, setAbierto] = useState(false);
  const [comentarios, setComentarios] = useState<ComentarioItem[]>([]);
  const [texto, setTexto] = useState('');
  const [emojiSeleccionado, setEmojiSeleccionado] = useState<string | null>(null);
  const [etiquetaSector, setEtiquetaSector] = useState<string>('charla');
  const [enviando, setEnviando] = useState(false);
  const [cargando, setCargando] = useState(false);

  const dispositivoId = Device.deviceName || 'Movil-UIO';
  const [nombreAutor, setNombreAutor] = useState(
    `vecino ${dispositivoId.slice(0, 10).toLowerCase()}`
  );
  const [miAvatarPerfil, setMiAvatarPerfil] = useState('🦊');

  const cargarPerfilPropio = useCallback(async () => {
    const { data } = await supabase
      .from('fichas_vecinales')
      .select('alias_vecino, avatar_emoji')
      .eq('dispositivo_id', dispositivoId)
      .limit(1)
      .maybeSingle();

    if (data?.alias_vecino) setNombreAutor(data.alias_vecino);
    if (data?.avatar_emoji) setMiAvatarPerfil(data.avatar_emoji);
  }, [dispositivoId]);

  const cargarComentarios = useCallback(async () => {
    setCargando(true);
    let query = supabase
      .from('comentarios_reportes')
      .select('*')
      .order('created_at', { ascending: false });

    if (reporteId) {
      query = query.eq('reporte_id', reporteId);
    } else if (barrioId) {
      query = query.eq('barrio_id', barrioId).is('reporte_id', null);
    }

    const { data, error } = await query;
    if (!error && data) {
      setComentarios(data as ComentarioItem[]);
    }
    setCargando(false);
  }, [barrioId, reporteId]);

  useEffect(() => {
    cargarPerfilPropio();
    cargarComentarios();
    const filtro = reporteId ? `reporte_id=eq.${reporteId}` : `barrio_id=eq.${barrioId}`;
    const canal = supabase
      .channel(`muro-3d-${reporteId ?? barrioId}-${Math.random().toString(36).slice(2, 6)}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comentarios_reportes', filter: filtro },
        () => cargarComentarios()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [barrioId, cargarComentarios, cargarPerfilPropio, reporteId]);

  const enviarComentario = async (textoDirecto?: string, emojiForzadoId?: string) => {
    const base = textoDirecto !== undefined ? textoDirecto : texto;
    const limpio = base.trim();
    const emojiAUsar = emojiForzadoId !== undefined ? emojiForzadoId : emojiSeleccionado;
    if ((!limpio && !emojiAUsar) || enviando) return;

    const contenidoFinal = empaquetarComentario(limpio, emojiAUsar);
    setEnviando(true);
    if (textoDirecto === undefined) setTexto('');
    setEmojiSeleccionado(null);

    const { error } = await supabase.from('comentarios_reportes').insert({
      reporte_id: reporteId ?? null,
      barrio_id: barrioId ?? null,
      etiqueta_sector: esModoSector ? etiquetaSector : null,
      dispositivo_id: dispositivoId,
      autor: nombreAutor,
      contenido: contenidoFinal,
    });

    if (error) {
      Alert.alert('No se pudo publicar', error.message);
      if (textoDirecto === undefined) setTexto(limpio);
    }
    setEnviando(false);
  };

  const borrarComentario = async (id: string) => {
    await supabase.from('comentarios_reportes').delete().eq('id', id);
  };

  const puedeEnviar = (texto.trim().length > 0 || emojiSeleccionado !== null) && !enviando;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.85}
        style={[
          styles.gatillo3D,
          esModoSector && styles.gatilloSector3D,
          abierto && styles.gatillo3DActivo,
        ]}
        onPress={() => {
          cargarPerfilPropio();
          setAbierto((prev) => !prev);
        }}
      >
        <View style={styles.gatilloIzq}>
          <Text style={styles.gatilloIcono}>{esModoSector ? '🏘️' : '💬'}</Text>
          <Text style={styles.gatilloTexto}>
            {esModoSector
              ? `Plaza 3D de ${nombreBarrio ?? 'Sector'} (${comentarios.length})`
              : `Muro 3D y Comentarios (${comentarios.length})`}
          </Text>
        </View>
        <View style={styles.gatilloPill}>
          <Text style={styles.gatilloPillTexto}>{abierto ? 'Cerrar ▲' : 'Abrir ▼'}</Text>
        </View>
      </TouchableOpacity>

      {abierto && (
        <View style={styles.escenarioCascada}>
          <View style={styles.bloqueSeccionMuro}>
            <Text style={styles.labelSeccionMuro}>
              {esModoSector ? 'Tema del barrio' : 'Respuesta rápida con un toque'}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.barraAcciones3D}
            >
              {esModoSector
                ? ETIQUETAS_SECTOR.map((et, idx) => (
                    <ChipAccionCascada3D
                      key={et.id}
                      config={et}
                      indice={idx}
                      activo={etiquetaSector === et.mensajeCompleto}
                      onPress={() => setEtiquetaSector(et.mensajeCompleto)}
                    />
                  ))
                : RESPUESTAS_RAPIDAS_TARJETA.map((resp, idx) => (
                    <ChipAccionCascada3D
                      key={resp.id}
                      config={resp}
                      indice={idx}
                      onPress={() => enviarComentario(resp.mensajeCompleto, resp.emojiAsociadoId)}
                    />
                  ))}
            </ScrollView>
          </View>

          <View style={styles.separadorMuro} />

          <View style={styles.bloqueSeccionMuro}>
            <View style={styles.compositor3D}>
              <TextInput
                style={styles.input3D}
                placeholder={
                  esModoSector
                    ? `Comenta qué pasa en ${nombreBarrio ?? 'el barrio'}...`
                    : 'Escribe tu comentario...'
                }
                placeholderTextColor="#9A91B4"
                value={texto}
                onChangeText={(val) => {
                  setTexto(val);
                  const detectado = detectarEmojiEnTexto(val);
                  if (detectado && !emojiSeleccionado) {
                    setEmojiSeleccionado(detectado);
                  }
                }}
                maxLength={240}
              />
              <TouchableOpacity
                activeOpacity={0.8}
                disabled={!puedeEnviar}
                style={[styles.botonLanzar3D, !puedeEnviar && { opacity: 0.45 }]}
                onPress={() => enviarComentario()}
              >
                <Text style={styles.botonLanzarTexto}>🚀</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.labelSeccionMuro}>Acompaña con un avatar 3D</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.barraAvatares3D}
            >
              {EMOJIS_PARLANTES.slice(0, 10).map((item, idx) => (
                <AvatarEmoji3DParlante
                  key={item.id}
                  config={item}
                  indice={idx}
                  seleccionado={emojiSeleccionado === item.id}
                  onPress={() =>
                    setEmojiSeleccionado(emojiSeleccionado === item.id ? null : item.id)
                  }
                />
              ))}
            </ScrollView>
          </View>

          <View style={styles.separadorMuro} />

          {cargando ? (
            <ActivityIndicator size="small" color={PastelColors.textoPrincipal} style={{ marginVertical: 10 }} />
          ) : comentarios.length === 0 ? (
            <Text style={styles.vacio3DTexto}>
              ✨ Escribe arriba o elige un avatar 3D para estrenar el muro
            </Text>
          ) : (
            <View style={styles.listaCascada}>
              {comentarios.map((item, idx) => (
                <TarjetaComentarioCascada3D
                  key={item.id}
                  comentario={item}
                  indice={idx}
                  esMio={item.dispositivo_id === dispositivoId}
                  miAvatarPerfil={miAvatarPerfil}
                  dispositivoId={dispositivoId}
                  onBorrar={borrarComentario}
                />
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  gatillo3D: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderColor: '#D6CCF2',
    borderWidth: 1.5,
    borderBottomWidth: 3.5,
    borderRadius: 16,
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  gatilloSector3D: { backgroundColor: '#F4F0FC', borderColor: '#B8A4F5' },
  gatillo3DActivo: { backgroundColor: '#F3EEFF', borderColor: '#9F86EC' },
  gatilloIzq: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  gatilloIcono: { fontSize: 16 },
  gatilloTexto: { fontSize: 12.5, fontWeight: '800', color: PastelColors.textoPrincipal },
  gatilloPill: {
    backgroundColor: PastelColors.lavanda,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  gatilloPillTexto: { fontSize: 11, fontWeight: '800', color: PastelColors.textoPrincipal },
  escenarioCascada: {
    backgroundColor: 'rgba(252, 250, 255, 0.98)',
    borderColor: '#D6CCF2',
    borderWidth: 1.5,
    borderRadius: 20,
    padding: 14,
    gap: 14,
  },
  bloqueSeccionMuro: { gap: 8 },
  labelSeccionMuro: {
    fontSize: 10.5,
    fontWeight: '800',
    color: PastelColors.textoSecundario,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    paddingLeft: 2,
  },
  separadorMuro: {
    height: 1,
    backgroundColor: 'rgba(184, 164, 245, 0.25)',
  },
  barraAcciones3D: { flexDirection: 'row', gap: 10, paddingVertical: 4 },
  tarjetaRapida3D: {
    flexShrink: 0,
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
    borderBottomWidth: 3.5,
    gap: 5,
    overflow: 'hidden',
  },
  globoRapido3D: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, borderWidth: 1 },
  globoRapidoTexto: {
    fontSize: 9.5,
    fontWeight: '800',
    color: PastelColors.textoPrincipal,
    textTransform: 'lowercase',
  },
  esferaRapida3D: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    borderBottomWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  emojiRapido3DTexto: { fontSize: 15 },
  compositor3D: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  input3D: {
    flex: 1,
    height: 44,
    backgroundColor: '#FFFFFF',
    borderColor: '#B8A4F5',
    borderWidth: 1.5,
    borderBottomWidth: 3.5,
    borderRadius: 15,
    paddingHorizontal: 14,
    fontSize: 13.5,
    fontWeight: '600',
    color: PastelColors.textoPrincipal,
  },
  botonLanzar3D: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: PastelColors.menta,
    borderColor: PastelColors.mentaBorde,
    borderWidth: 1.5,
    borderBottomWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonLanzarTexto: { fontSize: 19 },
  barraAvatares3D: { flexDirection: 'row', gap: 10, paddingVertical: 4 },
  tarjetaEmoji3D: {
    flexShrink: 0,
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 15,
    borderBottomWidth: 3.5,
    gap: 5,
    overflow: 'hidden',
  },
  globoDialogo3D: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999, borderWidth: 1 },
  globoDialogoTexto: {
    fontSize: 9.5,
    fontWeight: '800',
    color: PastelColors.textoPrincipal,
    textTransform: 'lowercase',
  },
  filaEsferaMini: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  esferaAvatar3D: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    borderBottomWidth: 3.5,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  brilloEspecular3D: {
    position: 'absolute',
    top: 3,
    left: 6,
    width: 8,
    height: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.75)',
    transform: [{ rotate: '-20deg' }],
  },
  emojiAvatar3DTexto: { fontSize: 15 },
  badgeContadorMini: { paddingHorizontal: 5, paddingVertical: 1, borderRadius: 999 },
  badgeContadorMiniTexto: { fontSize: 9.5, fontWeight: '900', color: '#FFFFFF' },
  vacio3DTexto: {
    fontSize: 12,
    fontWeight: '700',
    color: PastelColors.textoSecundario,
    textAlign: 'center',
    paddingVertical: 10,
  },
  listaCascada: { gap: 14, marginTop: 2 },
  tarjeta3DWrapper: { width: '100%' },
  tarjeta3DCuerpo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
    borderRadius: 18,
    padding: 13,
    borderWidth: 1.5,
    borderTopWidth: 2,
    borderBottomWidth: 4,
  },
  cuerpoMio3D: { backgroundColor: '#E8FBF4', borderColor: '#7AD4B4', borderTopColor: '#FFFFFF' },
  cuerpoVecino3D: { backgroundColor: '#FFFFFF', borderColor: '#C5B6F2', borderTopColor: '#FFFFFF' },
  medalla3D: {
    width: 36,
    height: 36,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.2,
    borderBottomWidth: 3,
  },
  medallaMia: { backgroundColor: PastelColors.menta, borderColor: PastelColors.mentaBorde },
  medallaVecino: { backgroundColor: PastelColors.lavanda, borderColor: PastelColors.lavandaBorde },
  medallaEmoji: { fontSize: 18 },
  columnaTexto: { flex: 1, gap: 8 },
  filaMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  filaChipsMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  chipRol: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  chipRolMio: { backgroundColor: '#C8F2E3' },
  chipRolVecino: { backgroundColor: '#EFEAFF' },
  chipRolTexto: { fontSize: 9.5, fontWeight: '900', color: PastelColors.textoPrincipal, textTransform: 'lowercase' },
  chipEtiqueta: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  chipEtiquetaTexto: { fontSize: 9.5, fontWeight: '800', color: PastelColors.textoPrincipal },
  btnBorrar3D: {
    width: 22,
    height: 22,
    borderRadius: 8,
    backgroundColor: '#FFD6DC',
    borderWidth: 1,
    borderBottomWidth: 2,
    borderColor: '#E58A98',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnBorrarTexto: { fontSize: 10, fontWeight: '900', color: '#5E2129' },
  textoComentario3D: { fontSize: 13.5, fontWeight: '700', lineHeight: 19, color: PastelColors.textoPrincipal },
  filaMiniReac: { flexDirection: 'row', gap: 8, marginTop: 4, paddingVertical: 2 },
});