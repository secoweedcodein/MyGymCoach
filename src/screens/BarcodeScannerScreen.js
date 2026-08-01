import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, Button, TouchableOpacity, 
  ActivityIndicator, Alert, TextInput 
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { addScannedFoodToLog } from '../../services/foodService';
import { useAlert } from "../context/AlertContext";
const logger = {
  debug: (...args) => console.log('[DEBUG]', ...args),
  warn: (...args) => console.warn('[WARN]', ...args),
};

function mapOffProductToFood(product) {
  const n = product.nutriments ?? {};
  
  let servingSize = 100;
  if (product.serving_size) {
    const match = product.serving_size.match(/(\d+(?:\.\d+)?)\s*g/i);
    if (match) {
      servingSize = parseFloat(match[1]);
    }
  }

  return {
    barcode: product.code ?? null,
    name: product.product_name?.trim() || 'Producto desconocido',
    brand: product.brands ?? '',
    image: product.image_url,
    source: 'openfoodfacts',
    servingSize: servingSize,
    per100g: {
      calories: Math.round(Number(n['energy-kcal_100g'] ?? n['energy_100g'] ?? 0)),
      protein: Number(n['proteins_100g'] ?? 0),
      carbs: Number(n['carbohydrates_100g'] ?? 0),
      fat: Number(n['fat_100g'] ?? 0),
    },
  };
}

async function getFoodByBarcodeFromOFF(barcode) {
  if (!barcode) return null;
  const url = `https://world.openfoodfacts.org/api/v2/product/${barcode}`;
  try {
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== 1 || !data.product) return null;
    return mapOffProductToFood(data.product);
  } catch (err) {
    logger.warn('Error consultando OFF', err);
    return null;
  }
}

function BarcodeScannerScreen({ userId, mealType, date, onFoodAdded, onClose }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [productResult, setProductResult] = useState(null);
  const [quantity, setQuantity] = useState('100');
  const { showAlert } = useAlert();

  if (!permission) {
    return <View style={styles.container}><Text>Cargando permisos...</Text></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Necesitamos tu permiso para usar la cámara</Text>
        <Button onPress={requestPermission} title="Conceder Permiso" />
      </View>
    );
  }

  const handleBarcodeScanned = async ({ type, data }) => {
    if (scanned) return; // Evitar múltiples escaneos
    
    setScanned(true);
    setLoading(true);
    setProductResult(null);

    logger.debug(`Código escaneado: ${data}`);
    const product = await getFoodByBarcodeFromOFF(data);

    setLoading(false);
    if (product) {
      setProductResult(product);
      setQuantity(String(product.servingSize));
    } else {
      showAlert('No encontrado', 'El código de barras no existe en Open Food Facts');
      setTimeout(() => setScanned(false), 2000); // Reanudar después de 2 segundos
    }
  };

  const handleAddToMeal = async () => {
    if (!productResult || !userId || !mealType) {
     showAlert('Error', 'Faltan datos para agregar el alimento');
      return;
    }

    const quantityG = parseFloat(quantity);
    if (!quantityG || quantityG <= 0) {
      showAlert('Error', 'Ingresa una cantidad válida');
      return;
    }

    setSaving(true);
    try {
      const result = await addScannedFoodToLog({
        userId,
        food: productResult,
        mealType,
        quantityG,
      });

      if (!result.success) {
        throw new Error(result.error || 'No se pudo agregar al diario');
      }

      showAlert('¡Agregado!', `${productResult.name} (${quantityG}g) se agregó a tu ${getMealTypeName(mealType)}`);
      
      if (onFoodAdded) onFoodAdded(productResult);
      if (onClose) onClose();
    } catch (err) {
      logger.warn('Error agregando al diario', err);
      showAlert('Error', err.message || 'No se pudo agregar el alimento');
    } finally {
      setSaving(false);
    }
  };

  const getMealTypeName = (type) => {
    const names = {
      breakfast: 'desayuno',
      lunch: 'almuerzo',
      dinner: 'cena',
      snack: 'snack',
    };
    return names[type] || type;
  };

  const getScaledNutrients = () => {
    const quantityG = parseFloat(quantity) || 0;
    const factor = quantityG / 100;
    return {
      calories: Math.round((productResult.per100g.calories || 0) * factor),
      protein: (productResult.per100g.protein * factor).toFixed(1),
      carbs: (productResult.per100g.carbs * factor).toFixed(1),
      fat: (productResult.per100g.fat * factor).toFixed(1),
    };
  };

  return (
    <View style={styles.container}>
      {/* Cámara */}
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
      />

      {/* Overlay con cuadro guía */}
      <View style={styles.overlay}>
        <View style={styles.scannerFrame} />
        <Text style={styles.instructionText}>
          Apunta al código de barras
        </Text>
      </View>

      {/* Panel de resultados */}
      {(loading || productResult) && (
        <View style={styles.resultContainer}>
          {loading && (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Buscando en Open Food Facts...</Text>
            </View>
          )}

          {productResult && (
            <View style={styles.productBox}>
              <Text style={styles.productTitle}>{productResult.name}</Text>
              <Text style={styles.productBrand}>{productResult.brand}</Text>
              
              <View style={styles.quantityRow}>
                <Text style={styles.quantityLabel}>Cantidad (g):</Text>
                <TextInput
                  style={styles.quantityInput}
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="numeric"
                  placeholder="100"
                />
                <Text style={styles.servingHint}>
                  (Porción: {productResult.servingSize}g)
                </Text>
              </View>

              <Text style={styles.nutrientsText}>
                {getScaledNutrients().calories} kcal · 
                P: {getScaledNutrients().protein}g · 
                C: {getScaledNutrients().carbs}g · 
                G: {getScaledNutrients().fat}g
              </Text>
              
              <View style={styles.buttonRow}>
                <TouchableOpacity 
                  style={[styles.button, styles.secondaryButton]}
                  onPress={() => { setScanned(false); setProductResult(null); }}
                  disabled={saving}
                >
                  <Text style={styles.secondaryButtonText}>Escanear otro</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.button, styles.primaryButton]}
                  onPress={handleAddToMeal}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.buttonText}>Agregar a {getMealTypeName(mealType)}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  text: {
    textAlign: 'center',
    fontSize: 16,
    color: 'white',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  scannerFrame: {
    width: 280,
    height: 150,
    borderWidth: 3,
    borderColor: '#00ff00',
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  instructionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 20,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  resultContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '65%',
  },
  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 14,
    color: '#666',
  },
  productBox: {
    paddingVertical: 10,
  },
  productTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#000',
  },
  productBrand: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 10,
  },
  quantityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  quantityInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    textAlign: 'center',
    color: '#000',
  },
  servingHint: {
    fontSize: 11,
    color: '#999',
  },
  nutrientsText: {
    fontSize: 13,
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#E0E0E0',
  },
  buttonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#333',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default BarcodeScannerScreen;