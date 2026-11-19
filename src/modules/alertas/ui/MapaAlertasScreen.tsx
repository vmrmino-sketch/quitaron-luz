import { router } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SelectorBarrio, useBarrios } from '@/modules/barrios';
import { PastelColors } from '@/shared/theme/pastelColors';
import { ReporteAlerta, useReportes } from '../hooks/useReportes';

const ETIQUETAS_TIPO: Record<string, string> = {
  luz: '💡 Corte de Luz',
  agua: '💧 Sin Agua',
  via: '🚧 Vía Cerrada',
};

export function MapaAlertasScreen() {
  const { barrios, barrioActivo, seleccionarBarrio } = useBarrios();
  const { reportes, cargando, procesando, eliminarReporte } = useReportes(barrioActivo);

  const confirmarEliminacion = (id: string, titulo: string) => {
    Alert.alert(
      'Eliminar reporte',
      `¿Deseas eliminar "${titulo}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const { error } = await eliminarReporte(id);
            if (error) {
              Alert.alert('Error al eliminar', error.message);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.subtitulo}>Sector seleccionado en Quito:</Text>
          <SelectorBarrio
            barrios={barrios}
            barrioActivo={barrioActivo}
            onSelect={seleccionarBarrio}
          />
        </View>

        <View style={styles.mapaCard}>
          <Text style={styles.mapaTitulo}>📍 Zona: {barrioActivo.nombre}</Text>
          <Text style={styles.mapaCoords}>
            Coordenadas: {barrioActivo.latitud.toFixed(4)}, {barrioActivo.longitud.toFixed(4)}
          </Text>
          <Text style={styles.mapaDesc}>
            Los reportes alcanzan estado verificado al reunir 3 confirmaciones vecinales.
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.btnNuevo}
          onPress={() => router.push('/reportar')}
        >
          <Text style={styles.btnNuevoTexto}>+ Nuevo Reporte o Confirmar Incidencia</Text>
        </TouchableOpacity>

        <Text style={styles.seccionTitulo}>
          Alertas en {barrioActivo.nombre} ({reportes.length})
        </Text>

        {cargando ? (
          <ActivityIndicator size="large" color={PastelColors.textoPrincipal} />
        ) : reportes.length === 0 ? (
          <View style={styles.vacioCard}>
            <Text style={styles.vacioTexto}>
              No hay reportes activos en {barrioActivo.nombre}.
            </Text>
          </View>
        ) : (
          reportes.map((item: ReporteAlerta) => {
            const verificado =
              item.estado === 'verificado' || item.confirmaciones >= item.umbral_consenso;

            return (
              <View
                key={item.id}
                style={[
                  styles.reporteCard,
                  verificado ? styles.cardVerificada : styles.cardPendiente,
                ]}
              >
                <View style={styles.filaSuperior}>
                  <Text style={styles.tipoBadge}>
                    {ETIQUETAS_TIPO[item.tipo] || item.tipo}
                  </Text>
                  <View
                    style={[
                      styles.consensoBadge,
                      verificado ? styles.consensoOk : styles.consensoWait,
                    ]}
                  >
                    <Text style={styles.consensoTexto}>
                      {verificado
                        ? `✅ Verificado (${item.confirmaciones}/${item.umbral_consenso})`
                        : `⏳ Consenso ${item.confirmaciones}/${item.umbral_consenso}`}
                    </Text>
                  </View>
                </View>

                <Text style={styles.reporteTitulo}>{item.titulo}</Text>

                {!!item.descripcion && (
                  <Text style={styles.reporteDesc}>{item.descripcion}</Text>
                )}

                <TouchableOpacity
                  activeOpacity={0.8}
                  disabled={procesando}
                  style={styles.btnEliminar}
                  onPress={() => confirmarEliminacion(item.id, item.titulo)}
                >
                  <Text style={styles.btnEliminarTexto}>🗑️ Eliminar</Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PastelColors.fondo,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  header: {
    gap: 8,
  },
  subtitulo: {
    fontSize: 12,
    fontWeight: '700',
    color: PastelColors.textoSecundario,
  },
  mapaCard: {
    backgroundColor: PastelColors.lavanda,
    borderColor: PastelColors.lavandaBorde,
    borderWidth: 1.5,
    borderRadius: 22,
    padding: 16,
    gap: 4,
  },
  mapaTitulo: {
    fontSize: 16,
    fontWeight: '800',
    color: PastelColors.textoPrincipal,
  },
  mapaCoords: {
    fontSize: 12,
    fontWeight: '600',
    color: PastelColors.textoSecundario,
  },
  mapaDesc: {
    fontSize: 12,
    color: PastelColors.textoSecundario,
    marginTop: 4,
  },
  btnNuevo: {
    backgroundColor: PastelColors.menta,
    borderColor: PastelColors.mentaBorde,
    borderWidth: 2,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  btnNuevoTexto: {
    fontSize: 14,
    fontWeight: '800',
    color: PastelColors.textoPrincipal,
  },
  seccionTitulo: {
    fontSize: 14,
    fontWeight: '800',
    color: PastelColors.textoPrincipal,
    marginTop: 4,
  },
  vacioCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E5DDF7',
    padding: 20,
    alignItems: 'center',
  },
  vacioTexto: {
    fontSize: 13,
    color: PastelColors.textoSecundario,
    textAlign: 'center',
  },
  reporteCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 14,
    gap: 6,
  },
  cardPendiente: {
    backgroundColor: PastelColors.durazno,
    borderColor: PastelColors.duraznoBorde,
  },
  cardVerificada: {
    backgroundColor: PastelColors.menta,
    borderColor: PastelColors.mentaBorde,
  },
  filaSuperior: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  tipoBadge: {
    fontSize: 12,
    fontWeight: '800',
    color: PastelColors.textoPrincipal,
  },
  consensoBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  consensoWait: {
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  consensoOk: {
    backgroundColor: '#FFFFFF',
  },
  consensoTexto: {
    fontSize: 11,
    fontWeight: '800',
    color: PastelColors.textoPrincipal,
  },
  reporteTitulo: {
    fontSize: 16,
    fontWeight: '800',
    color: PastelColors.textoPrincipal,
  },
  reporteDesc: {
    fontSize: 13,
    color: PastelColors.textoSecundario,
  },
  btnEliminar: {
    marginTop: 8,
    alignSelf: 'flex-end',
    backgroundColor: '#FFD6DC',
    borderColor: '#E598A3',
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  btnEliminarTexto: {
    fontSize: 12,
    fontWeight: '800',
    color: '#5E2129',
  },
});