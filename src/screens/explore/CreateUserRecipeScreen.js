// src/screens/explore/CreateUserRecipeScreen.js
import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';

const ACCENT = '#C0FF3E';
const BG = '#0D0D0D';
const SURFACE = '#161616';
const SURFACE2 = '#1E1E1E';
const BORDER = '#FFFFFF0D';
const T1 = '#FFFFFF';
const T2 = '#A0A0A0';
const T3 = '#555555';

export default function CreateUserRecipeScreen() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    recipe_name: '',
    author_name: '',
    time: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    ingredients: '',
    steps: '',
  });

  const updateForm = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  async function handleSubmit() {
    // 1. Validaciones estrictas
    if (!form.recipe_name.trim()) return Alert.alert('Error', 'El nombre de la receta es obligatorio');
    if (!form.time.trim()) return Alert.alert('Error', 'El tiempo de preparación es obligatorio');
    if (!form.calories || isNaN(form.calories)) return Alert.alert('Error', 'Ingresa calorías válidas (números)');
    if (!form.protein || isNaN(form.protein)) return Alert.alert('Error', 'Ingresa proteína válida (números)');
    if (!form.carbs || isNaN(form.carbs)) return Alert.alert('Error', 'Ingresa carbohidratos válidos (números)');
    if (!form.fat || isNaN(form.fat)) return Alert.alert('Error', 'Ingresa grasas válidas (números)');
    if (!form.ingredients.trim()) return Alert.alert('Error', 'Debes listar al menos un ingrediente');
    if (!form.steps.trim()) return Alert.alert('Error', 'Debes escribir los pasos de preparación');

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      Alert.alert('Error', 'Debes iniciar sesión');
      setLoading(false);
      return;
    }

    const author = form.author_name.trim() || user.email?.split('@')[0] || 'Usuario Anónimo';

    const { error } = await supabase.from('user_recipes').insert({
      user_id: user.id,
      author_name: author,
      recipe_name: form.recipe_name.trim(),
      description: `Receta creada por la comunidad. Tiempo: ${form.time}.`,
      calories: parseInt(form.calories),
      protein: parseInt(form.protein),
      carbs: parseInt(form.carbs),
      fat: parseInt(form.fat),
      time: form.time.trim(),
      ingredients: form.ingredients.trim(),
      steps: form.steps.trim(),
      status: 'approved',
    });

    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('¡Éxito!', 'Tu receta ha sido publicada para toda la comunidad.');
      router.back();
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: BG }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={24} color={T1} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Compartir Receta</Text>
        </View>

        <Text style={s.sectionTitle}>Información Básica</Text>
        <Input label="Nombre de la receta *" value={form.recipe_name} onChangeText={v => updateForm('recipe_name', v)} placeholder="Ej: Tostadas de aguacate fit" />
        <Input label="Tu nombre o usuario (opcional)" value={form.author_name} onChangeText={v => updateForm('author_name', v)} placeholder="Ej: @fitjuan" />
        <Input label="Tiempo de preparación *" value={form.time} onChangeText={v => updateForm('time', v)} placeholder="Ej: 15 min" />

        <Text style={s.sectionTitle}>Macronutrientes (por porción) *</Text>
        <View style={s.macrosRow}>
          <Input label="Kcal" value={form.calories} onChangeText={v => updateForm('calories', v)} placeholder="0" keyboardType="numeric" small />
          <Input label="Proteína (g)" value={form.protein} onChangeText={v => updateForm('protein', v)} placeholder="0" keyboardType="numeric" small />
        </View>
        <View style={s.macrosRow}>
          <Input label="Carbos (g)" value={form.carbs} onChangeText={v => updateForm('carbs', v)} placeholder="0" keyboardType="numeric" small />
          <Input label="Grasas (g)" value={form.fat} onChangeText={v => updateForm('fat', v)} placeholder="0" keyboardType="numeric" small />
        </View>

        <Text style={s.sectionTitle}>Contenido *</Text>
        <TextArea label="Ingredientes (separados por coma o saltos de línea)" value={form.ingredients} onChangeText={v => updateForm('ingredients', v)} placeholder="Ej: 2 huevos, 1 rebanada de pan integral..." />
        <TextArea label="Pasos de preparación" value={form.steps} onChangeText={v => updateForm('steps', v)} placeholder="1. Calentar la sartén...\n2. Cocinar los huevos..." height={120} />

        <TouchableOpacity style={[s.submitBtn, loading && s.submitBtnDisabled]} onPress={handleSubmit} disabled={loading} activeOpacity={0.8}>
          <Text style={s.submitBtnText}>{loading ? 'Publicando...' : 'Publicar Receta'}</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Input({ label, value, onChangeText, placeholder, keyboardType = 'default', small = false }) {
  return (
    <View style={[s.inputWrap, small && s.inputWrapSmall]}>
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

function TextArea({ label, value, onChangeText, placeholder, height = 80 }) {
  return (
    <View style={[s.inputWrap, { marginBottom: 16 }]}>
      <Text style={s.inputLabel}>{label}</Text>
      <TextInput
        style={[s.input, { height, textAlignVertical: 'top' }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={T3}
        multiline
      />
    </View>
  );
}

const s = StyleSheet.create({
  scroll: { padding: 20, paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: T1 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: ACCENT, marginBottom: 12, marginTop: 8 },
  inputWrap: { marginBottom: 16 },
  inputWrapSmall: { flex: 1 },
  macrosRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  inputLabel: { fontSize: 12, color: T2, fontWeight: '600', marginBottom: 6 },
  input: { backgroundColor: SURFACE, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: T1, fontSize: 15, borderWidth: 1, borderColor: BORDER },
  submitBtn: { backgroundColor: ACCENT, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 12 },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { fontSize: 16, fontWeight: '800', color: BG },
});