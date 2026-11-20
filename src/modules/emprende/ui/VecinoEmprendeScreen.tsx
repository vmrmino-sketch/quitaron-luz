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
  AvisoEmprendeItem,
  CATEGORIAS_EMPRENDE,
  CategoriaEmprende,
  LISTA_CATEGORIAS_EMPRENDE,
  useVecinoEmprende,
} from '../hooks/useVecinoEmprende';

function TarjetaAvisoCascada3D({
  aviso,
  indice,
  esMio,
  onBorrar,
}: {
  aviso: AvisoEmprendeItem;
  indice: number;
  esMio: boolean;
  onBorrar: () => void;
}) {
  const dropY = useRef(new Animated.Value(-26)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(Math.min(indice * 80, 500)),
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 230, useNativeDriver: true }),
        Animated.spring(dropY, { toValue: 0, friction: 5.5, tension: 105, useNativeDriver: true }),
      ]),
    ]).start();
  }, [dropY, indice, opacity]);

  const cat = CATEGORIAS_EMPRENDE[aviso.categoria] || CATEGORIAS_EMPRENDE.comida;

  return (
    <Animated.View
      style={[
        styles.avisoCard3D,
        {
          opacity,
          transform: [{ translateY: dropY }],
          backgroundColor: cat.fondo,
          borderColor: cat.borde,
        },
      ]}
    >
      <View style={styles.filaHeaderAviso}>
        <View style={styles.chipCategoria}>
          <Text style={styles.chipCategoriaTexto}>
            {cat.emoji} {cat.etiqueta}
          </Text>
        </View>

        <View style={styles.filaDerHeader}>
          <View style={styles.chipAutor}>
            <Text style={styles.chipAutorTexto}>
              {aviso.avatar_emoji || '🦊'} {esMio ? 'tú' : aviso.autor.toLowerCase()}
            </Text>
          </View>

          {esMio && (
            <TouchableOpacity activeOpacity={0.75} style={styles.btnBorrar} onPress={onBorrar}>
              <Text style={styles.btnBorrarTexto}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Text style={styles.avisoTitulo}>{aviso.titulo}</Text>
      <Text style={styles.avisoDetalle}>{aviso.detalle}</Text>

      <View style={styles.cajaContacto3D}>
        <Text style={styles.contactoLabel}>📞 Contacto / Punto en el barrio:</Text>
        <Text style={styles.contactoValor}>{aviso.contacto}</Text>
      </View>
    </Animated.View>
  );
}

export function VecinoEmprendeScreen() {
  const { barrios, barrioActivo, seleccionarBarrio } = useBarrios();
  const {
    avisos,
    cargando,
    procesando,
    dispositivoId,
    publicarAviso,
    eliminarAviso,
  } = useVecinoEmprende(barrioActivo);

  const [filtroCat, setFiltroCat] = useState<'todas' | CategoriaEmprende>('todas');
  const [formAbierto, setFormAbierto] = useState(false);
  const [categoria, setCategoria] = useState<CategoriaEmprende>('comida');
  const [titulo, setTitulo] = useState('');
  const [detalle, setDetalle] = useState('');
  const [contacto, setContacto] = useState('');

  const guardarAviso = async () => {
    if (!titulo.trim() || !detalle.trim() || !contacto.trim()) {
      Alert.alert('Faltan datos', 'Completa el título, descripción y forma de contacto.');
      return;
    }

    const { error } = await publicarAviso({
      categoria,
      titulo,
      detalle,
      contacto,
    });

    if (error) {
      Alert.alert('Error al publicar', error.message);
    } else {
      setTitulo('');
      setDetalle('');
      setContacto('');
      setFormAbierto(false);
      Alert.alert(
        '🛍️ ¡Aviso Publicado!',
        `Tu anuncio ya está visible en ${barrioActivo.nombre} (+3 🪙).`
      );
    }
  };

  const avisosFiltrados =
    filtroCat === 'todas' ? avisos : avisos.filter((a) => a.categoria === filtroCat);
return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.subtitulo}>🛍️ Economía colaborativa en</Text>
          <SelectorBarrio
            barrios={barrios}
            barrioActivo={barrioActivo}
            onSelect={seleccionarBarrio}
          />
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.btnNuevoAviso3D}
          onPress={() => setFormAbierto((prev) => !prev)}
        >
          <Text style={styles.btnNuevoAvisoTexto}>
            {formAbierto
              ? '✕ Cerrar Formulario'
              : `✨ + Publicar Servicio o Trueque en ${barrioActivo.nombre}`}
          </Text>
        </TouchableOpacity>

        {formAbierto && (
          <View style={styles.formCard3D}>
            <Text style={styles.formTitulo}>🏪 Nuevo Aviso Vecinal (+3 🪙)</Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filaCategorias}
            >
              {LISTA_CATEGORIAS_EMPRENDE.map((cat) => {
                const activa = cat.id === categoria;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    activeOpacity={0.85}
                    onPress={() => setCategoria(cat.id)}
                    style={[
                      styles.chipCat3D,
                      {
                        backgroundColor: activa ? cat.fondo : '#FFFFFF',
                        borderColor: activa ? cat.borde : '#DCD2F7',
                      },
                    ]}
                  >
                    <Text style={styles.chipCatTexto}>
                      {cat.emoji} {cat.etiqueta}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TextInput
              style={styles.input3D}
              placeholder="Título (ej. Almuerzos caseros a domicilio)"
              placeholderTextColor="#9A91B4"
              value={titulo}
              onChangeText={setTitulo}
            />

            <TextInput
              style={[styles.input3D, { height: 76, textAlignVertical: 'top', paddingTop: 10 }]}
              placeholder="Detalle (ej. Sopa, segundo y jugo $2.75 en todo el sector)"
              placeholderTextColor="#9A91B4"
              value={detalle}
              onChangeText={setDetalle}
              multiline
            />

            <TextInput
              style={styles.input3D}
              placeholder="Contacto o dirección (ej. WhatsApp 099... o Calle J)"
              placeholderTextColor="#9A91B4"
              value={contacto}
              onChangeText={setContacto}
            />

            <TouchableOpacity
              activeOpacity={0.85}
              disabled={procesando}
              style={styles.btnPublicar3D}
              onPress={guardarAviso}
            >
              <Text style={styles.btnPublicarTexto}>
                {procesando ? 'Publicando...' : '🚀 Publicar en el Tablón'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filaFiltros}
        >
          <TouchableOpacity
            onPress={() => setFiltroCat('todas')}
            style={[styles.pillFiltro, filtroCat === 'todas' && styles.pillFiltroActivo]}
          >
            <Text style={styles.pillFiltroTexto}>✨ todas ({avisos.length})</Text>
          </TouchableOpacity>

          {LISTA_CATEGORIAS_EMPRENDE.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              onPress={() => setFiltroCat(cat.id)}
              style={[
                styles.pillFiltro,
                filtroCat === cat.id && { backgroundColor: cat.fondo, borderColor: cat.borde },
              ]}
            >
              <Text style={styles.pillFiltroTexto}>
                {cat.emoji} {cat.etiqueta}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {cargando ? (
          <ActivityIndicator size="large" color={PastelColors.textoPrincipal} />
        ) : avisosFiltrados.length === 0 ? (
          <View style={styles.vacioCard}>
            <Text style={styles.vacioTexto}>
              No hay avisos en esta categoría en {barrioActivo.nombre}. ¡Publica el tuyo arriba!
            </Text>
          </View>
        ) : (
          <View style={styles.listaAvisos}>
            {avisosFiltrados.map((av, idx) => (
              <TarjetaAvisoCascada3D
                key={av.id}
                aviso={av}
                indice={idx}
                esMio={av.dispositivo_id === dispositivoId}
                onBorrar={() => eliminarAviso(av.id)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

export default VecinoEmprendeScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PastelColors.fondo },
  scrollContent: { padding: 18, gap: 18, paddingBottom: 36 },
  header: { gap: 8 },
  subtitulo: { fontSize: 12.5, fontWeight: '800', color: PastelColors.textoSecundario },
  btnNuevoAviso3D: {
    backgroundColor: PastelColors.menta,
    borderColor: PastelColors.mentaBorde,
    borderWidth: 1.8,
    borderBottomWidth: 4.5,
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  btnNuevoAvisoTexto: { fontSize: 13.5, fontWeight: '900', color: PastelColors.textoPrincipal },
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
  filaCategorias: { flexDirection: 'row', gap: 8 },
  chipCat3D: {
    borderWidth: 1.5,
    borderBottomWidth: 3.5,
    borderRadius: 14,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  chipCatTexto: {
    fontSize: 11.5,
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
  filaFiltros: { flexDirection: 'row', gap: 8, paddingVertical: 2 },
  pillFiltro: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DCD2F7',
    borderWidth: 1.5,
    borderBottomWidth: 3,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pillFiltroActivo: {
    backgroundColor: PastelColors.lavanda,
    borderColor: PastelColors.lavandaBorde,
  },
  pillFiltroTexto: {
    fontSize: 11.5,
    fontWeight: '800',
    color: PastelColors.textoPrincipal,
    textTransform: 'lowercase',
  },
  vacioCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E5DDF7',
    padding: 24,
    alignItems: 'center',
  },
  vacioTexto: {
    fontSize: 13.5,
    color: PastelColors.textoSecundario,
    textAlign: 'center',
    lineHeight: 20,
  },
  listaAvisos: { gap: 16 },
  avisoCard3D: {
    borderRadius: 24,
    borderWidth: 1.5,
    borderBottomWidth: 5,
    padding: 16,
    gap: 10,
  },
  filaHeaderAviso: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
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
  chipAutor: {
    backgroundColor: 'rgba(255,255,255,0.75)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  chipAutorTexto: {
    fontSize: 10.5,
    fontWeight: '800',
    color: PastelColors.textoPrincipal,
    textTransform: 'lowercase',
  },
  btnBorrar: {
    width: 24,
    height: 24,
    borderRadius: 9,
    backgroundColor: '#FFD6DC',
    borderColor: '#E58A98',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnBorrarTexto: { fontSize: 11, fontWeight: '900', color: '#5E2129' },
  avisoTitulo: { fontSize: 16.5, fontWeight: '900', color: PastelColors.textoPrincipal },
  avisoDetalle: { fontSize: 13.5, lineHeight: 19, color: PastelColors.textoSecundario },
  cajaContacto3D: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 14,
    padding: 10,
    gap: 2,
    marginTop: 2,
  },
  contactoLabel: { fontSize: 10.5, fontWeight: '800', color: PastelColors.textoSecundario },
  contactoValor: { fontSize: 13, fontWeight: '900', color: PastelColors.textoPrincipal },
});