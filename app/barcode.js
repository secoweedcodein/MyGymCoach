import React from 'react';
// 1. Importación limpia SIN llaves porque es un export default
import BarcodeScanner from '../src/screens/BarcodeScannerScreen.js'; 

export default function App() {
  return (
    // 2. Renderizamos el componente como una etiqueta JSX
    <BarcodeScanner />
  );
}