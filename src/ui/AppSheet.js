import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

const COLORS = {
  success: "#4ADE80",
  error: "#EF4444",
  warning: "#F59E0B",
  info: "#60A5FA",
};

export default function AppSheet({

  visible,

  title,

  message,

  icon = "ℹ️",

  type = "info",

  buttons = [],

  onClose,

}) {

  return (

    <Modal
      visible={visible}
      transparent
      animationType="fade"
    >

      <View style={styles.overlay}>

        <View style={styles.sheet}>

          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor:
                  COLORS[type] + "20",
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
              {icon}
            </Text>

          </View>

          <Text style={styles.title}>
            {title}
          </Text>

          <Text style={styles.message}>
            {message}
          </Text>

          {buttons.map((btn, index) => (

            <TouchableOpacity
              key={index}
              style={[
                styles.button,
                btn.style === "cancel"
                  ? styles.cancel
                  : styles.primary,
              ]}
              onPress={() => {

                onClose();

                if (btn.onPress)
                  btn.onPress();

              }}
            >

              <Text
                style={styles.buttonText}
              >
                {btn.text}
              </Text>

            </TouchableOpacity>

          ))}

        </View>

      </View>

    </Modal>

  );

}

const styles = StyleSheet.create({

  overlay:{

    flex:1,

    backgroundColor:"rgba(0,0,0,.55)",

    justifyContent:"flex-end",

  },

  sheet:{

    backgroundColor:"#111",

    borderTopLeftRadius:28,

    borderTopRightRadius:28,

    padding:25,

  },

  iconCircle:{

    width:72,

    height:72,

    borderRadius:36,

    justifyContent:"center",

    alignItems:"center",

    alignSelf:"center",

    marginBottom:20,

  },

  icon:{

    fontSize:34,

  },

  title:{

    color:"white",

    fontSize:23,

    fontWeight:"800",

    textAlign:"center",

  },

  message:{

    color:"#AAA",

    fontSize:16,

    marginTop:10,

    textAlign:"center",

    lineHeight:23,

    marginBottom:25,

  },

  button:{

    height:56,

    borderRadius:16,

    justifyContent:"center",

    alignItems:"center",

    marginTop:12,

  },

  primary:{

    backgroundColor:"#C0FF3E",

  },

  cancel:{

    backgroundColor:"#222",

  },

  buttonText:{

    color:"white",

    fontWeight:"700",

    fontSize:17,

  },

});