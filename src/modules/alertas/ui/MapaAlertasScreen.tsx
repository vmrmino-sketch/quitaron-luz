import { router } from 'expo-router';
import { useVideoPlayer, VideoView as RNVideoView } from 'expo-video';
import React, { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView as RNWebView } from 'react-native-webview';
import { SelectorBarrio, useBarrios } from '@/modules/barrios';
import { PastelColors } from '@/shared/theme/pastelColors';
import { CATEGORIAS_ALERTA } from '../constants/categoriasAlerta';
import { calcularDuracionTexto, ReporteAlerta, useReportes } from '../hooks/useReportes';
import { BarraReaccionesAnimadas } from './BarraReaccionesAnimadas';
import { BotonSOSSilencioso } from './BotonSOSSilencioso';
import { ComentariosAlerta } from './ComentariosAlerta';
import { HistoriasBarrio3D } from './HistoriasBarrio3D';

const WebView = RNWebView as any;
const VideoView = RNVideoView as any;

function ReproductorVideoAlerta({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
  });

  return (
    <VideoView
      player={player}
      style={styles.mediaTarjeta}
      allowsFullscreen
      allowsPictureInPicture
    />
  );
}

export function MapaAlertasScreen() {
  const { barrios, barrioActivo, seleccionarBarrio } = useBarrios();
  const {
    reportes,
    cargando,
    procesando,
    dispositivoId,
    votarSolucionado,
    eliminarReporte,
  } = useReportes(barrioActivo);

  const webViewRef = useRef<any>(null);
  const [puntoSeleccionado, setPuntoSeleccionado] = useState<{ lat: number; lng: number } | null>(null);

  const confirmarEliminacion = (id: string, titulo: string) => {
    Alert.alert(
      'Eliminar avatar del mapa',
      `¿Deseas borrar "${titulo}" del sector?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar',
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

  const manejarVotoSolucion = async (item: ReporteAlerta) => {
    const yaVote = (item.dispositivos_solucion || []).includes(dispositivoId);
    if (yaVote) {
      Alert.alert('Ya votaste', 'Tu confirmación de solución ya está registrada en esta alerta.');
      return;
    }
    const { error } = await votarSolucionado(item);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('✅ ¡Confirmado!', 'Sumaste +3 fichas vecinales por reportar que el problema ya se solucionó.');
    }
  };

  const recentrarMapa = () => {
    setPuntoSeleccionado(null);
    webViewRef.current?.injectJavaScript(`
      if (window.limpiarPinTemporal) window.limpiarPinTemporal();
      if (window.map) {
        window.map.flyTo([${barrioActivo.latitud}, ${barrioActivo.longitud}], 16, { duration: 0.7 });
      }
      true;
    `);
  };

  const manejarMensajeWebView = (event: any) => {
    try {
      const payload = JSON.parse(event.nativeEvent.data);
      if (payload.tipo === 'mapa_tap') {
        setPuntoSeleccionado({ lat: payload.lat, lng: payload.lng });
      } else if (payload.tipo === 'eliminar_reporte') {
        confirmarEliminacion(payload.id, payload.titulo);
      }
    } catch {
      // Ignorar mensajes no JSON
    }
  };

  const abrirReporteEnPunto = () => {
    if (!puntoSeleccionado) return;
    router.push({
      pathname: '/reportar',
      params: {
        lat: String(puntoSeleccionado.lat),
        lng: String(puntoSeleccionado.lng),
      },
    });
  };

  const htmlMapaPastel = useMemo(() => {
    const marcadoresJson = JSON.stringify(
      reportes.map((r) => {
        const verificado =
          r.estado === 'verificado' || r.confirmaciones >= r.umbral_consenso;
        const resuelto = (r.votos_solucion || 0) >= 3 || Boolean(r.resuelto_at);
        const cat = CATEGORIAS_ALERTA[r.tipo] || CATEGORIAS_ALERTA.luz;

        return {
          id: r.id,
          lat: Number(r.latitud) || barrioActivo.latitud,
          lng: Number(r.longitud) || barrioActivo.longitud,
          titulo: r.titulo,
          tipoEtiqueta: `${cat.emoji} ${cat.etiqueta}`,
          emoji: resuelto ? '🎉' : cat.emoji,
          fondo: resuelto ? '#D8F6EE' : cat.fondoPastel,
          borde: resuelto || verificado ? '#2E9E6B' : cat.bordePastel,
          estadoTexto: resuelto
            ? '🎉 Problema Solucionado (3/3)'
            : verificado
            ? `✅ Verificado (${r.confirmaciones}/${r.umbral_consenso})`
            : `⏳ Consenso ${r.confirmaciones}/${r.umbral_consenso}`,
          verificado: verificado || resuelto,
        };
      })
    );

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=yes" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          html, body, #map { width: 100%; height: 100%; background: #F4F0FC; font-family: sans-serif; }
          .leaflet-tile-pane { filter: sepia(18%) hue-rotate(225deg) saturate(135%) brightness(102%) contrast(92%); }
          .leaflet-control-attribution { display: none !important; }

          @keyframes flotar3D {
            0%, 100% { transform: translateY(0px) rotateX(12deg) scale(1); }
            50% { transform: translateY(-9px) rotateX(-8deg) scale(1.08); }
          }
          @keyframes ondaRadar {
            0% { transform: translate(-50%, -50%) scale(0.6); opacity: 0.85; }
            100% { transform: translate(-50%, -50%) scale(2.1); opacity: 0; }
          }
          @keyframes sombraPiso {
            0%, 100% { transform: translateX(-50%) scale(1); opacity: 0.35; }
            50% { transform: translateX(-50%) scale(0.65); opacity: 0.15; }
          }

          .escena-3d {
            position: relative;
            width: 56px;
            height: 62px;
            perspective: 400px;
          }
          .onda-radar {
            position: absolute;
            bottom: 8px;
            left: 50%;
            width: 34px;
            height: 20px;
            border-radius: 50%;
            border: 2.5px solid #8B6CE8;
            animation: ondaRadar 2s infinite ease-out;
          }
          .sombra-suelo {
            position: absolute;
            bottom: 4px;
            left: 50%;
            width: 28px;
            height: 10px;
            border-radius: 50%;
            background: rgba(45, 36, 74, 0.45);
            filter: blur(2px);
            animation: sombraPiso 2.2s infinite ease-in-out;
          }
          .esfera-3d {
            position: absolute;
            top: 2px;
            left: 6px;
            width: 44px;
            height: 44px;
            border-radius: 50% 50% 50% 10%;
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow:
              inset -5px -6px 10px rgba(45, 36, 74, 0.25),
              inset 4px 5px 8px rgba(255, 255, 255, 0.85),
              0 8px 14px rgba(45, 36, 74, 0.32);
            animation: flotar3D 2.2s infinite ease-in-out;
          }
          .esfera-emoji {
            transform: rotate(45deg);
            font-size: 21px;
            filter: drop-shadow(0 2px 2px rgba(0,0,0,0.2));
          }
          .badge-check {
            position: absolute;
            top: -2px;
            right: -2px;
            width: 17px;
            height: 17px;
            border-radius: 50%;
            background: #2E9E6B;
            color: #FFFFFF;
            font-size: 10px;
            font-weight: 900;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid #FFFFFF;
            z-index: 5;
          }
          .leaflet-popup-content-wrapper {
            background: #FAF8FF;
            color: #3D3556;
            border: 1.5px solid #B8A4F5;
            border-radius: 16px;
          }
          .popup-box { padding: 2px; line-height: 1.35; min-width: 145px; }
          .popup-tipo { font-size: 11px; font-weight: 800; color: #6E648B; }
          .popup-titulo { font-size: 13px; font-weight: 800; color: #3D3556; margin: 2px 0; }
          .popup-estado { display: inline-block; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 999px; background: #EAE2FF; margin-bottom: 6px; }
          .btn-popup-borrar {
            display: block;
            width: 100%;
            margin-top: 4px;
            padding: 5px 8px;
            border: 1px solid #E598A3;
            background: #FFD6DC;
            color: #5E2129;
            font-weight: 800;
            font-size: 11px;
            border-radius: 10px;
            cursor: pointer;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          const latCentro = ${barrioActivo.latitud};
          const lngCentro = ${barrioActivo.longitud};
          const reportes = ${marcadoresJson};

          window.map = L.map('map', { zoomControl: true, attributionControl: false }).setView([latCentro, lngCentro], 16);
          L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(window.map);
          L.circle([latCentro, lngCentro], { color: '#9F86EC', weight: 1.5, fillColor: '#EAE2FF', fillOpacity: 0.22, radius: 320 }).addTo(window.map);

          let pinTemporal = null;
          window.limpiarPinTemporal = function() {
            if (pinTemporal) {
              window.map.removeLayer(pinTemporal);
              pinTemporal = null;
            }
          };

          window.map.on('click', function(e) {
            window.limpiarPinTemporal();
            const iconoNuevo = L.divIcon({
              className: '',
              html:
                '<div class="escena-3d">' +
                  '<div class="onda-radar" style="border-color:#2E9E6B;"></div>' +
                  '<div class="sombra-suelo"></div>' +
                  '<div class="esfera-3d" style="background:#D8F6EE; border:3px solid #2E9E6B;">' +
                    '<span class="esfera-emoji">📍</span>' +
                  '</div>' +
                '</div>',
              iconSize: [56, 62],
              iconAnchor: [28, 56]
            });
            pinTemporal = L.marker([e.latlng.lat, e.latlng.lng], { icon: iconoNuevo }).addTo(window.map);
            window.ReactNativeWebView.postMessage(JSON.stringify({
              tipo: 'mapa_tap',
              lat: e.latlng.lat,
              lng: e.latlng.lng
            }));
          });

          window.borrarDesdeMapa = function(id, titulo) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              tipo: 'eliminar_reporte',
              id: id,
              titulo: titulo
            }));
          };

          reportes.forEach((rep, idx) => {
            const mismaCoord = Math.abs(rep.lat - latCentro) < 0.00001 && Math.abs(rep.lng - lngCentro) < 0.00001;
            const posLat = mismaCoord ? rep.lat + (idx * 0.00038) : rep.lat;
            const posLng = mismaCoord ? rep.lng + (idx * 0.00038) : rep.lng;
            const selloVerificado = rep.verificado ? '<div class="badge-check">✓</div>' : '';
            const tituloEscapado = String(rep.titulo).replace(/'/g, "\\'");

            const icono3D = L.divIcon({
              className: '',
              html:
                '<div class="escena-3d">' +
                  '<div class="onda-radar" style="border-color:' + rep.borde + ';"></div>' +
                  '<div class="sombra-suelo"></div>' +
                  selloVerificado +
                  '<div class="esfera-3d" style="background:' + rep.fondo + '; border:3px solid ' + rep.borde + ';">' +
                    '<span class="esfera-emoji">' + rep.emoji + '</span>' +
                  '</div>' +
                '</div>',
              iconSize: [56, 62],
              iconAnchor: [28, 56]
            });

            L.marker([posLat, posLng], { icon: icono3D })
              .addTo(window.map)
              .bindPopup(
                '<div class="popup-box">' +
                  '<div class="popup-tipo">' + rep.tipoEtiqueta + '</div>' +
                  '<div class="popup-titulo">' + rep.titulo + '</div>' +
                  '<div class="popup-estado">' + rep.estadoTexto + '</div>' +
                  '<button class="btn-popup-borrar" onclick="window.borrarDesdeMapa(\\'' + rep.id + '\\', \\'' + tituloEscapado + '\\')">🗑️ Borrar Avatar</button>' +
                '</div>'
              );
          });
        </script>
      </body>
      </html>
    `;
  }, [barrioActivo, reportes]);
return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.seccionHeader}>
          <Text style={styles.subtitulo}>📍 Sector activo en Quito</Text>
          <SelectorBarrio barrios={barrios} barrioActivo={barrioActivo} onSelect={seleccionarBarrio} />
          <HistoriasBarrio3D barrioId={barrioActivo.id} nombreBarrio={barrioActivo.nombre} />
        </View>

        <View style={styles.mapaWrapper}>
          <View style={styles.mapaHeader}>
            <Text style={styles.mapaTitulo}>🗺️ Radar 3D: {barrioActivo.nombre}</Text>
            <TouchableOpacity activeOpacity={0.8} style={styles.btnCentrar} onPress={recentrarMapa}>
              <Text style={styles.btnCentrarTexto}>🎯 Centrar</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.mapaContenedor}>
            <WebView
              ref={webViewRef}
              originWhitelist={['*']}
              source={{ html: htmlMapaPastel }}
              style={styles.mapa}
              scrollEnabled={false}
              nestedScrollEnabled={true}
              onMessage={manejarMensajeWebView}
            />
          </View>

          {puntoSeleccionado ? (
            <View style={styles.barraPinActivo}>
              <Text style={styles.barraPinTexto}>
                📌 Punto elegido ({puntoSeleccionado.lat.toFixed(4)}, {puntoSeleccionado.lng.toFixed(4)})
              </Text>
              <View style={styles.filaPinAcciones}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.btnColocarAvatar}
                  onPress={abrirReporteEnPunto}
                >
                  <Text style={styles.btnColocarAvatarTexto}>✨ Poner Avatar Aquí</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.btnCancelarPin}
                  onPress={recentrarMapa}
                >
                  <Text style={styles.btnCancelarPinTexto}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <Text style={styles.mapaDesc}>
              👆 Toca el mapa para fijar un avatar 3D o toca uno existente para borrarlo
            </Text>
          )}
        </View>

        <View style={styles.grupoAccionesSector}>
          <TouchableOpacity activeOpacity={0.85} style={styles.btnNuevo} onPress={() => router.push('/reportar')}>
            <Text style={styles.btnNuevoTexto}>✨ + Nuevo Reporte en {barrioActivo.nombre}</Text>
          </TouchableOpacity>

          <View style={styles.filaAccesos3D}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.btnAccesoCompacto, { backgroundColor: '#FFF3CD', borderColor: '#F5C96B' }]}
              onPress={() => router.push('/juegos' as any)}
            >
              <Text style={styles.btnAccesoTexto}>🎮 Juegos</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.btnAccesoCompacto, { backgroundColor: '#FFE8D6', borderColor: '#F4BA8C' }]}
              onPress={() => router.push('/eventos' as any)}
            >
              <Text style={styles.btnAccesoTexto}>📅 Eventos</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.filaAccesos3D}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.btnAccesoCompacto, { backgroundColor: '#FFD6DC', borderColor: '#E58A98' }]}
              onPress={() => router.push('/emprende' as any)}
            >
              <Text style={styles.btnAccesoTexto}>🛍️ Emprende</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.btnAccesoCompacto, { backgroundColor: '#DCEEFF', borderColor: '#8BBDF5' }]}
              onPress={() => router.push('/perfil' as any)}
            >
              <Text style={styles.btnAccesoTexto}>🪪 Perfil 3D</Text>
            </TouchableOpacity>
          </View>

          <ComentariosAlerta barrioId={barrioActivo.id} nombreBarrio={barrioActivo.nombre} />
          <BotonSOSSilencioso barrioActivo={barrioActivo} />
        </View>

        <View style={styles.feedHeader}>
          <Text style={styles.seccionTitulo}>Alertas del Sector</Text>
          <View style={styles.pillContador}>
            <Text style={styles.pillContadorTexto}>{reportes.length} activas</Text>
          </View>
        </View>

        {cargando ? (
          <ActivityIndicator size="large" color={PastelColors.textoPrincipal} style={{ marginVertical: 20 }} />
        ) : reportes.length === 0 ? (
          <View style={styles.vacioCard}>
            <Text style={styles.vacioTexto}>No hay reportes activos en {barrioActivo.nombre}.</Text>
          </View>
        ) : (
          <View style={styles.listaReportes}>
            {reportes.map((item: ReporteAlerta) => {
              const verificado = item.estado === 'verificado' || item.confirmaciones >= item.umbral_consenso;
              const votosSol = item.votos_solucion || 0;
              const resuelto = votosSol >= 3 || Boolean(item.resuelto_at);
              const yaVoteSolucion = (item.dispositivos_solucion || []).includes(dispositivoId);
              const duracion = calcularDuracionTexto(item.created_at, item.resuelto_at);
              const cat = CATEGORIAS_ALERTA[item.tipo] || CATEGORIAS_ALERTA.luz;

              return (
                <View
                  key={item.id}
                  style={[
                    styles.reporteCard,
                    {
                      backgroundColor: resuelto || verificado ? PastelColors.menta : cat.fondoPastel,
                      borderColor: resuelto || verificado ? PastelColors.mentaBorde : cat.bordePastel,
                    },
                  ]}
                >
                  <View style={styles.filaSuperior}>
                    <View style={styles.badgeCategoria}>
                      <Text style={styles.tipoBadge}>
                        {cat.emoji} {cat.etiqueta}
                      </Text>
                    </View>

                    <View style={styles.filaDerechaHeader}>
                      <View style={[styles.consensoBadge, verificado ? styles.consensoOk : styles.consensoWait]}>
                        <Text style={styles.consensoTexto}>
                          {resuelto
                            ? '🎉 Resuelto'
                            : verificado
                            ? `✅ ${item.confirmaciones}/${item.umbral_consenso}`
                            : `⏳ ${item.confirmaciones}/${item.umbral_consenso}`}
                        </Text>
                      </View>

                      <TouchableOpacity
                        activeOpacity={0.75}
                        disabled={procesando}
                        style={styles.btnBorrarDiscreto}
                        onPress={() => confirmarEliminacion(item.id, item.titulo)}
                      >
                        <Text style={styles.btnBorrarDiscretoTexto}>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.bloqueContenido}>
                    <Text style={styles.reporteTitulo}>{item.titulo}</Text>
                    {!!item.descripcion && <Text style={styles.reporteDesc}>{item.descripcion}</Text>}
                  </View>

                  {!!item.media_url &&
                    (item.media_type === 'video' ? (
                      <ReproductorVideoAlerta uri={item.media_url} />
                    ) : (
                      <Image source={{ uri: item.media_url }} style={styles.mediaTarjeta} resizeMode="cover" />
                    ))}

                  {resuelto ? (
                    <View style={styles.bannerResuelto3D}>
                      <Text style={styles.bannerResueltoTexto}>
                        🎉 Solucionado por consenso vecinal (3/3){duracion ? ` • Duración: ${duracion}` : ''}
                      </Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      activeOpacity={0.85}
                      disabled={procesando || yaVoteSolucion}
                      onPress={() => manejarVotoSolucion(item)}
                      style={[
                        styles.btnSolucionado3D,
                        yaVoteSolucion && { opacity: 0.75, backgroundColor: '#E2F7E9' },
                      ]}
                    >
                      <Text style={styles.btnSolucionadoTexto}>
                        {yaVoteSolucion
                          ? `✅ Ya confirmaste solución (${votosSol}/3)`
                          : `✅ Ya se solucionó (${votosSol}/3) • +3 🪙`}
                      </Text>
                    </TouchableOpacity>
                  )}

                  <View style={styles.divisorSuave} />

                  <View style={styles.bloqueSocial}>
                    <Text style={styles.labelMicro}>Reacciones vecinales</Text>
                    <BarraReaccionesAnimadas reporteId={item.id} />
                  </View>

                  <ComentariosAlerta reporteId={item.id} />
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PastelColors.fondo },
  scrollContent: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 36, gap: 20 },
  seccionHeader: { gap: 12 },
  subtitulo: { fontSize: 12.5, fontWeight: '800', color: PastelColors.textoSecundario, paddingLeft: 2 },
  mapaWrapper: {
    backgroundColor: PastelColors.lavanda,
    borderColor: PastelColors.lavandaBorde,
    borderWidth: 1.5,
    borderBottomWidth: 4,
    borderRadius: 24,
    padding: 14,
    gap: 12,
  },
  mapaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4 },
  mapaTitulo: { fontSize: 14.5, fontWeight: '900', color: PastelColors.textoPrincipal },
  btnCentrar: {
    backgroundColor: '#FFFFFF',
    borderColor: PastelColors.lavandaBorde,
    borderWidth: 1.5,
    borderBottomWidth: 3,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  btnCentrarTexto: { fontSize: 11.5, fontWeight: '800', color: PastelColors.textoPrincipal },
  mapaContenedor: {
    height: 275,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: PastelColors.lavandaBorde,
    backgroundColor: '#F4F0FC',
  },
  mapa: { flex: 1, backgroundColor: 'transparent' },
  mapaDesc: { fontSize: 11.5, fontWeight: '700', color: PastelColors.textoSecundario, textAlign: 'center', paddingHorizontal: 8 },
  barraPinActivo: {
    backgroundColor: '#FFFFFF',
    borderColor: PastelColors.mentaBorde,
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 12,
    gap: 10,
  },
  barraPinTexto: { fontSize: 12, fontWeight: '800', color: PastelColors.textoPrincipal, textAlign: 'center' },
  filaPinAcciones: { flexDirection: 'row', gap: 10 },
  btnColocarAvatar: {
    flex: 1,
    backgroundColor: PastelColors.menta,
    borderColor: PastelColors.mentaBorde,
    borderWidth: 1.5,
    borderBottomWidth: 3.5,
    borderRadius: 13,
    paddingVertical: 9,
    alignItems: 'center',
  },
  btnColocarAvatarTexto: { fontSize: 13, fontWeight: '800', color: PastelColors.textoPrincipal },
  btnCancelarPin: {
    backgroundColor: '#FFD6DC',
    borderColor: '#E598A3',
    borderWidth: 1.5,
    borderBottomWidth: 3.5,
    borderRadius: 13,
    paddingHorizontal: 15,
    justifyContent: 'center',
  },
  btnCancelarPinTexto: { fontSize: 13, fontWeight: '800', color: '#5E2129' },
  grupoAccionesSector: { gap: 12 },
  btnNuevo: {
    backgroundColor: PastelColors.menta,
    borderColor: PastelColors.mentaBorde,
    borderWidth: 1.8,
    borderBottomWidth: 4.5,
    borderRadius: 20,
    paddingVertical: 15,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  btnNuevoTexto: { fontSize: 14.5, fontWeight: '900', color: PastelColors.textoPrincipal },
  filaAccesos3D: { flexDirection: 'row', gap: 10 },
  btnAccesoCompacto: {
    flex: 1,
    borderWidth: 1.8,
    borderBottomWidth: 4.5,
    borderRadius: 18,
    paddingVertical: 13,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  btnAccesoTexto: { fontSize: 13, fontWeight: '900', color: PastelColors.textoPrincipal },
  feedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingHorizontal: 2,
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
    padding: 26,
    alignItems: 'center',
  },
  vacioTexto: { fontSize: 13.5, color: PastelColors.textoSecundario, textAlign: 'center' },
  listaReportes: { gap: 22 },
  reporteCard: {
    borderRadius: 24,
    borderWidth: 1.5,
    borderBottomWidth: 5,
    padding: 18,
    gap: 14,
    shadowColor: '#3D3556',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  filaSuperior: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  badgeCategoria: {
    backgroundColor: 'rgba(255,255,255,0.75)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tipoBadge: { fontSize: 12, fontWeight: '900', color: PastelColors.textoPrincipal },
  filaDerechaHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  consensoBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  consensoWait: { backgroundColor: 'rgba(255,255,255,0.85)' },
  consensoOk: { backgroundColor: '#FFFFFF' },
  consensoTexto: { fontSize: 11, fontWeight: '800', color: PastelColors.textoPrincipal },
  btnBorrarDiscreto: {
    width: 30,
    height: 30,
    borderRadius: 11,
    backgroundColor: '#FFD6DC',
    borderColor: '#E598A3',
    borderWidth: 1.2,
    borderBottomWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnBorrarDiscretoTexto: { fontSize: 13 },
  bloqueContenido: { gap: 5, paddingHorizontal: 2 },
  reporteTitulo: { fontSize: 17, fontWeight: '900', color: PastelColors.textoPrincipal },
  reporteDesc: { fontSize: 13.5, lineHeight: 19, color: PastelColors.textoSecundario },
  mediaTarjeta: { width: '100%', height: 190, borderRadius: 16, backgroundColor: '#FFFFFF' },
  btnSolucionado3D: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderColor: '#6FD1B8',
    borderWidth: 1.5,
    borderBottomWidth: 3.5,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  btnSolucionadoTexto: { fontSize: 12, fontWeight: '900', color: PastelColors.textoPrincipal },
  bannerResuelto3D: {
    backgroundColor: '#FFFFFF',
    borderColor: '#2E9E6B',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 9,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  bannerResueltoTexto: { fontSize: 12, fontWeight: '900', color: '#1F7A50', textAlign: 'center' },
  divisorSuave: {
    height: 1,
    backgroundColor: 'rgba(61, 53, 86, 0.08)',
    marginVertical: 2,
  },
  bloqueSocial: { gap: 6 },
  labelMicro: {
    fontSize: 10.5,
    fontWeight: '800',
    color: PastelColors.textoSecundario,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingLeft: 2,
  },
}); 