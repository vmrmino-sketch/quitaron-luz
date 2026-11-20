import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SelectorBarrio, useBarrios } from '@/modules/barrios';
import { PastelColors } from '@/shared/theme/pastelColors';
import { useFichasVecinales } from '../hooks/useFichasVecinales';

const OBJETIVOS_REFLEJOS = [
  { emoji: '🔥', dice: 'apaga el fuego', puntos: 3, fondo: '#FFD6DC', borde: '#E58A98' },
  { emoji: '🚧', dice: 'despeja vía', puntos: 2, fondo: '#FFE8D6', borde: '#F4BA8C' },
  { emoji: '💧', dice: 'repara fuga', puntos: 2, fondo: '#DCEEFF', borde: '#8BBDF5' },
  { emoji: '🐾', dice: 'rescata mascota', puntos: 4, fondo: '#D8F6EE', borde: '#6FD1B8' },
  { emoji: '💡', dice: 'vuelve la luz', puntos: 2, fondo: '#FFF3CD', borde: '#F5C96B' },
];

const PARES_MEMORIA = ['🏔️', '🚌', '🥨', '⛪', '🦊', '🎸'];

interface CartaMemoria {
  uid: number;
  emoji: string;
  volteada: boolean;
  resuelta: boolean;
}

function generarBaraja(): CartaMemoria[] {
  const duplicadas = [...PARES_MEMORIA, ...PARES_MEMORIA];
  for (let i = duplicadas.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [duplicadas[i], duplicadas[j]] = [duplicadas[j], duplicadas[i]];
  }
  return duplicadas.map((emoji, idx) => ({
    uid: idx,
    emoji,
    volteada: false,
    resuelta: false,
  }));
}

