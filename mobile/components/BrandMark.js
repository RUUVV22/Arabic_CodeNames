import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../theme/colors';

const tiles = [colors.red, colors.paper, colors.blue, colors.paper, colors.gold, colors.paper, colors.blue, colors.paper, colors.red];

export function BrandMark({ size = 92 }) {
  const gap = size * 0.055;
  const tileSize = (size - gap * 2) / 3;
  return (
    <View style={[styles.mark, { width: size, height: size, gap, transform: [{ rotate: '-7deg' }] }]}>
      {tiles.map((color, index) => (
        <View
          key={`${color}-${index}`}
          style={[
            styles.tile,
            {
              width: tileSize,
              height: tileSize,
              borderRadius: tileSize * 0.22,
              backgroundColor: color,
              opacity: index === 4 ? 1 : 0.9,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  mark: { flexDirection: 'row', flexWrap: 'wrap' },
  tile: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
});
