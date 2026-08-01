import React, {
  createContext,
  useContext,
  useState,
} from "react";

import AppSheet from "../ui/AppSheet";

const SheetContext = createContext();

export function SheetProvider({ children }) {

  const [sheet, setSheet] = useState({
    visible: false,
    title: "",
    message: "",
    icon: "ℹ️",
    type: "info",
    buttons: [],
  });

  function showSheet(config) {

    setSheet({
      visible: true,
      ...config,
    });

  }

  function hideSheet() {

    setSheet(prev => ({
      ...prev,
      visible: false,
    }));

  }

  return (

    <SheetContext.Provider
      value={{
        showSheet,
        hideSheet,
      }}
    >

      {children}

      <AppSheet
        {...sheet}
        onClose={hideSheet}
      />

    </SheetContext.Provider>

  );

}

export function useSheet() {

  return useContext(SheetContext);

}