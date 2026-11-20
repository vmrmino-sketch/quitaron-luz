import * as Device from 'expo-device';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '@/core/config/supabase';
import { PastelColors } from '@/shared/theme/pastelColors';

export interface HistoriaItem {
  id: string;
  barrio_id: string;
  dispositivo_id: string;
  autor: string;
  avatar_emoji: string;
  categoria: string;
  mensaje: string;
  created_at: string;
}

const TEMAS_HISTORIA = [
  { id: 'trafico', emoji: '🚦', etiqueta: 'tráfico', fondo: '#FFE8D6', borde: '#F4BA8C' },
  { id: 'resuelto', emoji: '✅', etiqueta: 'ya volvió', fondo: '#D8F6EE', borde: '#6FD1B8' },
  { id: 'feria', emoji: '🛍️', etiqueta: 'feria / dato', fondo: '#FFF3CD', borde: '#F5C96B' },
  { id: 'clima', emoji: '🌦️', etiqueta: 'clima', fondo: '#DCEEFF', borde: '#8BBDF5' },
  { id: 'alerta', emoji: '👀', etiqueta: 'ojo en vía', fondo: '#FFD6DC', borde: '#E58A98' },
];

function calcularHorasRestantes(createdAtIso: string): string {
  const expiraMs = new Date(createdAtIso).getTime() + 24 * 60 * 60 * 1000;
  const diffMs = Math.max(0, expiraMs - Date.now());
  const horas = Math.floor(diffMs / (1000 * 60 * 60));
  const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  if (horas >= 1) return `⏳ Quedan ${horas}h ${mins}m`;
  return `⏳ Quedan ${mins} min`;
}

