import React, { useEffect, useRef } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { SelectorBarrio, useBarrios } from '@/modules/barrios';
import { PastelColors } from '@/shared/theme/pastelColors';
import {
  AVATARES_DISPONIBLES,
  COLORES_ESFERA,
  MedallaVecinal,
  usePerfilVecino,
} from '../hooks/usePerfilVecino';

function AvatarSelectorCascada({
  item,
  indice,
  seleccionado,
  fondoEsfera,
  bordeEsfera,
  onPress,
}: {
  item: { emoji: string; nombre: string };
  indice: number;
  seleccionado: boolean;
  fondoEsfera: string;
  bordeEsfera: string;
  onPress: () => void;
}) {
  const dropY = useRef(new Animated.Value(-22)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const popScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(Math.min(indice * 65, 500)),
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(dropY, { toValue: 0, friction: 5, tension: 110, useNativeDriver: true }),
      ]),
    ]).start();
  }, [dropY, indice, opacity]);

  const tocar = () => {
    Animated.sequence([
      Animated.spring(popScale, { toValue: 1.32, friction: 3, tension: 200, useNativeDriver: true }),
      Animated.spring(popScale, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View style={{ opacity, transform: [{ translateY: dropY }] }}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={tocar}
        style={[
          styles.opcionAvatarCard,
          seleccionado && {
            backgroundColor: fondoEsfera,
            borderColor: bordeEsfera,
            borderWidth: 2,
          },
        ]}
      >
        <View style={styles.globoNombreAvatar}>
          <Text style={styles.globoNombreTexto}>{item.nombre}</Text>
        </View>

        <Animated.View
          style={[
            styles.esferaOpcion3D,
            {
              backgroundColor: seleccionado ? fondoEsfera : '#F4F0FC',
              borderColor: seleccionado ? bordeEsfera : '#D6CCF2',
              transform: [{ scale: popScale }],
            },
          ]}
        >
          <View style={styles.brilloMini} />
          <Text style={styles.emojiOpcion}>{item.emoji}</Text>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
}

function TarjetaMedallaCascada({
  medalla,
  indice,
}: {
  medalla: MedallaVecinal;
  indice: number;
}) {
  const dropY = useRef(new Animated.Value(-28)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(150 + indice * 90),
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 240, useNativeDriver: true }),
        Animated.spring(dropY, { toValue: 0, friction: 5.5, tension: 100, useNativeDriver: true }),
      ]),
    ]).start();
  }, [dropY, indice, opacity]);

  return (
    <Animated.View
      style={[
        styles.medallaCard3D,
        {
          opacity,
          transform: [{ translateY: dropY }],
          backgroundColor: medalla.desbloqueada ? medalla.fondo : '#F7F5FC',
          borderColor: medalla.desbloqueada ? medalla.borde : '#DCD2F7',
        },
      ]}
    >
      <View
        style={[
          styles.esferaMedalla3D,
          {
            backgroundColor: medalla.desbloqueada ? '#FFFFFF' : '#ECE8F8',
            borderColor: medalla.desbloqueada ? medalla.borde : '#C9BCF5',
          },
        ]}
      >
        <Text style={[styles.medallaIcono, !medalla.desbloqueada && { opacity: 0.45 }]}>
          {medalla.desbloqueada ? medalla.emoji : '🔒'}
        </Text>
      </View>

      <View style={styles.medallaInfo}>
        <Text style={styles.medallaTitulo}>{medalla.titulo}</Text>
        <Text style={styles.medallaDesc}>{medalla.descripcion}</Text>
      </View>

      <View
        style={[
          styles.badgeProgreso,
          { backgroundColor: medalla.desbloqueada ? '#FFFFFF' : '#EAE2FF' },
        ]}
      >
        <Text style={styles.badgeProgresoTexto}>{medalla.progresoTexto}</Text>
      </View>
    </Animated.View>
  );
}

