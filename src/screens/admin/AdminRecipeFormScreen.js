// src/screens/admin/AdminRecipeFormScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, ActivityIndicator, Modal,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';
import { generateRecipe } from '../../../services/recipeGenerator';

const ACCENT = '#C0FF3E';
const BG = '#0D0D0D';
const SURFACE = '#161616';
const BORDER = '#FFFFFF0D';
const T1 = '#FFFFFF';
const T2 = '#A0A0A0';
const T3 = '#555555';

const CATEGORIES = ['Desayuno', 'Almuerzo', 'Cena', 'Snack', 'Post-entreno'];

export default function AdminRecipeFormScreen() {
  const { id } = useLocalSearchParams();
  const isEditing = !!id;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiVisible, setAiVisible] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    subtitle: '',
    category: 'Almuerzo',
    time: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    tags: [],
    ingredients: [],
    steps: [],
  });

  useEffect(() => {
    if (isEditing) loadRecipe();
  }, [id]);

  async function loadRecipe() {
    setLoading(true);
    const { data, error } = await supabase
      .from('recipes_ia')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      Alert.alert('Error', 'No se encontró la receta');
      router.back();
      return;
    }

    setForm({
      name: data.name,
      subtitle: data.subtitle || '',
      category: data.category || 'Almuerzo',
      time: data.time || '',
      calories: String(data.calories ?? ''),
      protein: String(data.protein ?? ''),
      carbs: String(data.carbs_g ?? data.carbs ?? ''),
      fat: String(data.fat_g ?? data.fat ?? ''),
      tags: data.tags || [],
      ingredients: data.ingredients || [],
      steps: data.instructions || data.steps || [],
    });
    setLoading(false);
  }

  function updateField(key, value) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  // TAGS
  function addTag() {
    setForm(prev => ({ ...prev, tags: [...prev.tags, ''] }));
  }
  function updateTag(idx, value) {
    setForm(prev => {
      const newTags = [...prev.tags];
      newTags[idx] = value;
      return { ...prev, tags: newTags };
    });
  }
  function deleteTag(idx) {
    setForm(prev => ({ ...prev, tags: prev.tags.filter((_, i) => i !== idx) }));
  }

  // INGREDIENTS
  function addIngredient() {
    setForm(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, { name: '', amount: '' }]
    }));
  }
  function updateIngredient(idx, field, value) {
    setForm(prev => {
      const newIngredients = [...prev.ingredients];
      newIngredients[idx] = { ...newIngredients[idx], [field]: value };
      return { ...prev, ingredients: newIngredients };
    });
  }
  function deleteIngredient(idx) {
    setForm(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== idx)
    }));
  }

  // STEPS
  function addStep() {
    setForm(prev => ({ ...prev, steps: [...prev.steps, ''] }));
  }
  function updateStep(idx, value) {
    setForm(prev => {
      const newSteps = [...prev.steps];
      newSteps[idx] = value;
      return { ...prev, steps: newSteps };
    });
  }
  function deleteStep(idx) {
    setForm(prev => ({ ...prev, steps: prev.steps.filter((_, i) => i !== idx) }));
  }

  async function handleSave() {
    // Validaciones
    if (!form.name.trim()) return Alert.alert('Error', 'El nombre es obligatorio');
    if (!form.time.trim()) return Alert.alert('Error', 'El tiempo es obligatorio');
    if (!form.calories || isNaN(form.calories)) return Alert.alert('Error', 'Calorías inválidas');
    if (!form.protein || isNaN(form.protein)) return Alert.alert('Error', 'Proteína inválida');
    if (!form.carbs || isNaN(form.carbs)) return Alert.alert('Error', 'Carbos inválidos');
    if (!form.fat || isNaN(form.fat)) return Alert.alert('Error', 'Grasas inválidas');
    if (form.ingredients.length === 0) return Alert.alert('Error', 'Agrega al menos un ingrediente');
    if (form.steps.length === 0) return Alert.alert('Error', 'Agrega al menos un paso');

    setSaving(true);

    const payload = {
      name: form.name.trim(),
      subtitle: form.subtitle.trim(),
      category: form.category,
      time: form.time.trim(),
      calories: parseInt(form.calories),
      protein: parseInt(form.protein),
      carbs_g: parseInt(form.carbs),
      fat_g: parseInt(form.fat),
      tags: form.tags.filter(t => t.trim()),
      ingredients: form.ingredients.filter(i => i.name.trim()),
      instructions: form.steps.filter(s => s.trim()),
    };

    let error;
    if (isEditing) {
      ({ error } = await supabase.from('recipes_ia').update(payload).eq('id', id));
    } else {
      ({ error } = await supabase.from('recipes_ia').insert(payload));
    }

    setSaving(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert(
        '¡Éxito!',
        isEditing ? 'Receta actualizada' : 'Receta publicada',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    }
  }

  async function handleGenerate() {
    if (!aiPrompt.trim()) return Alert.alert('Error', 'Describe la receta que quieres generar.');
    setAiLoading(true);
    try {
      const { recipe } = await generateRecipe({ prompt: aiPrompt, category: form.category });
      setForm(prev => ({
        ...prev,
        name: recipe.name || prev.name,
        subtitle: recipe.subtitle || prev.subtitle,
        category: CATEGORIES.includes(recipe.category) ? recipe.category : prev.category,
        time: recipe.time || prev.time,
        calories: String(recipe.calories ?? prev.calories),
        protein: String(recipe.protein ?? prev.protein),
        carbs: String(recipe.carbs ?? prev.carbs),
        fat: String(recipe.fat ?? prev.fat),
        tags: recipe.tags || prev.tags,
        ingredients: recipe.ingredients || prev.ingredients,
        steps: recipe.instructions || prev.steps,
      }));
      setAiVisible(false);
      Alert.alert('Receta generada', 'Revisa y edita los campos antes de guardar.');
    } catch (err) {
      Alert.alert(
        err.quota ? 'Límite diario alcanzado' : 'Error al generar',
        err.message || 'Inténtalo de nuevo más tarde.',
      );
    } finally {
      setAiLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={s.loading}>
        <ActivityIndicator size="large" color={ACCENT} />
      </View>
    );
  }

  return (
    <View style={s.container}>
      {/* HEADER */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color={T1} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{isEditing ? 'Editar receta' : 'Nueva receta'}</Text>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* GENERAR CON IA */}
        <TouchableOpacity style={s.aiGenBtn} onPress={() => setAiVisible(true)} activeOpacity={0.85}>
          <Ionicons name="sparkles" size={18} color={BG} />
          <Text style={s.aiGenBtnText}>Generar receta con IA</Text>
        </TouchableOpacity>

        {/* INFO BÁSICA */}
        <Text style={s.sectionLabel}>INFORMACIÓN BÁSICA</Text>
        <Input label="Nombre *" value={form.name} onChangeText={v => updateField('name', v)} placeholder="Ej: Bowl Proteico de Pollo" />
        <Input label="Subtítulo" value={form.subtitle} onChangeText={v => updateField('subtitle', v)} placeholder="Ej: Alto en proteína · Post-entreno" />
        <Input label="Tiempo *" value={form.time} onChangeText={v => updateField('time', v)} placeholder="Ej: 20 min" />

        {/* CATEGORÍA */}
        <Text style={s.sectionLabel}>CATEGORÍA</Text>
        <View style={s.categoriesRow}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[s.categoryBtn, form.category === cat && s.categoryBtnActive]}
              onPress={() => updateField('category', cat)}
              activeOpacity={0.8}
            >
              <Text style={[s.categoryBtnText, form.category === cat && s.categoryBtnTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* MACROS */}
        <Text style={s.sectionLabel}>MACRONUTRIENTES (por porción) *</Text>
        <View style={s.macrosRow}>
          <View style={{ flex: 1 }}>
            <Input label="Kcal *" value={form.calories} onChangeText={v => updateField('calories', v)} keyboardType="numeric" />
          </View>
          <View style={{ flex: 1 }}>
            <Input label="Proteína (g) *" value={form.protein} onChangeText={v => updateField('protein', v)} keyboardType="numeric" />
          </View>
        </View>
        <View style={s.macrosRow}>
          <View style={{ flex: 1 }}>
            <Input label="Carbos (g) *" value={form.carbs} onChangeText={v => updateField('carbs', v)} keyboardType="numeric" />
          </View>
          <View style={{ flex: 1 }}>
            <Input label="Grasas (g) *" value={form.fat} onChangeText={v => updateField('fat', v)} keyboardType="numeric" />
          </View>
        </View>

        {/* TAGS */}
        <Text style={s.sectionLabel}>ETIQUETAS</Text>
        {form.tags.map((tag, idx) => (
          <View key={idx} style={s.tagRow}>
            <TextInput
              style={s.tagInput}
              value={tag}
              onChangeText={v => updateTag(idx, v)}
              placeholder="Ej: Alto en proteína"
              placeholderTextColor={T3}
            />
            <TouchableOpacity onPress={() => deleteTag(idx)}>
              <Ionicons name="close-circle-outline" size={22} color={T3} />
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity style={s.addBtn} onPress={addTag}>
          <Ionicons name="add" size={18} color={ACCENT} />
          <Text style={s.addBtnText}>Agregar etiqueta</Text>
        </TouchableOpacity>

        {/* INGREDIENTES */}
        <Text style={s.sectionLabel}>INGREDIENTES *</Text>
        {form.ingredients.map((ing, idx) => (
          <View key={idx} style={s.ingredientRow}>
            <View style={{ flex: 2 }}>
              <TextInput
                style={s.input}
                value={ing.name}
                onChangeText={v => updateIngredient(idx, 'name', v)}
                placeholder="Nombre del ingrediente"
                placeholderTextColor={T3}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <TextInput
                style={s.input}
                value={ing.amount}
                onChangeText={v => updateIngredient(idx, 'amount', v)}
                placeholder="Cantidad"
                placeholderTextColor={T3}
              />
            </View>
            <TouchableOpacity onPress={() => deleteIngredient(idx)} style={{ marginLeft: 8 }}>
              <Ionicons name="close-circle-outline" size={22} color={T3} />
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity style={s.addBtn} onPress={addIngredient}>
          <Ionicons name="add" size={18} color={ACCENT} />
          <Text style={s.addBtnText}>Agregar ingrediente</Text>
        </TouchableOpacity>

        {/* PASOS */}
        <Text style={s.sectionLabel}>PASOS DE PREPARACIÓN *</Text>
        {form.steps.map((step, idx) => (
          <View key={idx} style={s.stepRow}>
            <View style={s.stepNumber}>
              <Text style={s.stepNumberText}>{idx + 1}</Text>
            </View>
            <TextInput
              style={[s.input, { flex: 1 }]}
              value={step}
              onChangeText={v => updateStep(idx, v)}
              placeholder={`Paso ${idx + 1}...`}
              placeholderTextColor={T3}
              multiline
            />
            <TouchableOpacity onPress={() => deleteStep(idx)} style={{ marginLeft: 8 }}>
              <Ionicons name="close-circle-outline" size={22} color={T3} />
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity style={s.addBtn} onPress={addStep}>
          <Ionicons name="add" size={18} color={ACCENT} />
          <Text style={s.addBtnText}>Agregar paso</Text>
        </TouchableOpacity>

        {/* BOTÓN GUARDAR */}
        <TouchableOpacity
          style={[s.saveBtn, saving && s.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          <Text style={s.saveBtnText}>
            {saving ? 'Guardando...' : (isEditing ? 'Actualizar receta' : 'Publicar receta')}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* MODAL GENERACIÓN IA */}
      <Modal visible={aiVisible} transparent animationType="fade" onRequestClose={() => setAiVisible(false)}>
        <View style={s.aiOverlay}>
          <View style={s.aiCard}>
            <Text style={s.aiTitle}>Generar receta con IA</Text>
            <Text style={s.aiSubtitle}>
              Describe plato, ingredientes o macros. Límite: 10 generaciones/día.
            </Text>
            <TextInput
              style={s.aiInput}
              value={aiPrompt}
              onChangeText={setAiPrompt}
              placeholder="Ej: bowl de pollo con quinoa y aguacate, alto en proteína, ~500 kcal"
              placeholderTextColor={T3}
              multiline
            />
            <Text style={s.aiCategory}>Categoría: {form.category}</Text>
            <TouchableOpacity
              style={[s.aiBtn, aiLoading && s.aiBtnDisabled]}
              onPress={handleGenerate}
              disabled={aiLoading}
              activeOpacity={0.85}
            >
              {aiLoading ? (
                <ActivityIndicator color={BG} />
              ) : (
                <Text style={s.aiBtnText}>Generar receta</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={s.aiCancel} onPress={() => setAiVisible(false)}>
              <Text style={s.aiCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Input({ label, value, onChangeText, placeholder, keyboardType = 'default' }) {
  return (
    <View style={s.inputWrap}>
      <Text style={s.inputLabel}>{label}</Text>
      <TextInput
        style={s.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={T3}
        keyboardType={keyboardType}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  loading: { flex: 1, backgroundColor: BG, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16, gap: 12 },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: T1 },

  scroll: { padding: 20 },
  sectionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 2, color: T3, textTransform: 'uppercase', marginTop: 20, marginBottom: 10 },

  macrosRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },

  inputWrap: { marginBottom: 14 },
  inputLabel: { fontSize: 12, color: T2, fontWeight: '600', marginBottom: 6 },
  input: { backgroundColor: SURFACE, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: T1, fontSize: 14, borderWidth: 1, borderColor: BORDER },

  categoriesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  categoryBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER },
  categoryBtnActive: { backgroundColor: ACCENT, borderColor: ACCENT },
  categoryBtnText: { fontSize: 12, fontWeight: '700', color: T2 },
  categoryBtnTextActive: { color: BG },

  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  tagInput: { flex: 1, backgroundColor: SURFACE, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: T1, fontSize: 13, borderWidth: 1, borderColor: BORDER },

  ingredientRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  stepNumber: { width: 28, height: 28, borderRadius: 14, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center', marginRight: 8, marginTop: 8 },
  stepNumberText: { fontSize: 12, fontWeight: '800', color: BG },

  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: SURFACE, borderRadius: 12, paddingVertical: 12, borderWidth: 1, borderColor: ACCENT + '40', marginBottom: 14 },
  addBtnText: { fontSize: 13, color: ACCENT, fontWeight: '700' },

  saveBtn: { backgroundColor: ACCENT, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 20 },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontSize: 15, fontWeight: '800', color: BG },

  aiGenBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: ACCENT, borderRadius: 14, paddingVertical: 15, marginBottom: 4 },
  aiGenBtnText: { fontSize: 15, fontWeight: '800', color: BG },

  aiOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  aiCard: { width: '100%', backgroundColor: SURFACE, borderRadius: 18, padding: 20, borderWidth: 1, borderColor: BORDER },
  aiTitle: { fontSize: 17, fontWeight: '800', color: T1, marginBottom: 6 },
  aiSubtitle: { fontSize: 13, color: T2, lineHeight: 19, marginBottom: 14 },
  aiInput: { minHeight: 90, backgroundColor: BG, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: T1, fontSize: 14, borderWidth: 1, borderColor: BORDER, textAlignVertical: 'top' },
  aiCategory: { fontSize: 12, color: T2, fontWeight: '600', marginTop: 12, marginBottom: 4 },
  aiBtn: { backgroundColor: ACCENT, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 12 },
  aiBtnDisabled: { opacity: 0.6 },
  aiBtnText: { fontSize: 14, fontWeight: '800', color: BG },
  aiCancel: { alignItems: 'center', paddingVertical: 12, marginTop: 4 },
  aiCancelText: { fontSize: 14, color: T2, fontWeight: '600' },
});