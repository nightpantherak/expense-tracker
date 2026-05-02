import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function AnimatedProgress({ percent = 0, colors = ['#22D3EE', '#3B82F6'], height = 12 }) {
  const widthAnim = useRef(new Animated.Value(0)).current;
  const target = Math.max(0, Math.min(100, percent));

  useEffect(() => {
    Animated.timing(widthAnim, { toValue: target, duration: 700, useNativeDriver: false }).start();
  }, [target, widthAnim]);

  const widthInterp = widthAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });

  return (
    <View style={[styles.bg, { height, borderRadius: height }]}>
      <Animated.View style={{ height: '100%', width: widthInterp, borderRadius: height, overflow: 'hidden' }}>
        <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { backgroundColor: 'rgba(255,255,255,0.06)', overflow: 'hidden' },
});
