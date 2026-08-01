// src/screens/admin/AdminArticleFormScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';

const ACCENT = '#C0FF3E';
const BG = '#0D0D0D';
const SURFACE = '#161616';
const BORDER = '#FFFFFF0D';
const T1 = '#FFFFFF';
const T2 = '#A0A0A0';
const T3 = '#555555';

const CATEGORIES = [
  { name: 'Nutrición', color: '#C0FF3E' },
  { name: 'Técnica', color: '#3EE5FF' },
  { name: 'Entrenamiento', color: '#FF6B3E' },
  { name: 'Recuperación', color: '#8B7CFF' },
];

export default function AdminArticleFormScreen() {
  const { id } = useLocalSearchParams();
  const isEditing = !!id;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    category: 'Nutrición',
    category_color: '#C0FF3E',
    read_time: '',
    author: '',
    published_at: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', ''),
    intro: '',
    sections: [],
    key_takeaways: [],
  });

  useEffect(() => {
    if (isEditing) loadArticle();
  }, [id]);

  async function loadArticle() {
    setLoading(true);
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      Alert.alert('Error', 'No se encontró el artículo');
      router.back();
      return;
    }

    setForm({
      title: data.title,
      category: data.category,
      category_color: data.category_color,
      read_time: data.read_time,
      author: data.author,
      published_at: data.published_at,
      intro: data.intro,
      sections: data.sections || [],
      key_takeaways: data.key_takeaways || [],
    });
    setLoading(false);
  }

  function updateField(key, value) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function selectCategory(cat) {
    setForm(prev => ({ ...prev, category: cat.name, category_color: cat.color }));
  }

  function addSection() {
    setForm(prev => ({
      ...prev,
      sections: [...prev.sections, { title: '', content: [{ subtitle: '', text: '' }] }]
    }));
  }

  function updateSection(idx, field, value) {
    setForm(prev => {
      const newSections = [...prev.sections];
      newSections[idx] = { ...newSections[idx], [field]: value };
      return { ...prev, sections: newSections };
    });
  }

  function deleteSection(idx) {
    setForm(prev => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== idx)
    }));
  }

  function addContentItem(sectionIdx) {
    setForm(prev => {
      const newSections = [...prev.sections];
      newSections[sectionIdx] = {
        ...newSections[sectionIdx],
        content: [...newSections[sectionIdx].content, { subtitle: '', text: '' }]
      };
      return { ...prev, sections: newSections };
    });
  }

  function updateContentItem(sectionIdx, itemIdx, field, value) {
    setForm(prev => {
      const newSections = [...prev.sections];
      const newContent = [...newSections[sectionIdx].content];
      newContent[itemIdx] = { ...newContent[itemIdx], [field]: value };
      newSections[sectionIdx] = { ...newSections[sectionIdx], content: newContent };
      return { ...prev, sections: newSections };
    });
  }

  function deleteContentItem(sectionIdx, itemIdx) {
    setForm(prev => {
      const newSections = [...prev.sections];
      newSections[sectionIdx] = {
        ...newSections[sectionIdx],
        content: newSections[sectionIdx].content.filter((_, i) => i !== itemIdx)
      };
      return { ...prev, sections: newSections };
    });
  }

  function addTakeaway() {
    setForm(prev => ({
      ...prev,
      key_takeaways: [...prev.key_takeaways, '']
    }));
  }

  function updateTakeaway(idx, value) {
    setForm(prev => {
      const newTakeaways = [...prev.key_takeaways];
      newTakeaways[idx] = value;
      return { ...prev, key_takeaways: newTakeaways };
    });
  }

  function deleteTakeaway(idx) {
    setForm(prev => ({
      ...prev,
      key_takeaways: prev.key_takeaways.filter((_, i) => i !== idx)
    }));
  }

  async function handleSave() {
    // Validaciones
    if (!form.title.trim()) return Alert.alert('Error', 'El título es obligatorio');
    if (!form.read_time.trim()) return Alert.alert('Error', 'El tiempo de lectura es obligatorio');
    if (!form.author.trim()) return Alert.alert('Error', 'El autor es obligatorio');
    if (!form.intro.trim()) return Alert.alert('Error', 'La introducción es obligatoria');
    if (form.sections.length === 0) return Alert.alert('Error', 'Agrega al menos una sección');

    setSaving(true);

    const payload = {
      title: form.title.trim(),
      category: form.category,
      category_color: form.category_color,
      read_time: form.read_time.trim(),
      author: form.author.trim(),
      published_at: form.published_at,
      intro: form.intro.trim(),
      sections: form.sections,
      key_takeaways: form.key_takeaways,
      updated_at: new Date().toISOString(),
    };

    let error;
    if (isEditing) {
      ({ error } = await supabase.from('articles').update(payload).eq('id', id));
    } else {
      ({ error } = await supabase.from('articles').insert(payload));
    }

    setSaving(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert(
        '¡Éxito!',
        isEditing ? 'Artículo actualizado' : 'Artículo publicado',
        [{ text: 'OK', onPress: () => router.back() }]
      );
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
        <Text style={s.headerTitle}>{isEditing ? 'Editar artículo' : 'Nuevo artículo'}</Text>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* INFORMACIÓN BÁSICA */}
        <Text style={s.sectionLabel}>INFORMACIÓN BÁSICA</Text>
        <Input label="Título *" value={form.title} onChangeText={v => updateField('title', v)} placeholder="Ej: Guía completa de suplementos" />
        <Input label="Autor *" value={form.author} onChangeText={v => updateField('author', v)} placeholder="Ej: Dr. Carlos Fitness" />
        <Input label="Tiempo de lectura *" value={form.read_time} onChangeText={v => updateField('read_time', v)} placeholder="Ej: 6 min" />
        <Input label="Fecha de publicación" value={form.published_at} onChangeText={v => updateField('published_at', v)} />

        {/* CATEGORÍA */}
        <Text style={s.sectionLabel}>CATEGORÍA</Text>
        <View style={s.categoriesRow}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.name}
              style={[s.categoryBtn, form.category === cat.name && { backgroundColor: cat.color + '22', borderColor: cat.color }]}
              onPress={() => selectCategory(cat)}
              activeOpacity={0.8}
            >
              <Text style={[s.categoryBtnText, form.category === cat.name && { color: cat.color }]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* INTRODUCCIÓN */}
        <Text style={s.sectionLabel}>INTRODUCCIÓN</Text>
        <TextArea label="Introducción *" value={form.intro} onChangeText={v => updateField('intro', v)} placeholder="Resumen del artículo..." height={100} />

        {/* SECCIONES */}
        <Text style={s.sectionLabel}>SECCIONES DEL ARTÍCULO</Text>
        {form.sections.map((section, sIdx) => (
          <View key={sIdx} style={s.sectionCard}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionCardTitle}>Sección {sIdx + 1}</Text>
              <TouchableOpacity onPress={() => deleteSection(sIdx)}>
                <Ionicons name="trash-outline" size={18} color="#FF453A" />
              </TouchableOpacity>
            </View>
            <Input label="Título de sección *" value={section.title} onChangeText={v => updateSection(sIdx, 'title', v)} placeholder="Ej: Los que SÍ funcionan" />

            <Text style={s.subLabel}>Contenido</Text>
            {section.content.map((item, iIdx) => (
              <View key={iIdx} style={s.contentItem}>
                <View style={s.contentHeader}>
                  <Text style={s.contentItemLabel}>Punto {iIdx + 1}</Text>
                  <TouchableOpacity onPress={() => deleteContentItem(sIdx, iIdx)}>
                    <Ionicons name="close-circle-outline" size={18} color={T3} />
                  </TouchableOpacity>
                </View>
                <Input label="Subtítulo" value={item.subtitle} onChangeText={v => updateContentItem(sIdx, iIdx, 'subtitle', v)} placeholder="Ej: Creatina" />
                <TextArea label="Texto" value={item.text} onChangeText={v => updateContentItem(sIdx, iIdx, 'text', v)} placeholder="Explicación..." height={80} />
              </View>
            ))}
            <TouchableOpacity style={s.addContentBtn} onPress={() => addContentItem(sIdx)}>
              <Ionicons name="add-circle-outline" size={16} color={ACCENT} />
              <Text style={s.addContentBtnText}>Agregar punto</Text>
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity style={s.addSectionBtn} onPress={addSection}>
          <Ionicons name="add" size={18} color={ACCENT} />
          <Text style={s.addSectionBtnText}>Agregar sección</Text>
        </TouchableOpacity>

        {/* KEY TAKEAWAYS */}
        <Text style={s.sectionLabel}>PUNTOS CLAVE</Text>
        {form.key_takeaways.map((takeaway, idx) => (
          <View key={idx} style={s.takeawayRow}>
            <TextInput
              style={s.takeawayInput}
              value={takeaway}
              onChangeText={v => updateTakeaway(idx, v)}
              placeholder="Punto clave..."
              placeholderTextColor={T3}
              multiline
            />
            <TouchableOpacity onPress={() => deleteTakeaway(idx)}>
              <Ionicons name="close-circle-outline" size={22} color={T3} />
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity style={s.addSectionBtn} onPress={addTakeaway}>
          <Ionicons name="add" size={18} color={ACCENT} />
          <Text style={s.addSectionBtnText}>Agregar punto clave</Text>
        </TouchableOpacity>

        {/* BOTÓN GUARDAR */}
        <TouchableOpacity
          style={[s.saveBtn, saving && s.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          <Text style={s.saveBtnText}>
            {saving ? 'Guardando...' : (isEditing ? 'Actualizar artículo' : 'Publicar artículo')}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function Input({ label, value, onChangeText, placeholder }) {
  return (
    <View style={s.inputWrap}>
      <Text style={s.inputLabel}>{label}</Text>
      <TextInput
        style={s.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={T3}
      />
    </View>
  );
}

function TextArea({ label, value, onChangeText, placeholder, height = 80 }) {
  return (
    <View style={s.inputWrap}>
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
  container: { flex: 1, backgroundColor: BG },
  loading: { flex: 1, backgroundColor: BG, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16, gap: 12 },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: T1 },

  scroll: { padding: 20 },
  sectionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 2, color: T3, textTransform: 'uppercase', marginTop: 20, marginBottom: 10 },

  inputWrap: { marginBottom: 14 },
  inputLabel: { fontSize: 12, color: T2, fontWeight: '600', marginBottom: 6 },
  input: { backgroundColor: SURFACE, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: T1, fontSize: 14, borderWidth: 1, borderColor: BORDER },

  categoriesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  categoryBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER },
  categoryBtnText: { fontSize: 12, fontWeight: '700', color: T2 },

  subLabel: { fontSize: 11, color: T3, fontWeight: '600', marginTop: 8, marginBottom: 8, letterSpacing: 0.5 },

  sectionCard: { backgroundColor: SURFACE, borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: BORDER },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionCardTitle: { fontSize: 13, fontWeight: '700', color: ACCENT },

  contentItem: { backgroundColor: BG, borderRadius: 10, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: BORDER },
  contentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  contentItemLabel: { fontSize: 10, color: T3, fontWeight: '600' },

  addContentBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, alignSelf: 'flex-start' },
  addContentBtnText: { fontSize: 12, color: ACCENT, fontWeight: '600' },

  addSectionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: SURFACE, borderRadius: 12, paddingVertical: 12, borderWidth: 1, borderColor: ACCENT + '40', marginBottom: 14 },
  addSectionBtnText: { fontSize: 13, color: ACCENT, fontWeight: '700' },

  takeawayRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  takeawayInput: { flex: 1, backgroundColor: SURFACE, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: T1, fontSize: 13, borderWidth: 1, borderColor: BORDER, textAlignVertical: 'top' },

  saveBtn: { backgroundColor: ACCENT, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 20 },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontSize: 15, fontWeight: '800', color: BG },
});