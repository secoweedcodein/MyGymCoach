import React, { createContext, useContext, useState } from "react";
import AppAlert from "../../components/AppAlert";

const AlertContext = createContext();

export function AlertProvider({ children }) {

  const [alert, setAlert] = useState({
    visible: false,
    title: "",
    message: "",
    type: "info",
    buttons: [],
  });

  function showAlert(
    title,
    message,
    buttons = [{ text: "Aceptar" }],
    type = "info"
  ) {

    setAlert({
      visible: true,
      title,
      message,
      type,
      buttons,
    });

  }

  function closeAlert() {
    setAlert(prev => ({
      ...prev,
      visible: false,
    }));
  }

  return (

    <AlertContext.Provider value={{ showAlert }}>

      {children}

      <AppAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        buttons={alert.buttons}
        onClose={closeAlert}
      />

    </AlertContext.Provider>

  );

}

export function useAlert() {
  return useContext(AlertContext);
}