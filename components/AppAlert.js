import React, { useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";

const COLORS = {
  success: "#4ADE80",
  error: "#EF4444",
  warning: "#F59E0B",
  info: "#60A5FA",
};

const ICONS = {
  success: "✓",
  error: "✕",
  warning: "!",
  info: "i",
};

export default function AppAlert({
  visible,
  title,
  message,
  type = "info",
  buttons = [],
  onClose,
}) {

  const scale = useRef(new Animated.Value(0.8)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {

    if (visible) {

      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();

    } else {

      scale.setValue(0.8);
      opacity.setValue(0);

    }

  }, [visible]);

  function pressButton(button) {

    onClose?.();

    setTimeout(() => {
      button?.onPress?.();
    }, 180);

  }

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
    >

      <Animated.View
        style={[
          styles.overlay,
          {
            opacity,
          },
        ]}
      >

        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ scale }],
            },
          ]}
        >

          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor: COLORS[type] + "20",
              },
            ]}
          >
            <Text
              style={[
                styles.icon,
                {
                  color: COLORS[type],
                },
              ]}
            >
              {ICONS[type]}
            </Text>
          </View>

          <Text style={styles.title}>
            {title}
          </Text>

          <Text style={styles.message}>
            {message}
          </Text>

          <View style={styles.buttons}>

            {buttons.map((button, index) => {

              const destructive =
                button.style === "destructive";

              const cancel =
                button.style === "cancel";

              return (

                <TouchableOpacity
                  key={index}
                  activeOpacity={0.85}
                  onPress={() => pressButton(button)}
                  style={[
                    styles.button,

                    destructive && {
                      backgroundColor: COLORS.error,
                    },

                    cancel && {
                      backgroundColor: "#252525",
                    },

                    !destructive &&
                      !cancel && {
                        backgroundColor: COLORS[type],
                      },
                  ]}
                >

                  <Text
                    style={[
                      styles.buttonText,

                      cancel && {
                        color: "#FFF",
                      },
                    ]}
                  >
                    {button.text}
                  </Text>

                </TouchableOpacity>

              );

            })}

          </View>

        </Animated.View>

      </Animated.View>

    </Modal>
  );
}

const styles = StyleSheet.create({

  overlay: {

    flex: 1,

    backgroundColor: "rgba(0,0,0,0.65)",

    justifyContent: "center",

    alignItems: "center",

    padding: 30,

  },

  container: {

    width: "100%",

    backgroundColor: "#171717",

    borderRadius: 28,

    padding: 26,

    alignItems: "center",

    borderWidth: 1,

    borderColor: "#2A2A2A",

    shadowColor: "#000",

    shadowOpacity: 0.45,

    shadowRadius: 25,

    elevation: 20,

  },

  iconCircle: {

    width: 78,

    height: 78,

    borderRadius: 39,

    justifyContent: "center",

    alignItems: "center",

    marginBottom: 20,

  },

  icon: {

    fontSize: 38,

    fontWeight: "900",

  },

  title: {

    color: "#FFF",

    fontSize: 24,

    fontWeight: "800",

    marginBottom: 10,

    textAlign: "center",

  },

  message: {

    color: "#BDBDBD",

    fontSize: 16,

    lineHeight: 23,

    textAlign: "center",

    marginBottom: 28,

  },

  buttons: {

    width: "100%",

    flexDirection: "row",

    justifyContent: "center",

    gap: 12,

  },

  button: {

    flex: 1,

    paddingVertical: 15,

    borderRadius: 14,

    alignItems: "center",

  },

  buttonText: {

    color: "#000",

    fontWeight: "800",

    fontSize: 16,

  },

});