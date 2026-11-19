import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { BarrioBase } from '@/core/constants/barrios.constants';
import { PastelColors } from '@/shared/theme/pastelColors';

interface Props {
  barrios: BarrioBase[];
  barrioActivo: BarrioBase;
  onSelect: (barrio: BarrioBase) => void;
}

export function SelectorBarrio({ barrios, barrioActivo, onSelect }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.fila}
    >
      {barrios.map((b, idx) => {
        const activo = b.id === barrioActivo.id;
        return (
          <TouchableOpacity
            key={b.id}
            activeOpacity={0.85}
            onPress={() => onSelect(b)}
            style={[
              styles.capsula,
              {
                backgroundColor: activo ? b.colorPastel : PastelColors.tarjeta,
                borderColor: activo ? b.bordePastel : '#E2DCF2',
                transform: [{ rotate: idx % 2 === 0 ? '-1.5deg' : '1.5deg' }],
              },
            ]}
          >
            <Text style={styles.nombre}>{b.nombre}</Text>
            <Text style={styles.sector}>{b.sector}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fila: {
    gap: 10,
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  capsula: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderTopLeftRadius: 24,
    borderBottomRightRadius: 24,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
    borderWidth: 2,
  },
  nombre: {
    fontSize: 14,
    fontWeight: '700',
    color: PastelColors.textoPrincipal,
  },
  sector: {
    fontSize: 11,
    color: PastelColors.textoSecundario,
  },
});