function BurbujaHistoriaCascada({
  historia,
  indice,
  onPress,
}: {
  historia: HistoriaItem;
  indice: number;
  onPress: () => void;
}) {
  const dropY = useRef(new Animated.Value(-22)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const popScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(Math.min(indice * 75, 500)),
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(dropY, { toValue: 0, friction: 5, tension: 110, useNativeDriver: true }),
      ]),
    ]).start();
  }, [dropY, indice, opacity]);

  const tema = TEMAS_HISTORIA.find((t) => t.id === historia.categoria) || TEMAS_HISTORIA[0];

  const tocar = () => {
    Animated.sequence([
      Animated.spring(popScale, { toValue: 1.15, friction: 3, tension: 180, useNativeDriver: true }),
      Animated.spring(popScale, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View style={{ opacity, transform: [{ translateY: dropY }, { scale: popScale }] }}>
      <TouchableOpacity activeOpacity={0.85} onPress={tocar} style={styles.storyItem}>
        <View
          style={[
            styles.aroExterior3D,
            { backgroundColor: tema.fondo, borderColor: tema.borde },
          ]}
        >
          <View style={styles.brilloEspecular} />
          <Text style={styles.storyAvatar}>{historia.avatar_emoji || '🦊'}</Text>
          <View style={[styles.badgeTemaMini, { backgroundColor: '#FFFFFF', borderColor: tema.borde }]}>
            <Text style={styles.badgeTemaTexto}>{tema.emoji}</Text>
          </View>
        </View>
        <Text numberOfLines={1} style={styles.storyAutor}>
          {historia.autor.toLowerCase()}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export function HistoriasBarrio3D({
  barrioId,
  nombreBarrio,
}: {
  barrioId: string;
  nombreBarrio: string;
}) {
  const [historias, setHistorias] = useState<HistoriaItem[]>([]);
  const [historiaActiva, setHistoriaActiva] = useState<HistoriaItem | null>(null);
  const [modalCrear, setModalCrear] = useState(false);
  const [temaSeleccionado, setTemaSeleccionado] = useState(TEMAS_HISTORIA[0].id);
  const [mensajeNuevo, setMensajeNuevo] = useState('');
  const [enviando, setEnviando] = useState(false);

  const dispositivoId = Device.deviceName || 'Movil-UIO';

  const cargarHistorias24h = useCallback(async () => {
    const hace24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('historias_barrio')
      .select('*')
      .eq('barrio_id', barrioId)
      .gte('created_at', hace24h)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setHistorias(data as HistoriaItem[]);
    }
  }, [barrioId]);

  useEffect(() => {
    cargarHistorias24h();

    const canal = supabase
      .channel(`historias-24h-${barrioId}-${Math.random().toString(36).slice(2, 6)}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'historias_barrio', filter: `barrio_id=eq.${barrioId}` },
        () => cargarHistorias24h()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [barrioId, cargarHistorias24h]);

  const publicarHistoria = async () => {
    const limpio = mensajeNuevo.trim();
    if (!limpio || enviando) return;

    setEnviando(true);

    const { data: perfil } = await supabase
      .from('fichas_vecinales')
      .select('alias_vecino, avatar_emoji, fichas')
      .eq('dispositivo_id', dispositivoId)
      .eq('barrio_id', barrioId)
      .maybeSingle();

    const autorFinal =
      perfil?.alias_vecino || `vecino ${dispositivoId.slice(0, 10).toLowerCase()}`;
    const avatarFinal = perfil?.avatar_emoji || '🦊';

    const { error } = await supabase.from('historias_barrio').insert({
      barrio_id: barrioId,
      dispositivo_id: dispositivoId,
      autor: autorFinal,
      avatar_emoji: avatarFinal,
      categoria: temaSeleccionado,
      mensaje: limpio,
    });

    if (error) {
      Alert.alert('No se pudo publicar', error.message);
    } else {
      // Acreditar +2 fichas vecinales por historia fresca
      await supabase.from('fichas_vecinales').upsert(
        {
          dispositivo_id: dispositivoId,
          barrio_id: barrioId,
          alias_vecino: autorFinal,
          avatar_emoji: avatarFinal,
          fichas: (perfil?.fichas || 0) + 2,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'dispositivo_id,barrio_id' }
      );

      setMensajeNuevo('');
      setModalCrear(false);
      await cargarHistorias24h();
    }

    setEnviando(false);
  };

  const borrarHistoria = async (id: string) => {
    await supabase.from('historias_barrio').delete().eq('id', id);
    setHistoriaActiva(null);
    await cargarHistorias24h();
  };

  return (
    <View style={styles.contenedor}>
      <View style={styles.filaHeader}>
        <Text style={styles.titulo}>⚡ Historias del Barrio (24h)</Text>
        <Text style={styles.badge24h}>{historias.length} activas</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listaStories}
      >
        {/* Botón + Nueva Historia */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => setModalCrear(true)}
          style={styles.storyItem}
        >
          <View style={styles.aroAgregar3D}>
            <Text style={styles.iconoAgregar}>＋</Text>
          </View>
          <Text style={styles.storyAutor}>tu estado</Text>
        </TouchableOpacity>

        {historias.map((hist, idx) => (
          <BurbujaHistoriaCascada
            key={hist.id}
            historia={hist}
            indice={idx}
            onPress={() => setHistoriaActiva(hist)}
          />
        ))}
      </ScrollView>

      {/* Modal para ver una Historia 24h */}
      <Modal
        visible={historiaActiva !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setHistoriaActiva(null)}
      >
        <View style={styles.modalBackdrop}>
          {historiaActiva && (() => {
            const tema =
              TEMAS_HISTORIA.find((t) => t.id === historiaActiva.categoria) || TEMAS_HISTORIA[0];
            const esMia = historiaActiva.dispositivo_id === dispositivoId;

            return (
              <View
                style={[
                  styles.modalCard3D,
                  { backgroundColor: tema.fondo, borderColor: tema.borde },
                ]}
              >
                <View style={styles.modalHeader}>
                  <View style={styles.modalAutorRow}>
                    <Text style={styles.modalAvatar}>{historiaActiva.avatar_emoji}</Text>
                    <View>
                      <Text style={styles.modalAutorTexto}>
                        {historiaActiva.autor.toLowerCase()}
                      </Text>
                      <Text style={styles.modalTiempo}>
                        {calcularHorasRestantes(historiaActiva.created_at)}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => setHistoriaActiva(null)}
                    style={styles.btnCerrarModal}
                  >
                    <Text style={styles.btnCerrarModalTexto}>✕</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.pillTemaModal}>
                  <Text style={styles.pillTemaModalTexto}>
                    {tema.emoji} {tema.etiqueta} • {nombreBarrio}
                  </Text>
                </View>

                <Text style={styles.mensajeHistoriaGrande}>{historiaActiva.mensaje}</Text>

                {esMia && (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => borrarHistoria(historiaActiva.id)}
                    style={styles.btnBorrarHistoria}
                  >
                    <Text style={styles.btnBorrarHistoriaTexto}>🗑️ Eliminar mi historia</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })()}
        </View>
      </Modal>

      {/* Modal para publicar nueva Historia 24h */}
      <Modal
        visible={modalCrear}
        transparent
        animationType="slide"
        onRequestClose={() => setModalCrear(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCrearCard3D}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalCrearTitulo}>⚡ Historia Rápida 24h (+2 🪙)</Text>
              <TouchableOpacity
                onPress={() => setModalCrear(false)}
                style={styles.btnCerrarModal}
              >
                <Text style={styles.btnCerrarModalTexto}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.labelModal}>¿Qué pasa ahora en {nombreBarrio}?</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filaTemas}
            >
              {TEMAS_HISTORIA.map((t) => {
                const activo = t.id === temaSeleccionado;
                return (
                  <TouchableOpacity
                    key={t.id}
                    activeOpacity={0.85}
                    onPress={() => setTemaSeleccionado(t.id)}
                    style={[
                      styles.chipTema3D,
                      {
                        backgroundColor: activo ? t.fondo : '#FFFFFF',
                        borderColor: activo ? t.borde : '#DCD2F7',
                      },
                    ]}
                  >
                    <Text style={styles.chipTemaTexto}>
                      {t.emoji} {t.etiqueta}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TextInput
              style={styles.inputHistoria3D}
              placeholder="Ej: Tráfico fluido en la avenida principal..."
              placeholderTextColor="#9A91B4"
              value={mensajeNuevo}
              onChangeText={setMensajeNuevo}
              maxLength={140}
              multiline
            />

            <TouchableOpacity
              activeOpacity={0.85}
              disabled={!mensajeNuevo.trim() || enviando}
              onPress={publicarHistoria}
              style={[
                styles.btnPublicarHistoria3D,
                (!mensajeNuevo.trim() || enviando) && { opacity: 0.5 },
              ]}
            >
              <Text style={styles.btnPublicarHistoriaTexto}>
                {enviando ? 'Publicando...' : '🚀 Publicar por 24 horas'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2D9F8',
    borderWidth: 1.5,
    borderBottomWidth: 4,
    borderRadius: 22,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 10,
  },
  filaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titulo: { fontSize: 12.5, fontWeight: '900', color: PastelColors.textoPrincipal },
  badge24h: {
    fontSize: 10.5,
    fontWeight: '800',
    color: PastelColors.textoSecundario,
    backgroundColor: PastelColors.lavanda,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  listaStories: { flexDirection: 'row', gap: 14, paddingVertical: 4 },
  storyItem: { alignItems: 'center', width: 64, gap: 5 },
  aroAgregar3D: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: PastelColors.menta,
    borderColor: PastelColors.mentaBorde,
    borderWidth: 2,
    borderBottomWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconoAgregar: { fontSize: 24, fontWeight: '900', color: PastelColors.textoPrincipal },
  aroExterior3D: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2.2,
    borderBottomWidth: 4.5,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  brilloEspecular: {
    position: 'absolute',
    top: 5,
    left: 11,
    width: 12,
    height: 5,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.8)',
    transform: [{ rotate: '-20deg' }],
  },
  storyAvatar: { fontSize: 25 },
  badgeTemaMini: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeTemaTexto: { fontSize: 10 },
  storyAutor: {
    fontSize: 10.5,
    fontWeight: '800',
    color: PastelColors.textoPrincipal,
    textTransform: 'lowercase',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(45, 36, 74, 0.45)',
    justifyContent: 'center',
    padding: 22,
  },
  modalCard3D: {
    borderRadius: 26,
    borderWidth: 2,
    borderBottomWidth: 6,
    padding: 20,
    gap: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalAutorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  modalAvatar: { fontSize: 30 },
  modalAutorTexto: {
    fontSize: 14,
    fontWeight: '900',
    color: PastelColors.textoPrincipal,
    textTransform: 'lowercase',
  },
  modalTiempo: { fontSize: 11, fontWeight: '800', color: PastelColors.textoSecundario },
  btnCerrarModal: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCerrarModalTexto: { fontSize: 13, fontWeight: '900', color: PastelColors.textoPrincipal },
  pillTemaModal: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pillTemaModalTexto: {
    fontSize: 11,
    fontWeight: '800',
    color: PastelColors.textoPrincipal,
    textTransform: 'lowercase',
  },
  mensajeHistoriaGrande: {
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 25,
    color: PastelColors.textoPrincipal,
    paddingVertical: 6,
  },
  btnBorrarHistoria: {
    alignSelf: 'flex-end',
    backgroundColor: '#FFD6DC',
    borderColor: '#E58A98',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  btnBorrarHistoriaTexto: { fontSize: 11.5, fontWeight: '800', color: '#5E2129' },
  modalCrearCard3D: {
    backgroundColor: '#FFFFFF',
    borderColor: '#B8A4F5',
    borderWidth: 2,
    borderBottomWidth: 6,
    borderRadius: 26,
    padding: 20,
    gap: 14,
  },
  modalCrearTitulo: { fontSize: 15.5, fontWeight: '900', color: PastelColors.textoPrincipal },
  labelModal: { fontSize: 12, fontWeight: '800', color: PastelColors.textoSecundario },
  filaTemas: { flexDirection: 'row', gap: 8 },
  chipTema3D: {
    borderWidth: 1.5,
    borderBottomWidth: 3.5,
    borderRadius: 14,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  chipTemaTexto: {
    fontSize: 11.5,
    fontWeight: '800',
    color: PastelColors.textoPrincipal,
    textTransform: 'lowercase',
  },
  inputHistoria3D: {
    minHeight: 84,
    backgroundColor: '#FAF8FF',
    borderColor: '#B8A4F5',
    borderWidth: 1.5,
    borderBottomWidth: 3.5,
    borderRadius: 16,
    padding: 14,
    fontSize: 14,
    fontWeight: '600',
    color: PastelColors.textoPrincipal,
    textAlignVertical: 'top',
  },
  btnPublicarHistoria3D: {
    backgroundColor: PastelColors.menta,
    borderColor: PastelColors.mentaBorde,
    borderWidth: 1.8,
    borderBottomWidth: 4.5,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnPublicarHistoriaTexto: { fontSize: 14, fontWeight: '900', color: PastelColors.textoPrincipal },
});