export function PerfilVecinoScreen() {
  const { barrios, barrioActivo, seleccionarBarrio } = useBarrios();
  const {
    alias,
    setAlias,
    avatarEmoji,
    setAvatarEmoji,
    colorId,
    setColorId,
    fichasBarrio,
    totalFichasGlobal,
    totalComentarios,
    medallas,
    cargando,
    guardando,
    guardarPerfil,
  } = usePerfilVecino(barrioActivo);

  const flotarAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(flotarAnim, {
          toValue: -6,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(flotarAnim, {
          toValue: 0,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [flotarAnim]);

  const colorSeleccionado =
    COLORES_ESFERA.find((c) => c.id === colorId) || COLORES_ESFERA[0];

  const manejarGuardar = async () => {
    const { error } = await guardarPerfil(alias, avatarEmoji);
    if (error) {
      Alert.alert('Error al guardar', error.message);
    } else {
      Alert.alert(
        '✨ ¡Credencial Actualizada!',
        `Tu avatar ${avatarEmoji} y apodo "${alias.toLowerCase()}" ya están listos en ${barrioActivo.nombre}.`
      );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.subtitulo}>📍 Sector de referencia</Text>
          <SelectorBarrio
            barrios={barrios}
            barrioActivo={barrioActivo}
            onSelect={seleccionarBarrio}
          />
        </View>

        {/* Credencial 3D Principal */}
        <View
          style={[
            styles.credencialCard3D,
            {
              backgroundColor: colorSeleccionado.fondo,
              borderColor: colorSeleccionado.borde,
            },
          ]}
        >
          <Animated.View
            style={[
              styles.esferaPrincipal3D,
              {
                backgroundColor: '#FFFFFF',
                borderColor: colorSeleccionado.borde,
                transform: [{ translateY: flotarAnim }],
              },
            ]}
          >
            <View style={styles.brilloPrincipal} />
            <Text style={styles.emojiPrincipal}>{avatarEmoji}</Text>
          </Animated.View>

          <Text style={styles.aliasPrincipal}>{alias.toLowerCase()}</Text>
          <Text style={styles.sectorPrincipal}>vecino activo • {barrioActivo.nombre}</Text>

          <View style={styles.filaStats3D}>
            <View style={styles.statBox}>
              <Text style={styles.statValor}>{fichasBarrio} 🪙</Text>
              <Text style={styles.statLabel}>en {barrioActivo.nombre}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValor}>{totalFichasGlobal} 🏆</Text>
              <Text style={styles.statLabel}>total quito</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValor}>{totalComentarios} 💬</Text>
              <Text style={styles.statLabel}>aportes 3d</Text>
            </View>
          </View>
        </View>

        {/* Personalizador de Avatar y Apodo */}
        <View style={styles.editorCard3D}>
          <Text style={styles.seccionTitulo}>🎨 Personaliza tu Avatar 3D</Text>

          <Text style={styles.labelCampo}>Tu apodo en el barrio</Text>
          <TextInput
            style={styles.inputAlias}
            value={alias}
            onChangeText={setAlias}
            placeholder="Ej: víctor de solanda"
            placeholderTextColor="#9A91B4"
            maxLength={24}
          />

          <Text style={styles.labelCampo}>Color de tu esfera 3D</Text>
          <View style={styles.filaColores}>
            {COLORES_ESFERA.map((col) => {
              const activo = col.id === colorId;
              return (
                <TouchableOpacity
                  key={col.id}
                  activeOpacity={0.8}
                  onPress={() => setColorId(col.id)}
                  style={[
                    styles.circuloColor3D,
                    {
                      backgroundColor: col.fondo,
                      borderColor: col.borde,
                      borderWidth: activo ? 3 : 1.5,
                      transform: [{ scale: activo ? 1.12 : 1 }],
                    },
                  ]}
                />
              );
            })}
          </View>

          <Text style={styles.labelCampo}>Elige tu personaje 3D</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.listaAvatares}
          >
            {AVATARES_DISPONIBLES.map((item, idx) => (
              <AvatarSelectorCascada
                key={item.emoji}
                item={item}
                indice={idx}
                seleccionado={avatarEmoji === item.emoji}
                fondoEsfera={colorSeleccionado.fondo}
                bordeEsfera={colorSeleccionado.borde}
                onPress={() => setAvatarEmoji(item.emoji)}
              />
            ))}
          </ScrollView>

          <TouchableOpacity
            activeOpacity={0.85}
            disabled={guardando}
            style={styles.btnGuardar3D}
            onPress={manejarGuardar}
          >
            <Text style={styles.btnGuardarTexto}>
              {guardando ? 'Guardando...' : '💾 Guardar Credencial 3D'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Vitrina de Medallas */}
        <View style={styles.vitrinaSection}>
          <Text style={styles.seccionTitulo}>🏅 Vitrina de Medallas Vecinales</Text>
          {cargando ? (
            <ActivityIndicator size="small" color={PastelColors.textoPrincipal} />
          ) : (
            <View style={styles.listaMedallas}>
              {medallas.map((med, idx) => (
                <TarjetaMedallaCascada key={med.id} medalla={med} indice={idx} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PastelColors.fondo },
  scrollContent: { padding: 18, gap: 20, paddingBottom: 36 },
  header: { gap: 8 },
  subtitulo: { fontSize: 12.5, fontWeight: '800', color: PastelColors.textoSecundario },
  credencialCard3D: {
    alignItems: 'center',
    borderRadius: 26,
    borderWidth: 2,
    borderBottomWidth: 6,
    padding: 20,
    gap: 8,
  },
  esferaPrincipal3D: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 2.5,
    borderBottomWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 4,
  },
  brilloPrincipal: {
    position: 'absolute',
    top: 8,
    left: 16,
    width: 20,
    height: 9,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.85)',
    transform: [{ rotate: '-20deg' }],
  },
  emojiPrincipal: { fontSize: 38 },
  aliasPrincipal: {
    fontSize: 20,
    fontWeight: '900',
    color: PastelColors.textoPrincipal,
    textTransform: 'lowercase',
  },
  sectorPrincipal: {
    fontSize: 12,
    fontWeight: '800',
    color: PastelColors.textoSecundario,
    textTransform: 'lowercase',
  },
  filaStats3D: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    width: '100%',
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 2,
  },
  statValor: { fontSize: 14, fontWeight: '900', color: PastelColors.textoPrincipal },
  statLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: PastelColors.textoSecundario,
    textTransform: 'lowercase',
  },
  editorCard3D: {
    backgroundColor: '#FFFFFF',
    borderColor: '#C5B6F2',
    borderWidth: 1.5,
    borderBottomWidth: 5,
    borderRadius: 24,
    padding: 16,
    gap: 12,
  },
  seccionTitulo: { fontSize: 15, fontWeight: '900', color: PastelColors.textoPrincipal },
  labelCampo: { fontSize: 11.5, fontWeight: '800', color: PastelColors.textoSecundario },
  inputAlias: {
    height: 44,
    backgroundColor: '#FAF8FF',
    borderColor: '#B8A4F5',
    borderWidth: 1.5,
    borderBottomWidth: 3.5,
    borderRadius: 14,
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '700',
    color: PastelColors.textoPrincipal,
  },
  filaColores: { flexDirection: 'row', gap: 12, paddingVertical: 4 },
  circuloColor3D: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderBottomWidth: 4,
  },
  listaAvatares: { flexDirection: 'row', gap: 10, paddingVertical: 4 },
  opcionAvatarCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E2D9F8',
    borderWidth: 1.2,
    borderBottomWidth: 3.5,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 7,
    gap: 6,
  },
  globoNombreAvatar: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
  },
  globoNombreTexto: {
    fontSize: 9.5,
    fontWeight: '800',
    color: PastelColors.textoPrincipal,
    textTransform: 'lowercase',
  },
  esferaOpcion3D: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderBottomWidth: 3.5,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  brilloMini: {
    position: 'absolute',
    top: 4,
    left: 8,
    width: 10,
    height: 5,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.75)',
    transform: [{ rotate: '-20deg' }],
  },
  emojiOpcion: { fontSize: 19 },
  btnGuardar3D: {
    marginTop: 4,
    backgroundColor: PastelColors.menta,
    borderColor: PastelColors.mentaBorde,
    borderWidth: 1.8,
    borderBottomWidth: 4.5,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnGuardarTexto: { fontSize: 14, fontWeight: '900', color: PastelColors.textoPrincipal },
  vitrinaSection: { gap: 12 },
  listaMedallas: { gap: 12 },
  medallaCard3D: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 20,
    borderWidth: 1.5,
    borderBottomWidth: 4,
    padding: 13,
  },
  esferaMedalla3D: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderBottomWidth: 3.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medallaIcono: { fontSize: 21 },
  medallaInfo: { flex: 1, gap: 2 },
  medallaTitulo: {
    fontSize: 13.5,
    fontWeight: '900',
    color: PastelColors.textoPrincipal,
    textTransform: 'lowercase',
  },
  medallaDesc: { fontSize: 11.5, fontWeight: '600', color: PastelColors.textoSecundario },
  badgeProgreso: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeProgresoTexto: {
    fontSize: 10.5,
    fontWeight: '900',
    color: PastelColors.textoPrincipal,
    textTransform: 'lowercase',
  },
});