export function SalonJuegosScreen() {
  const { barrios, barrioActivo, seleccionarBarrio } = useBarrios();
  const { misFichas, avatarJugador, rankingBarrios, sumarFichas } =
    useFichasVecinales(barrioActivo);

  const [juegoActivo, setJuegoActivo] = useState<'reflejos' | 'memoria'>('reflejos');

  // --- Estado Minijuego 1: Reflejos 3D ---
  const [jugandoReflejos, setJugandoReflejos] = useState(false);
  const [tiempoRestante, setTiempoRestante] = useState(20);
  const [puntosRonda, setPuntosRonda] = useState(0);
  const [casillaActiva, setCasillaActiva] = useState<number>(4);
  const [objetivoActual, setObjetivoActual] = useState(OBJETIVOS_REFLEJOS[0]);

  const objetivoY = useRef(new Animated.Value(-24)).current;
  const objetivoScale = useRef(new Animated.Value(1)).current;

  // --- Estado Minijuego 2: Memoria Quiteña 3D ---
  const [cartas, setCartas] = useState<CartaMemoria[]>(() => generarBaraja());
  const [seleccionadas, setSeleccionadas] = useState<number[]>([]);
  const [bloqueadoMemoria, setBloqueadoMemoria] = useState(false);

  const animarAparicionObjetivo = useCallback(() => {
    objetivoY.setValue(-26);
    objetivoScale.setValue(0.75);
    Animated.parallel([
      Animated.spring(objetivoY, { toValue: 0, friction: 4.5, tension: 120, useNativeDriver: true }),
      Animated.spring(objetivoScale, { toValue: 1, friction: 4.5, tension: 120, useNativeDriver: true }),
    ]).start();
  }, [objetivoScale, objetivoY]);

  const moverObjetivo = useCallback(() => {
    const nuevaCasilla = Math.floor(Math.random() * 9);
    const nuevoObj = OBJETIVOS_REFLEJOS[Math.floor(Math.random() * OBJETIVOS_REFLEJOS.length)];
    setCasillaActiva(nuevaCasilla);
    setObjetivoActual(nuevoObj);
    animarAparicionObjetivo();
  }, [animarAparicionObjetivo]);

  useEffect(() => {
    if (!jugandoReflejos) return;

    const timerSegundos = setInterval(() => {
      setTiempoRestante((prev) => {
        if (prev <= 1) {
          clearInterval(timerSegundos);
          setJugandoReflejos(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const timerSalto = setInterval(() => {
      moverObjetivo();
    }, 950);

    return () => {
      clearInterval(timerSegundos);
      clearInterval(timerSalto);
    };
  }, [jugandoReflejos, moverObjetivo]);

  // Al terminar la ronda de reflejos, acreditar fichas
  const prevJugandoRef = useRef(false);
  useEffect(() => {
    if (prevJugandoRef.current && !jugandoReflejos && puntosRonda > 0) {
      sumarFichas(puntosRonda);
      Alert.alert(
        '🎉 ¡Ronda completada!',
        `Ganaste +${puntosRonda} fichas vecinales para ${barrioActivo.nombre}.`
      );
    }
    prevJugandoRef.current = jugandoReflejos;
  }, [barrioActivo.nombre, jugandoReflejos, puntosRonda, sumarFichas]);

  const iniciarReflejos = () => {
    setPuntosRonda(0);
    setTiempoRestante(20);
    setJugandoReflejos(true);
    moverObjetivo();
  };

  const tocarCasilla = (idx: number) => {
    if (!jugandoReflejos || idx !== casillaActiva) return;
    setPuntosRonda((p) => p + objetivoActual.puntos);
    moverObjetivo();
  };

  // --- Lógica Minijuego 2: Memoria Quiteña ---
  const tocarCarta = (uid: number) => {
    if (bloqueadoMemoria) return;
    const carta = cartas.find((c) => c.uid === uid);
    if (!carta || carta.volteada || carta.resuelta) return;

    const nuevas = cartas.map((c) => (c.uid === uid ? { ...c, volteada: true } : c));
    const nuevasSel = [...seleccionadas, uid];
    setCartas(nuevas);
    setSeleccionadas(nuevasSel);

    if (nuevasSel.length === 2) {
      setBloqueadoMemoria(true);
      const [idA, idB] = nuevasSel;
      const cA = nuevas.find((c) => c.uid === idA)!;
      const cB = nuevas.find((c) => c.uid === idB)!;

      if (cA.emoji === cB.emoji) {
        setTimeout(async () => {
          const resueltas = nuevas.map((c) =>
            c.uid === idA || c.uid === idB ? { ...c, resuelta: true } : c
          );
          setCartas(resueltas);
          setSeleccionadas([]);
          setBloqueadoMemoria(false);

          if (resueltas.every((c) => c.resuelta)) {
            await sumarFichas(15);
            Alert.alert(
              '🏆 ¡Memoria Quiteña Superada!',
              `Sumaste +15 fichas vecinales para ${barrioActivo.nombre}.`
            );
          }
        }, 350);
      } else {
        setTimeout(() => {
          setCartas(
            nuevas.map((c) =>
              c.uid === idA || c.uid === idB ? { ...c, volteada: false } : c
            )
          );
          setSeleccionadas([]);
          setBloqueadoMemoria(false);
        }, 700);
      }
    }
  };

  const rangoVecino =
    misFichas >= 100
      ? '👑 leyenda del barrio'
      : misFichas >= 40
      ? '⭐ guardián activo'
      : '🌱 vecino explorador';

  const maxFichasRanking = Math.max(...rankingBarrios.map((r) => r.totalFichas), 10);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 1. Selector de sector */}
        <View style={styles.bloqueHeader}>
          <Text style={styles.subtitulo}>🎮 Representando al sector</Text>
          <SelectorBarrio
            barrios={barrios}
            barrioActivo={barrioActivo}
            onSelect={seleccionarBarrio}
          />
        </View>

        {/* 2. Tarjeta 3D de Fichas Vecinales */}
        <View style={styles.fichaCard3D}>
          <View style={styles.esferaJugador3D}>
            <View style={styles.brilloEspecular} />
            <Text style={styles.avatarJugadorTexto}>{avatarJugador}</Text>
          </View>

          <View style={styles.fichaInfo}>
            <View style={styles.chipRango3D}>
              <Text style={styles.chipRangoTexto}>{rangoVecino}</Text>
            </View>
            <Text style={styles.fichaTotalTexto}>{misFichas} fichas vecinales</Text>
            <Text style={styles.fichaSubtexto}>Sector: {barrioActivo.nombre}</Text>
          </View>
        </View>

        {/* 3. Selector de Minijuego 3D */}
        <View style={styles.tabsJuegos}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.tabJuego3D, juegoActivo === 'reflejos' && styles.tabJuegoActivo]}
            onPress={() => setJuegoActivo('reflejos')}
          >
            <Text style={styles.tabJuegoTexto}>⚡ Reflejos 3D</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.tabJuego3D, juegoActivo === 'memoria' && styles.tabJuegoActivo]}
            onPress={() => setJuegoActivo('memoria')}
          >
            <Text style={styles.tabJuegoTexto}>🧠 Memoria Quiteña</Text>
          </TouchableOpacity>
        </View>

        {/* 4. Escenario del Minijuego */}
        {juegoActivo === 'reflejos' ? (
          <View style={styles.arenaCard3D}>
            <View style={styles.arenaHeader}>
              <View style={styles.pillEstado3D}>
                <Text style={styles.pillEstadoTexto}>⏱️ {tiempoRestante}s</Text>
              </View>
              <View style={[styles.pillEstado3D, { backgroundColor: PastelColors.menta }]}>
                <Text style={styles.pillEstadoTexto}>🪙 +{puntosRonda} pts</Text>
              </View>
            </View>

            <View style={styles.gridReflejos}>
              {Array.from({ length: 9 }).map((_, idx) => {
                const esObjetivo = jugandoReflejos && idx === casillaActiva;
                return (
                  <TouchableOpacity
                    key={idx}
                    activeOpacity={0.8}
                    onPress={() => tocarCasilla(idx)}
                    style={[
                      styles.celdaReflejos3D,
                      esObjetivo && {
                        backgroundColor: objetivoActual.fondo,
                        borderColor: objetivoActual.borde,
                      },
                    ]}
                  >
                    {esObjetivo ? (
                      <Animated.View
                        style={[
                          styles.objetivoContenedor,
                          {
                            transform: [
                              { translateY: objetivoY },
                              { scale: objetivoScale },
                            ],
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.globoObjetivoMini,
                            { backgroundColor: '#FFFFFF', borderColor: objetivoActual.borde },
                          ]}
                        >
                          <Text style={styles.globoObjetivoTexto}>{objetivoActual.dice}</Text>
                        </View>
                        <Text style={styles.objetivoEmoji}>{objetivoActual.emoji}</Text>
                      </Animated.View>
                    ) : (
                      <Text style={styles.celdaVaciaDot}>•</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              disabled={jugandoReflejos}
              style={[styles.btnIniciar3D, jugandoReflejos && { opacity: 0.6 }]}
              onPress={iniciarReflejos}
            >
              <Text style={styles.btnIniciarTexto}>
                {jugandoReflejos ? '🔥 ¡Toca los avatares rápido!' : '🚀 Iniciar Reto de 20s'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.arenaCard3D}>
            <View style={styles.arenaHeader}>
              <Text style={styles.memoriaTitulo}>Encuentra los 6 pares (+15 fichas)</Text>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.btnReiniciarMini}
                onPress={() => {
                  setCartas(generarBaraja());
                  setSeleccionadas([]);
                }}
              >
                <Text style={styles.btnReiniciarTexto}>🔄 Nuevo</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.gridMemoria}>
              {cartas.map((carta) => {
                const descubierta = carta.volteada || carta.resuelta;
                return (
                  <TouchableOpacity
                    key={carta.uid}
                    activeOpacity={0.85}
                    onPress={() => tocarCarta(carta.uid)}
                    style={[
                      styles.cartaMemoria3D,
                      descubierta ? styles.cartaDescubierta : styles.cartaOculta,
                      carta.resuelta && styles.cartaResuelta,
                    ]}
                  >
                    <Text style={styles.cartaMemoriaEmoji}>
                      {descubierta ? carta.emoji : '✨'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* 5. Ranking 3D en Vivo por Barrio */}
        <View style={styles.rankingCard3D}>
          <Text style={styles.rankingTitulo}>🏆 Copa Interbarrial Quito (En Vivo)</Text>

          {rankingBarrios.map((item, idx) => {
            const porcentaje = Math.min(
              100,
              Math.max(12, Math.round((item.totalFichas / maxFichasRanking) * 100))
            );
            const medalla = idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉';

            return (
              <View key={item.barrioId} style={styles.filaRanking}>
                <View style={styles.rankingMeta}>
                  <Text style={styles.rankingNombre}>
                    {medalla} {item.nombre}
                  </Text>
                  <Text style={styles.rankingPuntos}>{item.totalFichas} 🪙</Text>
                </View>

                <View style={styles.barraFondo3D}>
                  <View
                    style={[
                      styles.barraRelleno3D,
                      {
                        width: `${porcentaje}%`,
                        backgroundColor:
                          idx === 0 ? PastelColors.menta : PastelColors.lavanda,
                      },
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PastelColors.fondo },
  scrollContent: { padding: 18, gap: 18, paddingBottom: 36 },
  bloqueHeader: { gap: 8 },
  subtitulo: { fontSize: 12.5, fontWeight: '800', color: PastelColors.textoSecundario },
  fichaCard3D: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#FFFFFF',
    borderColor: '#C5B6F2',
    borderWidth: 1.5,
    borderBottomWidth: 5,
    borderRadius: 22,
    padding: 16,
  },
  esferaJugador3D: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: PastelColors.lavanda,
    borderColor: PastelColors.lavandaBorde,
    borderWidth: 2,
    borderBottomWidth: 5,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  brilloEspecular: {
    position: 'absolute',
    top: 6,
    left: 12,
    width: 15,
    height: 7,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.8)',
    transform: [{ rotate: '-20deg' }],
  },
  avatarJugadorTexto: { fontSize: 28 },
  fichaInfo: { flex: 1, gap: 4 },
  chipRango3D: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF3CD',
    borderColor: '#F5C96B',
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 2,
    borderRadius: 999,
  },
  chipRangoTexto: {
    fontSize: 10.5,
    fontWeight: '900',
    color: PastelColors.textoPrincipal,
    textTransform: 'lowercase',
  },
  fichaTotalTexto: { fontSize: 19, fontWeight: '900', color: PastelColors.textoPrincipal },
  fichaSubtexto: { fontSize: 12, fontWeight: '700', color: PastelColors.textoSecundario },
  tabsJuegos: { flexDirection: 'row', gap: 10 },
  tabJuego3D: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderColor: '#D6CCF2',
    borderWidth: 1.5,
    borderBottomWidth: 4,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabJuegoActivo: {
    backgroundColor: PastelColors.lavanda,
    borderColor: '#9F86EC',
  },
  tabJuegoTexto: { fontSize: 13, fontWeight: '900', color: PastelColors.textoPrincipal },
  arenaCard3D: {
    backgroundColor: '#FAF8FF',
    borderColor: '#C5B6F2',
    borderWidth: 1.5,
    borderBottomWidth: 5,
    borderRadius: 24,
    padding: 16,
    gap: 14,
  },
  arenaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pillEstado3D: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D6CCF2',
    borderWidth: 1.5,
    borderBottomWidth: 3,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  pillEstadoTexto: { fontSize: 12.5, fontWeight: '900', color: PastelColors.textoPrincipal },
  gridReflejos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  celdaReflejos3D: {
    width: '30.5%',
    height: 86,
    backgroundColor: '#FFFFFF',
    borderColor: '#E2D9F8',
    borderWidth: 1.5,
    borderBottomWidth: 4,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  celdaVaciaDot: { fontSize: 18, color: '#D6CCF2', fontWeight: '900' },
  objetivoContenedor: { alignItems: 'center', gap: 3 },
  globoObjetivoMini: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 999,
    borderWidth: 1,
  },
  globoObjetivoTexto: {
    fontSize: 8.5,
    fontWeight: '800',
    color: PastelColors.textoPrincipal,
    textTransform: 'lowercase',
  },
  objetivoEmoji: { fontSize: 28 },
  btnIniciar3D: {
    backgroundColor: PastelColors.menta,
    borderColor: PastelColors.mentaBorde,
    borderWidth: 1.8,
    borderBottomWidth: 4.5,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnIniciarTexto: { fontSize: 14, fontWeight: '900', color: PastelColors.textoPrincipal },
  memoriaTitulo: { fontSize: 12.5, fontWeight: '800', color: PastelColors.textoPrincipal },
  btnReiniciarMini: {
    backgroundColor: '#FFFFFF',
    borderColor: '#C5B6F2',
    borderWidth: 1.2,
    borderBottomWidth: 2.5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  btnReiniciarTexto: { fontSize: 11, fontWeight: '800', color: PastelColors.textoPrincipal },
  gridMemoria: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  cartaMemoria3D: {
    width: '22.5%',
    height: 68,
    borderRadius: 16,
    borderWidth: 1.5,
    borderBottomWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartaOculta: {
    backgroundColor: PastelColors.lavanda,
    borderColor: PastelColors.lavandaBorde,
  },
  cartaDescubierta: {
    backgroundColor: '#FFFFFF',
    borderColor: '#9F86EC',
  },
  cartaResuelta: {
    backgroundColor: PastelColors.menta,
    borderColor: PastelColors.mentaBorde,
  },
  cartaMemoriaEmoji: { fontSize: 24 },
  rankingCard3D: {
    backgroundColor: '#FFFFFF',
    borderColor: '#C5B6F2',
    borderWidth: 1.5,
    borderBottomWidth: 5,
    borderRadius: 22,
    padding: 16,
    gap: 12,
  },
  rankingTitulo: { fontSize: 14.5, fontWeight: '900', color: PastelColors.textoPrincipal },
  filaRanking: { gap: 5 },
  rankingMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rankingNombre: { fontSize: 13, fontWeight: '800', color: PastelColors.textoPrincipal },
  rankingPuntos: { fontSize: 12.5, fontWeight: '900', color: PastelColors.textoPrincipal },
  barraFondo3D: {
    height: 12,
    backgroundColor: '#F4F0FC',
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2D9F8',
  },
  barraRelleno3D: {
    height: '100%',
    borderRadius: 999,
  },
});