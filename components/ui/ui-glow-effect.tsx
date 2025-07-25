import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

export const AppGlowView = ({
  children,
  style,
  glowColor = '#00ff22',
  radius = 10,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  glowColor?: string;
  radius?: number;
}) => {
  return (
    <View style={[styles.container, style, {
      shadowColor: glowColor,
      shadowRadius: radius,
      shadowOpacity: 0.9,
      shadowOffset: { width: 0, height: 0 },
      elevation: 10, // Android
    }]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
});
