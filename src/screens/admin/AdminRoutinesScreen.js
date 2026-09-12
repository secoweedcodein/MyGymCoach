import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, ActivityIndicator, Modal, Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  getAllPublicRoutines, createPublicRoutine,
  updatePublicRoutine, deletePublicRoutine, uploadImage,
} from '../../../services/adminService';

const ACCENT = '#C0FF3E';
const BG = '#0D0D0D';
const SURFACE = '#161616';
const SURFACE2 = '#1E1E1E';
const BORDER = '#FFFFFF0D';
const BORDER2 = '#FFFFFF18';
const T1 = '#FFFFFF';
const T2 = '#A0A0A0';
const T3 = '#555555';
const RED = '#FF453A';

const LEVELS = ['Principiante', 'Intermedio', 'Avanzado'];
const FREQUENCIES = ['2 días/semana', '3 días/semana', '4 días/semana', '5 días/semana'];

export default function AdminRoutinesScreen() {
  const [routines, setRoutines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    level: 'Intermedio',
    frequency: '3 días/semana',
    image_id: '',
  });

  useEffect(() => {
    loadRoutines();
  }, []);

  const loadRoutines = async () => {
    try {
      setLoading(true);
      const data = await getAllPublicRoutines();
      setRoutines(data);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar las rutinas');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingRoutine(null);
    setFormData({
      name: '',
      description: '',
      level: 'Intermedio',
      frequency: '3 días/semana',
      image_id: '',
    });
    setModalVisible(true);
  };

  const openEditModal = (routine) => {
    setEditingRoutine(routine);
    setFormData({
      name: routine.name,
      description: routine.description || '',
      level: routine.level || 'Intermedio',
      frequency: routine.frequency || '3 días/semana',
      image_id: routine.image_id || '',
    });
    setModalVisible(true);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso necesario', 'Necesitamos acceso a tus fotos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      try {
        Alert.alert('Subiendo', 'Subiendo imagen...');
        const imageUrl = await uploadImage(result.assets[0].uri, 'routines');
        setFormData({ ...formData, image_id: imageUrl });
        Alert.alert('✅ Éxito', 'Imagen subida correctamente');
      } catch (error) {
        Alert.alert('Error', 'No se pudo subir la imagen');
      }
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return;
    }

    setSaving(true);
    try {
      if (editingRoutine) {
        await updatePublicRoutine(editingRoutine.id, formData);
        Alert.alert('✅ Éxito', 'Rutina actualizada');
      } else {
        await createPublicRoutine(formData);
        Alert.alert('✅ Éxito', 'Rutina creada');
      }
      setModalVisible(false);
      loadRoutines();
    } catch (error) {
      Alert.alert('Error', error.message || 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (routine) => {
    Alert.alert(
      'Eliminar rutina',
      `¿Estás seguro de eliminar "${routine.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePublicRoutine(routine.id);
              Alert.alert('✅ Eliminado', 'La rutina fue eliminada');
              loadRoutines();
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={s.loading}>
        <ActivityIndicator size="large" color={ACCENT} />
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Rutinas Públicas</Text>
        <TouchableOpacity style={s.addButton} onPress={openCreateModal}>
          <Text style={s.addButtonText}>+ Nueva</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {routines.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyText}>No hay rutinas públicas todavía</Text>
          </View>
        ) : (
          routines.map((routine) => (
            <View key={routine.id} style={s.routineCard}>
              {routine.image_id && (
                <Image source={{ uri: routine.image_id }} style={s.routineImage} />
              )}
              <View style={s.routineContent}>
                <Text style={s.routineName}>{routine.name}</Text>
                <Text style={s.routineMeta}>
                  {routine.level} · {routine.frequency}
                </Text>
                {routine.description && (
                  <Text style={s.routineDescription} numberOfLines={2}>
                    {routine.description}
                  </Text>
                )}
              </View>
              <View style={s.routineActions}>
                <TouchableOpacity
                  style={s.editBtn}
                  onPress={() => openEditModal(routine)}
                >
                  <Text style={s.editBtnText}>✏️ Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.deleteBtn}
                  onPress={() => handleDelete(routine)}
                >
                  <Text style={s.deleteBtnText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Modal de Crear/Editar */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modal}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>
                {editingRoutine ? 'Editar Rutina' : 'Nueva Rutina'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={s.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={s.label}>Nombre *</Text>
              <TextInput
                style={s.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Ej: Rutina de Pecho Avanzada"
                placeholderTextColor={T3}
              />

              <Text style={s.label}>Descripción</Text>
              <TextInput
                style={[s.input, s.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="Describe la rutina..."
                placeholderTextColor={T3}
                multiline
                numberOfLines={4}
              />

              <Text style={s.label}>Nivel</Text>
              <View style={s.optionsRow}>
                {LEVELS.map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      s.optionBtn,
                      formData.level === level && s.optionBtnActive,
                    ]}
                    onPress={() => setFormData({ ...formData, level })}
                  >
                    <Text
                      style={[
                        s.optionBtnText,
                        formData.level === level && s.optionBtnTextActive,
                      ]}
                    >
                      {level}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={s.label}>Frecuencia</Text>
              <View style={s.optionsRow}>
                {FREQUENCIES.map((freq) => (
                  <TouchableOpacity
                    key={freq}
                    style={[
                      s.optionBtn,
                      formData.frequency === freq && s.optionBtnActive,
                    ]}
                    onPress={() => setFormData({ ...formData, frequency: freq })}
                  >
                    <Text
                      style={[
                        s.optionBtnText,
                        formData.frequency === freq && s.optionBtnTextActive,
                      ]}
                    >
                      {freq}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={s.label}>Imagen</Text>
              <TouchableOpacity style={s.imagePicker} onPress={pickImage}>
                {formData.image_id ? (
                  <Image source={{ uri: formData.image_id }} style={s.previewImage} />
                ) : (
                  <Text style={s.imagePickerText}>📷 Toca para subir imagen</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.saveBtn, saving && s.saveBtnDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                <Text style={s.saveBtnText}>
                  {saving ? 'Guardando...' : editingRoutine ? 'Actualizar' : 'Crear'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  loading: { flex: 1, backgroundColor: BG, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, paddingTop: 50,
  },
  title: { fontSize: 24, fontWeight: '800', color: T1 },
  addButton: {
    backgroundColor: ACCENT, paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 12,
  },
  addButtonText: { color: '#000', fontWeight: '800', fontSize: 14 },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: T3, fontSize: 14 },
  routineCard: {
    backgroundColor: SURFACE, marginHorizontal: 20, marginBottom: 12,
    borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: BORDER,
  },
  routineImage: { width: '100%', height: 150, resizeMode: 'cover' },
  routineContent: { padding: 16 },
  routineName: { fontSize: 18, fontWeight: '700', color: T1, marginBottom: 4 },
  routineMeta: { fontSize: 12, color: T3, marginBottom: 8 },
  routineDescription: { fontSize: 13, color: T2 },
  routineActions: {
    flexDirection: 'row', padding: 12, borderTopWidth: 1, borderTopColor: BORDER,
    gap: 10,
  },
  editBtn: {
    flex: 1, backgroundColor: SURFACE2, paddingVertical: 10,
    borderRadius: 10, alignItems: 'center',
  },
  editBtnText: { color: T1, fontWeight: '600' },
  deleteBtn: {
    backgroundColor: RED + '20', paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 10,
  },
  deleteBtnText: { fontSize: 16 },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: SURFACE, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: T1 },
  closeBtn: { fontSize: 24, color: T2 },
  label: { fontSize: 13, fontWeight: '700', color: T2, marginBottom: 8, marginTop: 16 },
  input: {
    backgroundColor: SURFACE2, borderRadius: 12, padding: 14, color: T1,
    fontSize: 15, borderWidth: 1, borderColor: BORDER2,
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionBtn: {
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10,
    backgroundColor: SURFACE2, borderWidth: 1, borderColor: BORDER2,
  },
  optionBtnActive: { backgroundColor: ACCENT + '20', borderColor: ACCENT },
  optionBtnText: { color: T2, fontWeight: '600', fontSize: 13 },
  optionBtnTextActive: { color: ACCENT },
  imagePicker: {
    backgroundColor: SURFACE2, borderRadius: 12, padding: 20,
    alignItems: 'center', borderWidth: 1, borderColor: BORDER2,
    minHeight: 150, justifyContent: 'center',
  },
  imagePickerText: { color: T3, fontSize: 14 },
  previewImage: { width: '100%', height: 150, borderRadius: 8, resizeMode: 'cover' },
  saveBtn: {
    backgroundColor: ACCENT, borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginTop: 24,
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: '#000', fontWeight: '800', fontSize: 16 },
});