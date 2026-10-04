// components/home/primitives.js
import React, { useEffect, useRef } from 'react';
import { Animated, Pressable } from 'react-native';
import { COLORS, RADIUS } from './theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Botón/tarjeta con micro-interacción de escala al presionar (native driver). */
export function PressableScale({
  onPress,
  style,
  children,
  disabled = false,
  scaleTo = 0.97,
  accessibilityLabel,
  accessibilityRole = 'button',
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (toValue) =>
    Animated.spring(scale, { toValue, useNativeDriver: true, speed: 40, bounciness: 0 }).start();

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => animateTo(scaleTo)}
      onPressOut={() => animateTo(1)}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      style={[style, { transform: [{ scale }] }]}
    >
      {children}
    </AnimatedPressable>
  );
}

/** Entrada suave (fade + slide). Escalonada por `index`, solo se ejecuta al montar. */
export function FadeInView({ index = 0, style, children }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 360,
      delay: Math.min(index, 6) * 70,
      useNativeDriver: true,
    }).start();
  }, [progress, index]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress,
          transform: [
            { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/** Bloque pulsante para estados de carga. */
export function Skeleton({ style }) {
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.45, duration: 800, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[{ backgroundColor: COLORS.surface2, borderRadius: RADIUS.md, opacity }, style]}
    />
  );
}