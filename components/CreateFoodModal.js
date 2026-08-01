import React, { useState, useEffect } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { createFood, findSimilarFoods, getFoodByBarcodeHybrid, FOOD_CATEGORIES } from '../services/foodService';
import AppAlert from "../components/AppAlert";

const ACCENT = '#C0FF3E';
const BG = '#0D0D0D';
const SURFACE = '#161616';
const SRF2 = '#1E1E1E';
const BORDER = '#FFFFFF0D';
const BORDER2 = '#FFFFFF18';
const T1 = '#FFFFFF';
const T2 = '#A0A0A0';
const T3 = '#555555';

export default function CreateFoodModal({ visible, onClose, onFoodCreated }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [showScanner, setShowScanner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [alertVisible,setAlertVisible]=useState(false);

const [alertTitle,setAlertTitle]=useState("");

const [alertMessage,setAlertMessage]=useState("");

const [alertType,setAlertType]=useState("info");
  const [similarFoods, setSimilarFoods] = useState([]);

  
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    barcode: '',
    category: 'otros',
    calories: '',
    protein_g: '',
    carbs_g: '',
    fat_g: '',
  });

  // Resetear formulario cuando se abre el modal
  useEffect(() => {
    if (visible) {
      setFormData({
        name: '', brand: '', barcode: '', category: 'otros',
        calories: '', protein_g: '', carbs_g: '', fat_g: '',
      });
      setSimilarFoods([]);
      setShowScanner(false);
    }
  }, [visible]);

  // Buscar duplicados cuando cambia el nombre
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (formData.name.length >= 3) {
        const similar = await findSimilarFoods(formData.name, formData.brand);
        setSimilarFoods(similar);
      } else {
        setSimilarFoods([]);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [formData.name, formData.brand]);

  // Calcular macros por porción
  const calculatePerServing = (grams = 100) => {
    const factor = grams / 100;
    return {
      calories: Math.round((Number(formData.calories) || 0) * factor),
      protein: ((Number(formData.protein_g) || 0) * factor).toFixed(1),
      carbs: ((Number(formData.carbs_g) || 0) * factor).toFixed(1),
      fat: ((Number(formData.fat_g) || 0) * factor).toFixed(1),
    };
  };

  const handleBarcodeScanned = async ({ data }) => {
    if (loading) return;
    setLoading(true);
    setShowScanner(false);

    try {
      const food = await getFoodByBarcodeHybrid(data);
      if (food) {
        // Autocompletar formulario
        setFormData({
          name: food.name || '',
          brand: food.brand || '',
          barcode: data,
          category: 'otros',
          calories: String(food.per100g.calories || ''),
          protein_g: String(food.per100g.protein || ''),
          carbs_g: String(food.per100g.carbs || ''),
          fat_g: String(food.per100g.fat || ''),
        });
        showAlert(
"Producto encontrado",
"Se autocompletó el formulario. Puedes editarlo.",
"success"
);
      } else {
        setFormData(prev => ({ ...prev, barcode: data }));
        showAlert(
"Código registrado",
"El código no existe. Completa los datos manualmente.",
"warning"
);
      }
    } catch (err) {
      showAlert(
"Error",
"No se pudo buscar el producto.",
"error"
);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validaciones
    if (!formData.name.trim()) {
      showAlert(
"Nombre requerido",
"Debes ingresar el nombre del alimento.",
"warning"
);
      return;
    }
    if (!formData.calories || Number(formData.calories) < 0) {
      showAlert(
"Calorías",
"Debes ingresar las calorías por 100 gramos.",
"warning"
);
      return;
    }

    setSaving(true);
    try {
      const result = await createFood(formData);
      
      if (result.success) {
       showAlert(
"Alimento creado",
`${result.food.name} fue agregado correctamente.`,
"success"
);
        if (onFoodCreated) onFoodCreated(result.food);
        onClose();
      } else {
        showAlert('Error', result.error || 'No se pudo crear el alimento');
      }
    } catch (err) {
      showAlert('Error', 'Ocurrió un error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field, value) => {
    function showAlert(title,message,type="info"){

setAlertTitle(title);

setAlertMessage(message);

setAlertType(type);

setAlertVisible(true);

}
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Crear Alimento</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Scanner */}
          {showScanner ? (
            <View style={styles.scannerContainer}>
              <CameraView
                style={StyleSheet.absoluteFillObject}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a'] }}
                onBarcodeScanned={handleBarcodeScanned}
              />
              <View style={styles.scannerOverlay}>
                <View style={styles.scannerFrame} />
                <Text style={styles.scannerText}>Apunta al código de barras</Text>
                <TouchableOpacity 
                  style={styles.cancelScanBtn}
                  onPress={() => setShowScanner(false)}
                >
                  <Text style={styles.cancelScanText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
              {/* Botón escanear */}
              <TouchableOpacity 
                style={styles.scanButton}
                onPress={async () => {
                  if (!permission?.granted) {
                    const { status } = await requestPermission();
                    if (status !== 'granted') {
                      showAlert('Permiso requerido', 'Necesitamos acceso a la cámara');
                      return;
                    }
                  }
                  setShowScanner(true);
                }}
              >
                <Text style={styles.scanButtonIcon}>📷</Text>
                <Text style={styles.scanButtonText}>Escanear código de barras (opcional)</Text>
              </TouchableOpacity>

              {/* Alerta de duplicados */}
              {similarFoods.length > 0 && (
                <View style={styles.warningBox}>
                  <Text style={styles.warningTitle}>⚠️ Posibles duplicados:</Text>
                  {similarFoods.map((food, idx) => (
                    <Text key={idx} style={styles.warningItem}>
                      • {food.name} {food.brand ? `(${food.brand})` : ''}
                    </Text>
                  ))}
                </View>
              )}

              {/* Nombre */}
              <Text style={styles.label}>Nombre *</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(v) => updateField('name', v)}
                placeholder="Ej: Pechuga de pollo a la plancha"
                placeholderTextColor={T3}
              />

              {/* Marca */}
              <Text style={styles.label}>Marca</Text>
              <TextInput
                style={styles.input}
                value={formData.brand}
                onChangeText={(v) => updateField('brand', v)}
                placeholder="Ej: Pollo Grande"
                placeholderTextColor={T3}
              />

              {/* Código de barras */}
              <Text style={styles.label}>Código de barras</Text>
              <TextInput
                style={styles.input}
                value={formData.barcode}
                onChangeText={(v) => updateField('barcode', v)}
                placeholder="Opcional"
                placeholderTextColor={T3}
                keyboardType="numeric"
              />

              {/* Categoría */}
              <Text style={styles.label}>Categoría</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                {FOOD_CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat.value}
                    style={[
                      styles.categoryChip,
                      formData.category === cat.value && styles.categoryChipActive
                    ]}
                    onPress={() => updateField('category', cat.value)}
                  >
                    <Text style={styles.categoryIcon}>{cat.icon}</Text>
                    <Text style={[
                      styles.categoryText,
                      formData.category === cat.value && styles.categoryTextActive
                    ]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Macros por 100g */}
              <Text style={styles.sectionTitle}>Por cada 100g</Text>
              
              <View style={styles.macroRow}>
                <Text style={styles.macroLabel}>Calorías</Text>
                <TextInput
                  style={styles.macroInput}
                  value={formData.calories}
                  onChangeText={(v) => updateField('calories', v)}
                  placeholder="0"
                  placeholderTextColor={T3}
                  keyboardType="numeric"
                />
                <Text style={styles.macroUnit}>kcal</Text>
              </View>

              <View style={styles.macroRow}>
                <Text style={styles.macroLabel}>Proteínas</Text>
                <TextInput
                  style={styles.macroInput}
                  value={formData.protein_g}
                  onChangeText={(v) => updateField('protein_g', v)}
                  placeholder="0"
                  placeholderTextColor={T3}
                  keyboardType="numeric"
                />
                <Text style={styles.macroUnit}>g</Text>
              </View>

              <View style={styles.macroRow}>
                <Text style={styles.macroLabel}>Carbohidratos</Text>
                <TextInput
                  style={styles.macroInput}
                  value={formData.carbs_g}
                  onChangeText={(v) => updateField('carbs_g', v)}
                  placeholder="0"
                  placeholderTextColor={T3}
                  keyboardType="numeric"
                />
                <Text style={styles.macroUnit}>g</Text>
              </View>

              <View style={styles.macroRow}>
                <Text style={styles.macroLabel}>Grasas</Text>
                <TextInput
                  style={styles.macroInput}
                  value={formData.fat_g}
                  onChangeText={(v) => updateField('fat_g', v)}
                  placeholder="0"
                  placeholderTextColor={T3}
                  keyboardType="numeric"
                />
                <Text style={styles.macroUnit}>g</Text>
              </View>

              {/* Vista previa */}
              {(formData.calories || formData.protein_g || formData.carbs_g || formData.fat_g) && (
                <View style={styles.previewBox}>
                  <Text style={styles.previewTitle}>Vista previa (100g)</Text>
                  <Text style={styles.previewMacros}>
                    🔥 {calculatePerServing(100).calories} kcal · 
                    P {calculatePerServing(100).protein}g · 
                    C {calculatePerServing(100).carbs}g · 
                    G {calculatePerServing(100).fat}g
                  </Text>
                </View>
              )}

              {/* Botón guardar */}
              <TouchableOpacity
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color={BG} />
                ) : (
                  <Text style={styles.saveButtonText}>Guardar Alimento</Text>
                )}
              </TouchableOpacity>

              <View style={{ height: 40 }} />
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    <AppAlert
visible={alertVisible}
title={alertTitle}
message={alertMessage}
type={alertType}
onClose={()=>setAlertVisible(false)}
/>
    </Modal>

  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: BG,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: T1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: SRF2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 18,
    color: T2,
  },
  scannerContainer: {
    height: 400,
    position: 'relative',
  },
  scannerOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  scannerFrame: {
    width: 280,
    height: 150,
    borderWidth: 3,
    borderColor: ACCENT,
    borderRadius: 12,
  },
  scannerText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  cancelScanBtn: {
    marginTop: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  cancelScanText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  form: {
    padding: 20,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SRF2,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER2,
    marginBottom: 20,
    gap: 10,
  },
  scanButtonIcon: {
    fontSize: 24,
  },
  scanButtonText: {
    fontSize: 14,
    color: ACCENT,
    fontWeight: '600',
  },
  warningBox: {
    backgroundColor: '#FF9500' + '15',
    borderLeftWidth: 3,
    borderLeftColor: '#FF9500',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  warningTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FF9500',
    marginBottom: 5,
  },
  warningItem: {
    fontSize: 12,
    color: T2,
    marginLeft: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: T2,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: SRF2,
    borderWidth: 1,
    borderColor: BORDER2,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: T1,
  },
  categoryScroll: {
    marginTop: 8,
    marginBottom: 15,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SRF2,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: BORDER2,
    gap: 6,
  },
  categoryChipActive: {
    backgroundColor: ACCENT + '20',
    borderColor: ACCENT,
  },
  categoryIcon: {
    fontSize: 16,
  },
  categoryText: {
    fontSize: 12,
    color: T2,
    fontWeight: '600',
  },
  categoryTextActive: {
    color: ACCENT,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: T1,
    marginTop: 20,
    marginBottom: 12,
  },
  macroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  macroLabel: {
    flex: 1,
    fontSize: 14,
    color: T2,
    fontWeight: '600',
  },
  macroInput: {
    width: 80,
    backgroundColor: SRF2,
    borderWidth: 1,
    borderColor: BORDER2,
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    color: T1,
    textAlign: 'center',
  },
  macroUnit: {
    fontSize: 13,
    color: T3,
    width: 30,
  },
  previewBox: {
    backgroundColor: ACCENT + '10',
    borderLeftWidth: 3,
    borderLeftColor: ACCENT,
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    marginBottom: 20,
  },
  previewTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: ACCENT,
    marginBottom: 5,
  },
  previewMacros: {
    fontSize: 14,
    color: T1,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: ACCENT,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: BG,
  },
});