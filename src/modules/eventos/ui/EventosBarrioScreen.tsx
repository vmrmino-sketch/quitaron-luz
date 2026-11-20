import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SelectorBarrio, useBarrios } from '@/modules/barrios';
import { PastelColors } from '@/shared/theme/pastelColors';
import {
  CATEGORIAS_EVENTO,
  CategoriaEvento,
  EventoBarrioItem,
  LISTA_CATEGORIAS_EVENTO,
  useEventosBarrio,
} from '../hooks/useEventosBarrio';

function TarjetaEventoCascada3D({
  evento,
  indice,
  esMio,
  onAsistir,
  onBorrar,
}: {
  evento: EventoBarrioItem;
  indice: number;
  esMio: boolean;
  onAsistir: () => void;
  onBorrar: () => void;
}) {
  const dropY = useRef(new Animated.Value(-28)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const popScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(Math.min(indice * 85, 500)),
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 240, useNativeDriver: true }),
        Animated.spring(dropY, { toValue: 0, friction: 5.5, tension: 105, useNativeDriver: true }),
      ]),
    ]).start();
  }, [dropY, indice, opacity]);

  const cat = CATEGORIAS_EVENTO[evento.categoria] || CATEGORIAS_EVENTO.minga;

  const manejarToqueAsistencia = () => {
    Animated.sequence([
      Animated.spring(popScale, { toValue: 1.15, friction: 3, tension: 180, useNativeDriver: true }),
      Animated.spring(popScale, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
    onAsistir();
  };

  return (
    <Animated.View
      style={[
        styles.eventoCard3D,
        {
          opacity,
          transform: [{ translateY: dropY }],
          backgroundColor: cat.fondo,
          borderColor: cat.borde,
        },
      ]}
    >
      <View style={styles.filaHeaderEvento}>
        <View style={styles.chipCategoria}>
          <Text style={styles.chipCategoriaTexto}>
            {cat.emoji} {cat.etiqueta}
          </Text>
        </View>

        <View style={styles.filaDerHeader}>
          <View style={styles.chipOrganizador}>
            <Text style={styles.chipOrganizadorTexto}>
              {esMio ? '✨ tú' : `👤 ${evento.organizador}`}
            </Text>
          </View>

          {esMio && (
            <TouchableOpacity
              activeOpacity={0.75}
              style={styles.btnBorrarEvento}
              onPress={onBorrar}
            >
              <Text style={styles.btnBorrarEventoTexto}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Text style={styles.eventoTitulo}>{evento.titulo}</Text>

      <View style={styles.cajaDetalles3D}>
        <Text style={styles.detalleTexto}>📍 {evento.lugar}</Text>
        <Text style={styles.detalleTexto}>🕒 {evento.fecha_hora}</Text>
      </View>

      <View style={styles.filaFooterEvento}>
        <View style={styles.contadorAsistentes}>
          <Text style={styles.contadorTexto}>
            👥 {evento.totalAsistentes}{' '}
            {evento.totalAsistentes === 1 ? 'vecino confirmado' : 'vecinos confirmados'}
          </Text>
        </View>

        <Animated.View style={{ transform: [{ scale: popScale }] }}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={manejarToqueAsistencia}
            style={[
              styles.btnAsistir3D,
              evento.yoAsisto ? styles.btnAsistirActivo : styles.btnAsistirPendiente,
            ]}
          >
            <Text style={styles.btnAsistirTexto}>
              {evento.yoAsisto ? '✅ Asistiré' : '🙋 Voy a asistir (+2 🪙)'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

export function EventosBarrioScreen() {
  const { barrios, barrioActivo, seleccionarBarrio } = useBarrios();
  const {
    eventos,
    cargando,
    procesando,
    dispositivoId,
    crearEvento,
    alternarAsistencia,
    eliminarEvento,
  } = useEventosBarrio(barrioActivo);

  const [formularioAbierto, setFormularioAbierto] = useState(false);
  const [categoria, setCategoria] = useState<CategoriaEvento>('minga');
  const [titulo, setTitulo] = useState('');
  const [lugar, setLugar] = useState('');
  const [fechaHora, setFechaHora] = useState('');

  const publicarEncuentro = async () => {
    if (!titulo.trim() || !lugar.trim() || !fechaHora.trim()) {
      Alert.alert('Faltan datos', 'Completa el título, lugar y fecha/hora del encuentro.');
      return;
    }

    const { error } = await crearEvento({
      categoria,
      titulo,
      lugar,
      fechaHora,
    });

    if (error) {
      Alert.alert('No se pudo publicar', error.message);
    } else {
      setTitulo('');
      setLugar('');
      setFechaHora('');
      setFormularioAbierto(false);
      Alert.alert(
        '🎉 ¡Encuentro Publicado!',
        `Tu evento ya está en la agenda de ${barrioActivo.nombre} (+3 🪙).`
      );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.subtitulo}>📍 Agenda comunitaria en</Text>
          <SelectorBarrio
            barrios={barrios}
            barrioActivo={barrioActivo}
            onSelect={seleccionarBarrio}
          />
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.btnAbrirForm3D}
          onPress={() => setFormularioAbierto((prev) => !prev)}
        >
          <Text style={styles.btnAbrirFormTexto}>
            {formularioAbierto ? '✕ Cerrar Formulario' : `📅 + Organizar Encuentro en ${barrioActivo.nombre}`}
          </Text>
        </TouchableOpacity>

        {formularioAbierto && (
          <View style={styles.formCard3D}>
            <Text style={styles.formTitulo}>✨ Nuevo Encuentro Vecinal (+3 🪙)</Text>

            <Text style={styles.labelCampo}>Tipo de actividad</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filaCategorias}
            >
              {LISTA_CATEGORIAS_EVENTO.map((cat) => {
                const activa = cat.id === categoria;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    activeOpacity={0.85}
                    onPress={() => setCategoria(cat.id)}
                    style={[
                      styles.chipCatSelector,
                      {
                        backgroundColor: activa ? cat.fondo : '#FFFFFF',
                        borderColor: activa ? cat.borde : '#DCD2F7',
                      },
                    ]}
                  >
                    <Text style={styles.chipCatSelectorTexto}>
                      {cat.emoji} {cat.etiqueta}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TextInput
              style={styles.input3D}
              placeholder="Título (ej. Minga limpieza parque central)"
              placeholderTextColor="#9A91B4"
              value={titulo}
              onChangeText={setTitulo}
            />

            <TextInput
              style={styles.input3D}
              placeholder="Lugar de encuentro (ej. Cancha sintética)"
              placeholderTextColor="#9A91B4"
              value={lugar}
              onChangeText={setLugar}
            />

            <TextInput
              style={styles.input3D}
              placeholder="Fecha y hora (ej. Sábado 09:00 AM)"
              placeholderTextColor="#9A91B4"
              value={fechaHora}
              onChangeText={setFechaHora}
            />

            <TouchableOpacity
              activeOpacity={0.85}
              disabled={procesando}
              style={styles.btnPublicar3D}
              onPress={publicarEncuentro}
            >
              <Text style={styles.btnPublicarTexto}>
                {procesando ? 'Publicando...' : '🚀 Publicar en la Agenda'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.feedHeader}>
          <Text style={styles.seccionTitulo}>Próximos Encuentros</Text>
          <View style={styles.pillContador}>
            <Text style={styles.pillContadorTexto}>{eventos.length} eventos</Text>
          </View>
        </View>

        {cargando ? (
          <ActivityIndicator size="large" color={PastelColors.textoPrincipal} />
        ) : eventos.length === 0 ? (
          <View style={styles.vacioCard}>
            <Text style={styles.vacioTexto}>
              Aún no hay encuentros programados en {barrioActivo.nombre}. ¡Organiza el primero arriba!
            </Text>
          </View>
        ) : (
          <View style={styles.listaEventos}>
            {eventos.map((ev, idx) => (
              <TarjetaEventoCascada3D
                key={ev.id}
                evento={ev}
                indice={idx}
                esMio={ev.dispositivo_id === dispositivoId}
                onAsistir={() => alternarAsistencia(ev)}
                onBorrar={() => eliminarEvento(ev.id)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PastelColors.fondo },
  scrollContent: { padding: 18, gap: 18, paddingBottom: 36 },
  header: { gap: 8 },
  subtitulo: { fontSize: 12.5, fontWeight: '800', color: PastelColors.textoSecundario },
  btnAbrirForm3D: {
    backgroundColor: PastelColors.menta,
    borderColor: PastelColors.mentaBorde,
    borderWidth: 1.8,
    borderBottomWidth: 4.5,
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  btnAbrirFormTexto: { fontSize: 14, fontWeight: '900', color: PastelColors.textoPrincipal },
  formCard3D: {
    backgroundColor: '#FFFFFF',
    borderColor: '#C5B6F2',
    borderWidth: 1.5,
    borderBottomWidth: 5,
    borderRadius: 24,
    padding: 16,
    gap: 12,
  },
  formTitulo: { fontSize: 15, fontWeight: '900', color: PastelColors.textoPrincipal },
  labelCampo: { fontSize: 11.5, fontWeight: '800', color: PastelColors.textoSecundario },
  filaCategorias: { flexDirection: 'row', gap: 8, paddingVertical: 2 },
  chipCatSelector: {
    borderWidth: 1.5,
    borderBottomWidth: 3.5,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipCatSelectorTexto: {
    fontSize: 12,
    fontWeight: '800',
    color: PastelColors.textoPrincipal,
    textTransform: 'lowercase',
  },
  input3D: {
    height: 44,
    backgroundColor: '#FAF8FF',
    borderColor: '#B8A4F5',
    borderWidth: 1.5,
    borderBottomWidth: 3.5,
    borderRadius: 14,
    paddingHorizontal: 14,
    fontSize: 13.5,
    fontWeight: '600',
    color: PastelColors.textoPrincipal,
  },
  btnPublicar3D: {
    backgroundColor: PastelColors.lavanda,
    borderColor: PastelColors.lavandaBorde,
    borderWidth: 1.8,
    borderBottomWidth: 4.5,
    borderRadius: 16,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 4,
  },
  btnPublicarTexto: { fontSize: 14, fontWeight: '900', color: PastelColors.textoPrincipal },
  feedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  seccionTitulo: { fontSize: 16, fontWeight: '900', color: PastelColors.textoPrincipal },
  pillContador: {
    backgroundColor: PastelColors.lavanda,
    borderColor: PastelColors.lavandaBorde,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  pillContadorTexto: { fontSize: 11, fontWeight: '800', color: PastelColors.textoPrincipal },
  vacioCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E5DDF7',
    padding: 24,
    alignItems: 'center',
  },
  vacioTexto: { fontSize: 13.5, color: PastelColors.textoSecundario, textAlign: 'center', lineHeight: 20 },
  listaEventos: { gap: 18 },
  eventoCard3D: {
    borderRadius: 24,
    borderWidth: 1.5,
    borderBottomWidth: 5,
    padding: 16,
    gap: 12,
  },
  filaHeaderEvento: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chipCategoria: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  chipCategoriaTexto: {
    fontSize: 11.5,
    fontWeight: '900',
    color: PastelColors.textoPrincipal,
    textTransform: 'lowercase',
  },
  filaDerHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chipOrganizador: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  chipOrganizadorTexto: {
    fontSize: 10.5,
    fontWeight: '800',
    color: PastelColors.textoPrincipal,
    textTransform: 'lowercase',
  },
  btnBorrarEvento: {
    width: 24,
    height: 24,
    borderRadius: 9,
    backgroundColor: '#FFD6DC',
    borderColor: '#E58A98',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnBorrarEventoTexto: { fontSize: 11, fontWeight: '900', color: '#5E2129' },
  eventoTitulo: { fontSize: 17, fontWeight: '900', color: PastelColors.textoPrincipal },
  cajaDetalles3D: {
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderRadius: 14,
    padding: 10,
    gap: 4,
  },
  detalleTexto: { fontSize: 12.5, fontWeight: '700', color: PastelColors.textoPrincipal },
  filaFooterEvento: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  contadorAsistentes: { flex: 1 },
  contadorTexto: { fontSize: 11.5, fontWeight: '800', color: PastelColors.textoPrincipal },
  btnAsistir3D: {
    borderWidth: 1.5,
    borderBottomWidth: 3.5,
    borderRadius: 14,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  btnAsistirPendiente: {
    backgroundColor: '#FFFFFF',
    borderColor: '#B8A4F5',
  },
  btnAsistirActivo: {
    backgroundColor: '#C8F2E3',
    borderColor: '#2E9E6B',
  },
  btnAsistirTexto: { fontSize: 12, fontWeight: '900', color: PastelColors.textoPrincipal },
});