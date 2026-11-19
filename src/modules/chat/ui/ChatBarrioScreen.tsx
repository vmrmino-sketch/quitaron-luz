import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SelectorBarrio, useBarrios } from '@/modules/barrios';
import { useChatBarrio } from '../hooks/useChatBarrio';
import { PastelColors } from '@/shared/theme/pastelColors';

export function ChatBarrioScreen() {
  const { barrios, barrioActivo, seleccionarBarrio } = useBarrios();
  const { mensajes, cargando, enviando, enviarMensaje } = useChatBarrio(barrioActivo);
  const [texto, setTexto] = useState('');

  const handleEnviar = async () => {
    const limpio = texto.trim();
    if (!limpio || enviando) return;

    const { error } = await enviarMensaje(limpio);
    if (error) {
      Alert.alert('No se pudo enviar', error.message);
      return;
    }

    setTexto('');
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <View style={styles.header}>
          <Text style={styles.subtitulo}>
            Grupo vecinal activo: {barrioActivo.nombre}
          </Text>
          <SelectorBarrio
            barrios={barrios}
            barrioActivo={barrioActivo}
            onSelect={seleccionarBarrio}
          />
        </View>

        {cargando ? (
          <View style={styles.centro}>
            <ActivityIndicator size="large" color={PastelColors.textoPrincipal} />
          </View>
        ) : (
          <FlatList
            data={mensajes}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.lista}
            ListEmptyComponent={
              <Text style={styles.vacio}>
                Aún no hay mensajes en {barrioActivo.nombre}. ¡Escribe el primero!
              </Text>
            }
            renderItem={({ item }) => (
              <View style={styles.burbuja}>
                <Text style={styles.autor}>{item.autor}</Text>
                <Text style={styles.contenido}>{item.contenido}</Text>
              </View>
            )}
          />
        )}

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder={`Escribe en ${barrioActivo.nombre}...`}
            placeholderTextColor="#8B86A3"
            value={texto}
            onChangeText={setTexto}
            onSubmitEditing={handleEnviar}
          />
          <TouchableOpacity
            activeOpacity={0.85}
            disabled={enviando}
            style={styles.btnEnviar}
            onPress={handleEnviar}
          >
            <Text style={styles.btnTexto}>{enviando ? '...' : 'Enviar'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PastelColors.fondo },
  flex: { flex: 1 },
  header: { padding: 16, paddingBottom: 8, gap: 8 },
  subtitulo: { fontSize: 12, fontWeight: '700', color: PastelColors.textoSecundario },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  lista: { paddingHorizontal: 16, paddingVertical: 8, gap: 10, flexGrow: 1 },
  vacio: {
    textAlign: 'center',
    color: PastelColors.textoSecundario,
    marginTop: 28,
    fontSize: 13,
  },
  burbuja: {
    backgroundColor: PastelColors.lavanda,
    borderColor: PastelColors.lavandaBorde,
    borderWidth: 1.5,
    padding: 12,
    borderRadius: 18,
    gap: 4,
  },
  autor: { fontSize: 11, fontWeight: '800', color: PastelColors.textoSecundario },
  contenido: { fontSize: 14, color: PastelColors.textoPrincipal },
  inputRow: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EAE2FF',
  },
  input: {
    flex: 1,
    backgroundColor: PastelColors.fondo,
    borderWidth: 1.5,
    borderColor: '#DDD5F3',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: PastelColors.textoPrincipal,
  },
  btnEnviar: {
    backgroundColor: PastelColors.menta,
    borderColor: PastelColors.mentaBorde,
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnTexto: { fontSize: 13, fontWeight: '800', color: PastelColors.textoPrincipal },
});