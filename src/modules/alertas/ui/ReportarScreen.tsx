import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SelectorBarrio, useBarrios } from '@/modules/barrios';
import { TipoReporte, useReportes } from '../hooks/useReportes';
import { PastelColors } from '@/shared/theme/pastelColors';

const TIPOS: { id: TipoReporte; label: string; emoji: string }[] = [
  { id: 'luz', label: 'Corte de Luz', emoji: '💡' },
  { id: 'agua', label: 'Sin Agua', emoji: '💧' },
  { id: 'via', label: 'Vía Cerrada', emoji: '🚧' },
];

export function ReportarScreen() {
  const { barrios, barrioActivo, seleccionarBarrio } = useBarrios();
  const { procesando, reportarOConfirmar } = useReportes(barrioActivo);

  const [tipo, setTipo] = useState<TipoReporte>('luz');
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');

  const handleEnviar = async () => {
    const tituloFinal =
      titulo.trim() ||
      `${TIPOS.find((t) => t.id === tipo)?.label} en ${barrioActivo.nombre}`;

    const { data, error } = await reportarOConfirmar({
      barrio: barrioActivo,
      tipo,
      titulo: tituloFinal,
      descripcion: descripcion.trim() || `Reporte ciudadano en ${barrioActivo.nombre}`,
    });

    if (error) {
      Alert.alert('Error al reportar', error.message);
      return;
    }

    Alert.alert(
      'Reporte registrado',
      `Estado actual: ${data?.estado?.toUpperCase()} (${data?.confirmaciones}/${data?.umbral_consenso})`,
      [{ text: 'Ver en mapa', onPress: () => router.back() }]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.label}>1. ¿En qué barrio ocurre?</Text>
        <SelectorBarrio
          barrios={barrios}
          barrioActivo={barrioActivo}
          onSelect={seleccionarBarrio}
        />

        <Text style={styles.label}>2. Tipo de incidencia</Text>
        <View style={styles.filaTipos}>
          {TIPOS.map((item) => {
            const activo = tipo === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.85}
                onPress={() => setTipo(item.id)}
                style={[
                  styles.chipTipo,
                  activo && {
                    backgroundColor: PastelColors.durazno,
                    borderColor: PastelColors.duraznoBorde,
                  },
                ]}
              >
                <Text style={styles.chipTexto}>
                  {item.emoji} {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.label}>3. Título breve</Text>
        <TextInput
          style={styles.input}
          placeholder={`Ej. Sin luz cerca de ${barrioActivo.nombre}`}
          placeholderTextColor="#8B86A3"
          value={titulo}
          onChangeText={setTitulo}
        />

        <Text style={styles.label}>4. Detalle o referencia</Text>
        <TextInput
          style={[styles.input, styles.area]}
          placeholder="Calle principal, intersección o referencia..."
          placeholderTextColor="#8B86A3"
          value={descripcion}
          onChangeText={setDescripcion}
          multiline
        />

        <TouchableOpacity
          activeOpacity={0.85}
          disabled={procesando}
          style={styles.btnEnviar}
          onPress={handleEnviar}
        >
          <Text style={styles.btnEnviarTexto}>
            {procesando ? 'Enviando reporte...' : 'Publicar Reporte en Consenso'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PastelColors.fondo },
  scroll: { padding: 16, gap: 12 },
  label: { fontSize: 13, fontWeight: '700', color: PastelColors.textoPrincipal, marginTop: 4 },
  filaTipos: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chipTipo: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E2DCF2',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
  },
  chipTexto: { fontSize: 13, fontWeight: '700', color: PastelColors.textoPrincipal },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#DDD5F3',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: PastelColors.textoPrincipal,
  },
  area: { minHeight: 80, textAlignVertical: 'top' },
  btnEnviar: {
    marginTop: 10,
    backgroundColor: PastelColors.menta,
    borderColor: PastelColors.mentaBorde,
    borderWidth: 2,
    paddingVertical: 16,
    alignItems: 'center',
    borderTopLeftRadius: 32,
    borderBottomRightRadius: 32,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 10,
    transform: [{ rotate: '-1deg' }],
  },
  btnEnviarTexto: { fontSize: 15, fontWeight: '800', color: PastelColors.textoPrincipal },
});