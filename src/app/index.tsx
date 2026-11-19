import * as Device from 'expo-device';
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PastelColors } from '@/shared/theme/pastelColors';

export default function HomeScreen() {
  const equipo = Device.deviceName || (Device.isDevice ? 'Dispositivo Móvil' : 'Web');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroSection}>
          <View style={styles.emblemaPastel}>
            <Text style={styles.emblemaEmoji}>🏘️</Text>
          </View>

          <Text style={styles.marca}>QUITaronLUZ</Text>

          <Text style={styles.title}>
            Bienvenidos A ALERTAR, CHATear y MAPear en tu barrio  
          </Text>

          <View style={styles.badgePastel}>
            <Text style={styles.badgeTexto}>
              Solanda · Centro Histórico · La Carolina · {equipo}
            </Text>
          </View>
        </View>

        <View style={styles.centroBotones}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.botonPastel, styles.menta, styles.rotIzq]}
            onPress={() => router.push('/mapa')}
          >
            <View style={styles.punto} />
            <View style={styles.textoWrap}>
              <Text style={styles.btnTitulo}>Mapa y Consenso 3/3</Text>
              <Text style={styles.btnSub}>Luz, agua y vías en los 3 barrios</Text>
            </View>
            <Text style={styles.iconoBtn}>🗺️</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.botonPastel, styles.lavanda, styles.rotDer]}
            onPress={() => router.push('/chat-barrio')}
          >
            <View style={styles.punto} />
            <View style={styles.textoWrap}>
              <Text style={styles.btnTitulo}>Chat por Barrio</Text>
              <Text style={styles.btnSub}>Solanda, Centro y Carolina aislados</Text>
            </View>
            <Text style={styles.iconoBtn}>💬</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.resumenCard}>
          <Text style={styles.resumenTitulo}>Red Vecinal Activa</Text>
          <View style={styles.filaInfo}>
            <Text style={styles.infoItem}>✅ Reportes validados con 3/3 votos</Text>
            <Text style={styles.infoItem}>🔒 Salas de chat independientes por sector</Text>
          </View>
        </View>
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
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 22,
  },
  heroSection: {
    alignItems: 'center',
    gap: 10,
  },
  emblemaPastel: {
    width: 68,
    height: 68,
    borderRadius: 24,
    backgroundColor: PastelColors.durazno,
    borderWidth: 2,
    borderColor: PastelColors.duraznoBorde,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-3deg' }],
  },
  emblemaEmoji: {
    fontSize: 32,
  },
  marca: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: PastelColors.textoSecundario,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    color: PastelColors.textoPrincipal,
    lineHeight: 34,
  },
  badgePastel: {
    backgroundColor: PastelColors.rosa,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: PastelColors.rosaBorde,
  },
  badgeTexto: {
    fontSize: 12,
    color: PastelColors.textoPrincipal,
    fontWeight: '600',
    textAlign: 'center',
  },
  centroBotones: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
  },
  botonPastel: {
    width: '96%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 18,
    borderTopLeftRadius: 34,
    borderBottomRightRadius: 34,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 12,
    borderWidth: 2,
  },
  rotIzq: { transform: [{ rotate: '-1.5deg' }] },
  rotDer: { transform: [{ rotate: '1.5deg' }] },
  menta: { backgroundColor: PastelColors.menta, borderColor: PastelColors.mentaBorde },
  lavanda: { backgroundColor: PastelColors.lavanda, borderColor: PastelColors.lavandaBorde },
  punto: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: PastelColors.textoPrincipal,
    opacity: 0.75,
    marginRight: 12,
  },
  textoWrap: { flex: 1 },
  btnTitulo: { fontSize: 17, fontWeight: '800', color: PastelColors.textoPrincipal },
  btnSub: { fontSize: 12, color: PastelColors.textoSecundario, marginTop: 2 },
  iconoBtn: { fontSize: 24, marginLeft: 8 },
  resumenCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#E5DDF7',
    padding: 16,
    gap: 8,
  },
  resumenTitulo: {
    fontSize: 13,
    fontWeight: '800',
    color: PastelColors.textoPrincipal,
  },
  filaInfo: {
    gap: 4,
  },
  infoItem: {
    fontSize: 12,
    color: PastelColors.textoSecundario,
    fontWeight: '500',
  },
});