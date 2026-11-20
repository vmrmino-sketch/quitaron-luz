import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
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
import { LISTA_CATEGORIAS, TipoReporte } from '../constants/categoriasAlerta';
import { useReportes } from '../hooks/useReportes';
import { subirEvidenciaMultimedia } from '../services/subirEvidencia';

export function ReportarScreen() {
  const params = useLocalSearchParams<{ lat?: string; lng?: string }>();
  const { barrios, barrioActivo, seleccionarBarrio } = useBarrios();
  const { reportarOConfirmar, procesando } = useReportes(barrioActivo);

  const [tipoSeleccionado, setTipoSeleccionado] = useState<TipoReporte>('luz');
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [subiendoMedia, setSubiendoMedia] = useState(false);

  const latExacta = params.lat ? Number(params.lat) : undefined;
  const lngExacta = params.lng ? Number(params.lng) : undefined;
  const tienePinManual =
    latExacta !== undefined &&
    lngExacta !== undefined &&
    !Number.isNaN(latExacta) &&
    !Number.isNaN(lngExacta);

  const seleccionarDeGaleria = async () => {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert('Permiso requerido', 'Activa el acceso a tu galería para adjuntar fotos o videos.');
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsEditing: true,
      quality: 0.7,
      videoMaxDuration: 15,
    });

    if (!resultado.canceled && resultado.assets.length > 0) {
      const archivo = resultado.assets[0];
      setMediaUri(archivo.uri);
      setMediaType(archivo.type === 'video' ? 'video' : 'image');
    }
  };

  const abrirCamara = async () => {
    const permiso = await ImagePicker.requestCameraPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert('Permiso requerido', 'Activa el acceso a la cámara para capturar evidencia.');
      return;
    }

    const resultado = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images', 'videos'],
      allowsEditing: true,
      quality: 0.7,
      videoMaxDuration: 15,
    });

    if (!resultado.canceled && resultado.assets.length > 0) {
      const archivo = resultado.assets[0];
      setMediaUri(archivo.uri);
      setMediaType(archivo.type === 'video' ? 'video' : 'image');
    }
  };

  const enviarReporte = async () => {
    if (!titulo.trim()) {
      Alert.alert('Falta el título', 'Escribe un título corto para identificar la incidencia.');
      return;
    }

    let urlPublica: string | null = null;

    if (mediaUri && mediaType) {
      setSubiendoMedia(true);
      urlPublica = await subirEvidenciaMultimedia({
        uri: mediaUri,
        tipo: mediaType,
      });
      setSubiendoMedia(false);

      if (!urlPublica) {
        Alert.alert(
          'Aviso de carga',
          'No se pudo subir el archivo multimedia, pero enviaremos tu reporte de texto.'
        );
      }
    }

    const { error } = await reportarOConfirmar({
      barrio: barrioActivo,
      tipo: tipoSeleccionado,
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      latitud: latExacta,
      longitud: lngExacta,
      media_url: urlPublica,
      media_type: urlPublica ? mediaType : null,
    });

    if (error) {
      Alert.alert('Error al reportar', error.message);
      return;
    }

    Alert.alert(
      '¡Avatar 3D colocado en el mapa!',
      'Tu reporte quedó fijado en el sector seleccionado y sumó al consenso vecinal.',
      [{ text: 'Ver en el Mapa', onPress: () => router.back() }]
    );
  };

  const ocupado = procesando || subiendoMedia;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {tienePinManual && (
          <View style={styles.pinBanner}>
            <Text style={styles.pinBannerTitulo}>📍 Ubicación exacta marcada en el mapa</Text>
            <Text style={styles.pinBannerCoords}>
              Lat: {latExacta.toFixed(5)} • Lng: {lngExacta.toFixed(5)}
            </Text>
          </View>
        )}

        <Text style={styles.label}>1. Sector / Barrio:</Text>
        <SelectorBarrio
          barrios={barrios}
          barrioActivo={barrioActivo}
          onSelect={seleccionarBarrio}
        />

        <Text style={styles.label}>2. Elige el avatar 3D del problema:</Text>
        <View style={styles.gridCategorias}>
          {LISTA_CATEGORIAS.map((cat) => {
            const activo = tipoSeleccionado === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                activeOpacity={0.8}
                style={[
                  styles.chipCategoria,
                  {
                    backgroundColor: activo ? cat.fondoPastel : '#FFFFFF',
                    borderColor: activo ? cat.bordePastel : '#E5DDF7',
                    borderWidth: activo ? 2 : 1.5,
                  },
                ]}
                onPress={() => setTipoSeleccionado(cat.id)}
              >
                <Text style={styles.chipEmoji}>{cat.emoji}</Text>
                <Text style={styles.chipTexto}>{cat.etiqueta}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.label}>3. Título de la incidencia:</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: Fuga de agua en la esquina"
          placeholderTextColor="#9A91B4"
          value={titulo}
          onChangeText={setTitulo}
        />

        <Text style={styles.label}>4. Detalles adicionales (opcional):</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe calles de referencia..."
          placeholderTextColor="#9A91B4"
          multiline
          numberOfLines={3}
          value={descripcion}
          onChangeText={setDescripcion}
        />

        <Text style={styles.label}>5. Evidencia visual (Foto o Video corto):</Text>
        <View style={styles.filaBotonesMedia}>
          <TouchableOpacity activeOpacity={0.8} style={styles.btnMedia} onPress={abrirCamara}>
            <Text style={styles.btnMediaTexto}>📸 Cámara</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.btnMedia}
            onPress={seleccionarDeGaleria}
          >
            <Text style={styles.btnMediaTexto}>🖼️ Galería (Foto/Video)</Text>
          </TouchableOpacity>
        </View>

        {mediaUri && (
          <View style={styles.previewBox}>
            {mediaType === 'image' ? (
              <Image source={{ uri: mediaUri }} style={styles.previewImagen} />
            ) : (
              <View style={styles.previewVideoBadge}>
                <Text style={styles.previewVideoTexto}>🎬 Video seleccionado listo para subir</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.btnQuitarMedia}
              onPress={() => {
                setMediaUri(null);
                setMediaType(null);
              }}
            >
              <Text style={styles.btnQuitarMediaTexto}>✕ Quitar archivo</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          activeOpacity={0.85}
          disabled={ocupado}
          style={[styles.btnEnviar, ocupado && { opacity: 0.65 }]}
          onPress={enviarReporte}
        >
          {ocupado ? (
            <ActivityIndicator color={PastelColors.textoPrincipal} />
          ) : (
            <Text style={styles.btnEnviarTexto}>🚀 Colocar Avatar 3D en {barrioActivo.nombre}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PastelColors.fondo },
  scrollContent: { padding: 16, gap: 12 },
  pinBanner: {
    backgroundColor: PastelColors.menta,
    borderColor: PastelColors.mentaBorde,
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 12,
    gap: 2,
  },
  pinBannerTitulo: { fontSize: 13, fontWeight: '800', color: PastelColors.textoPrincipal },
  pinBannerCoords: { fontSize: 11, fontWeight: '700', color: PastelColors.textoSecundario },
  label: { fontSize: 13, fontWeight: '800', color: PastelColors.textoPrincipal, marginTop: 4 },
  gridCategorias: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chipCategoria: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    gap: 6,
  },
  chipEmoji: { fontSize: 16 },
  chipTexto: { fontSize: 12, fontWeight: '800', color: PastelColors.textoPrincipal },
  input: {
    backgroundColor: '#FFFFFF',
    borderColor: PastelColors.lavandaBorde,
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: PastelColors.textoPrincipal,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  filaBotonesMedia: { flexDirection: 'row', gap: 10 },
  btnMedia: {
    flex: 1,
    backgroundColor: PastelColors.lavanda,
    borderColor: PastelColors.lavandaBorde,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnMediaTexto: { fontSize: 13, fontWeight: '800', color: PastelColors.textoPrincipal },
  previewBox: {
    backgroundColor: '#FFFFFF',
    borderColor: PastelColors.lavandaBorde,
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 10,
    gap: 8,
    alignItems: 'center',
  },
  previewImagen: { width: '100%', height: 170, borderRadius: 12 },
  previewVideoBadge: {
    width: '100%',
    paddingVertical: 20,
    backgroundColor: PastelColors.durazno,
    borderRadius: 12,
    alignItems: 'center',
  },
  previewVideoTexto: { fontSize: 13, fontWeight: '800', color: PastelColors.textoPrincipal },
  btnQuitarMedia: {
    alignSelf: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#FFD6DC',
    borderRadius: 10,
  },
  btnQuitarMediaTexto: { fontSize: 11, fontWeight: '800', color: '#5E2129' },
  btnEnviar: {
    marginTop: 8,
    backgroundColor: PastelColors.menta,
    borderColor: PastelColors.mentaBorde,
    borderWidth: 2,
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: 'center',
  },
  btnEnviarTexto: { fontSize: 15, fontWeight: '800', color: PastelColors.textoPrincipal },
});