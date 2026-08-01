// src/screens/admin/AdminTrendFormScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, ActivityIndicator, Image,
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
const PURPLE = '#8B7CFF';
const ORANGE = '#FF6B3E';
const CYAN = '#3EE5FF';

const LEVELS = ['Principiante', 'Intermedio', 'Avanzado'];
const BADGES = ['Ninguno', 'popular', 'nuevo', 'ia', 'verificado'];

const AVAILABLE_IMAGES = [
  { id: 'abs', label: 'Abs', source: require('../../../assets/wmremove-transformed.png') },
  { id: 'hipertrofia', label: 'Hipertrofia', source: require('../../../assets/hiperftrofia.png') },
  { id: 'funcional', label: 'Funcional', source: require('../../../assets/funcional.png') },
  { id: 'upper', label: 'Upper', source: require('../../../assets/upper.png') },
  { id: 'ppl', label: 'PPL', source: require('../../../assets/PPL.png') },
  { id: 'fullbody', label: 'Full Body', source: require('../../../assets/fullbody.png') },
  { id: '5x5', label: '5x5', source: require('../../../assets/5x5.png') },
  { id: '30dias', label: '30 Días', source: require('../../../assets/30diashipertrofia.png') },
];

const CONTENT_TYPES = [
  { id: 'link', icon: 'link', label: 'Solo enlace', desc: 'Enlazar a contenido existente' },
  { id: 'challenge', icon: 'trophy', label: 'Reto nuevo', desc: 'Crear reto completo' },
  { id: 'routine', icon: 'barbell', label: 'Rutina nueva', desc: 'Crear rutina + tendencia' },
  { id: 'article', icon: 'book', label: 'Artículo nuevo', desc: 'Crear artículo + tendencia' },
  { id: 'recipe', icon: 'restaurant', label: 'Receta nueva', desc: 'Crear receta + tendencia' },
];

export default function AdminTrendFormScreen() {
  const { id } = useLocalSearchParams();
  const isEditing = !!id;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [contentType, setContentType] = useState('link');
  
  const [form, setForm] = useState({
    title: '', level: 'Intermedio', rating: '4.5', users: '0',
    badge: 'Ninguno', route: '', position: '1', is_active: true, image_id: 'abs',
     show_in_see_all: true, // ✅ NUEVO
  });

  // ✅ DATOS COMPLETOS DEL RETO
  const [challengeData, setChallengeData] = useState({
    subtitle: '',
    description: '',
    duration: '30',
    frequency: '4 días/sem',
    session_time: '60 min',
    objectives: [''],
    phases: [
      { title: '', week: '', focus: '', color: ACCENT },
    ],
    days: [
      { 
        name: 'DÍA A', 
        type: '', 
        exercises: [{ name: '', sets: '3', reps: '10', rest: '60s' }] 
      },
    ],
  });

  const [routineData, setRoutineData] = useState({ description: '', frequency: '3 días/sem' });
  const [articleData, setArticleData] = useState({ category: 'Nutrición', author: '', intro: '', content: '' });
  const [recipeData, setRecipeData] = useState({ calories: '', protein: '', carbs: '', fat: '', time: '', ingredients: '', steps: '' });

  useEffect(() => {
    if (isEditing) loadTrend();
  }, [id]);

async function loadTrend() {
  setLoading(true);
  
  const { data, error } = await supabase.from('trends').select('*').eq('id', id).single();
  
  if (error || !data) { 
    Alert.alert('Error', 'No se encontró'); 
    router.back(); 
    return; 
  }
  
  setForm({
    title: data.title, 
    level: data.level, 
    rating: String(data.rating), 
    users: data.users,
    badge: data.badge || 'Ninguno', 
    route: data.route, 
    position: String(data.position),
    is_active: data.is_active, 
    image_id: data.image_id || 'abs',
    show_in_see_all: data.show_in_see_all !== false // <- Movido adentro de setForm
  });
  
  setLoading(false);
}

  function updateField(key, value) { setForm(prev => ({ ...prev, [key]: value })); }

  // ✅ FUNCIONES PARA MANEJAR OBJETIVOS
  function addObjective() {
    setChallengeData(prev => ({ ...prev, objectives: [...prev.objectives, ''] }));
  }
  function updateObjective(idx, value) {
    setChallengeData(prev => {
      const newObj = [...prev.objectives];
      newObj[idx] = value;
      return { ...prev, objectives: newObj };
    });
  }
  function deleteObjective(idx) {
    setChallengeData(prev => ({ ...prev, objectives: prev.objectives.filter((_, i) => i !== idx) }));
  }

  // ✅ FUNCIONES PARA MANEJAR FASES
  function addPhase() {
    setChallengeData(prev => ({ 
      ...prev, 
      phases: [...prev.phases, { title: '', week: '', focus: '', color: ACCENT }] 
    }));
  }
  function updatePhase(idx, field, value) {
    setChallengeData(prev => {
      const newPhases = [...prev.phases];
      newPhases[idx] = { ...newPhases[idx], [field]: value };
      return { ...prev, phases: newPhases };
    });
  }
  function deletePhase(idx) {
    setChallengeData(prev => ({ ...prev, phases: prev.phases.filter((_, i) => i !== idx) }));
  }

  // ✅ FUNCIONES PARA MANEJAR DÍAS
  function addDay() {
    setChallengeData(prev => ({ 
      ...prev, 
      days: [...prev.days, { name: `DÍA ${String.fromCharCode(66 + prev.days.length)}`, type: '', exercises: [{ name: '', sets: '3', reps: '10', rest: '60s' }] }] 
    }));
  }
  function updateDay(idx, field, value) {
    setChallengeData(prev => {
      const newDays = [...prev.days];
      newDays[idx] = { ...newDays[idx], [field]: value };
      return { ...prev, days: newDays };
    });
  }
  function deleteDay(idx) {
    setChallengeData(prev => ({ ...prev, days: prev.days.filter((_, i) => i !== idx) }));
  }

  // ✅ FUNCIONES PARA MANEJAR EJERCICIOS DENTRO DE DÍAS
  function addExercise(dayIdx) {
    setChallengeData(prev => {
      const newDays = [...prev.days];
      newDays[dayIdx] = {
        ...newDays[dayIdx],
        exercises: [...newDays[dayIdx].exercises, { name: '', sets: '3', reps: '10', rest: '60s' }]
      };
      return { ...prev, days: newDays };
    });
  }
  function updateExercise(dayIdx, exIdx, field, value) {
    setChallengeData(prev => {
      const newDays = [...prev.days];
      const newExercises = [...newDays[dayIdx].exercises];
      newExercises[exIdx] = { ...newExercises[exIdx], [field]: value };
      newDays[dayIdx] = { ...newDays[dayIdx], exercises: newExercises };
      return { ...prev, days: newDays };
    });
  }
  function deleteExercise(dayIdx, exIdx) {
    setChallengeData(prev => {
      const newDays = [...prev.days];
      newDays[dayIdx] = {
        ...newDays[dayIdx],
        exercises: newDays[dayIdx].exercises.filter((_, i) => i !== exIdx)
      };
      return { ...prev, days: newDays };
    });
  }

 async function handleSave() {
  if (!form.title.trim()) {
    return Alert.alert('Error', 'El título es obligatorio');
  }
  
  setSaving(true);

  try {
    let finalRoute = form.route;

    // Un switch suele ser más fácil de leer que muchos if/else if
    switch (contentType) {
      case 'challenge':
        finalRoute = await createChallenge();
        if (!finalRoute) throw new Error('Error creando reto');
        break;
      case 'routine':
        finalRoute = await createRoutine();
        if (!finalRoute) throw new Error('Error creando rutina');
        break;
      case 'article':
        finalRoute = await createArticle();
        if (!finalRoute) throw new Error('Error creando artículo');
        break;
      case 'recipe':
        finalRoute = await createRecipe();
        if (!finalRoute) throw new Error('Error creando receta');
        break;
    }

    if (!finalRoute) {
      // Usamos throw para que el catch maneje todos los errores por igual
      throw new Error('Debes seleccionar o crear una ruta');
    }

    // Agregamos show_in_see_all al payload
    const payload = {
      title: form.title.trim(), 
      level: form.level,
      rating: parseFloat(form.rating) || 4.5, 
      users: form.users,
      badge: form.badge === 'Ninguno' ? null : form.badge,
      route: finalRoute, 
      position: parseInt(form.position) || 1,
      is_active: form.is_active, 
      image_id: form.image_id,
      show_in_see_all: form.show_in_see_all // <- AÑADIDO AQUÍ
    };

    let error;
    if (isEditing) {
      ({ error } = await supabase.from('trends').update(payload).eq('id', id));
    } else {
      ({ error } = await supabase.from('trends').insert(payload));
    }

    if (error) throw error;

    // Mensaje dinámico según si es edición o creación
    const successMessage = isEditing ? 'Actualizado correctamente' : 'Creado correctamente';
    Alert.alert('¡Éxito!', successMessage, [{ text: 'OK', onPress: () => router.back() }]);

  } catch (err) {
    Alert.alert('Error', err.message);
  } finally {
    setSaving(false);
  }
}

  // ✅ CREAR RETO COMPLETO CON TODA LA INFO
  async function createChallenge() {
    if (!challengeData.description.trim()) {
      Alert.alert('Error', 'La descripción es obligatoria');
      return null;
    }

    const { data, error } = await supabase
      .from('challenges')
      .insert({
        name: form.title.trim(),
        subtitle: challengeData.subtitle.trim(),
        description: challengeData.description.trim(),
        duration_days: parseInt(challengeData.duration) || 30,
        level: form.level,
        frequency: challengeData.frequency,
        session_time: challengeData.session_time,
        image_id: form.image_id,
        status: 'active',
        exercise_ids: [],
        objectives: challengeData.objectives.filter(o => o.trim()),
        phases: challengeData.phases.filter(p => p.title.trim()),
        days: challengeData.days.map(d => ({
          ...d,
          exercises: d.exercises.filter(e => e.name.trim())
        })).filter(d => d.exercises.length > 0),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creando reto:', error);
      Alert.alert('Error al crear reto', error.message);
      return null;
    }

    return `/explore/challenge-dynamic?id=${data.id}`;
  }

  async function createRoutine() {
    if (!routineData.description.trim()) { Alert.alert('Error', 'Descripción obligatoria'); return null; }
    const { data, error } = await supabase.from('public_routines').insert({
      name: form.title.trim(), description: routineData.description.trim(),
      frequency: routineData.frequency, level: form.level, image_id: form.image_id,
    }).select().single();
    if (error) { Alert.alert('Error', error.message); return null; }
    return `/explore/public-routine-detail?id=${data.id}`;
  }

  async function createArticle() {
    if (!articleData.author.trim() || !articleData.intro.trim()) { Alert.alert('Error', 'Autor e intro obligatorios'); return null; }
    const categoryColors = { 'Nutrición': '#C0FF3E', 'Técnica': '#3EE5FF', 'Entrenamiento': '#FF6B3E', 'Recuperación': '#8B7CFF' };
    const { data, error } = await supabase.from('articles').insert({
      title: form.title.trim(), category: articleData.category,
      category_color: categoryColors[articleData.category], read_time: '5 min',
      author: articleData.author.trim(),
      published_at: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }),
      intro: articleData.intro.trim(),
      sections: [{ title: 'Contenido', content: [{ subtitle: '', text: articleData.content }] }],
      key_takeaways: [],
    }).select().single();
    if (error) { Alert.alert('Error', error.message); return null; }
    return `/explore/article-detail?id=${data.id}`;
  }

  async function createRecipe() {
    if (!recipeData.calories || !recipeData.protein || !recipeData.carbs || !recipeData.fat) {
      Alert.alert('Error', 'Todos los macros son obligatorios'); return null;
    }
    const { data, error } = await supabase.from('recipes_ia').insert({
      name: form.title.trim(), subtitle: '', category: 'Almuerzo', difficulty: 'Fácil',
      time: recipeData.time || '15 min', servings: 1, description: '',
      calories: parseInt(recipeData.calories), protein: parseInt(recipeData.protein),
      carbs: parseInt(recipeData.carbs), fat: parseInt(recipeData.fat),
      tags: [],
      ingredients: recipeData.ingredients.split(',').map(i => ({ name: i.trim(), amount: '' })).filter(i => i.name),
      steps: recipeData.steps.split('\n').filter(s => s.trim()), tips: '',
    }).select().single();
    if (error) { Alert.alert('Error', error.message); return null; }
    return `/explore/recipe-detail?id=${data.id}`;
  }

  if (loading) return <View style={s.loading}><ActivityIndicator size="large" color={ACCENT} /></View>;

  const selectedImage = AVAILABLE_IMAGES.find(img => img.id === form.image_id);

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color={T1} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{isEditing ? 'Editar tendencia' : 'Nueva tendencia'}</Text>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {!isEditing && (
          <>
            <Text style={s.sectionLabel}>TIPO DE CONTENIDO</Text>
            <View style={s.typeGrid}>
              {CONTENT_TYPES.map(type => (
                <TouchableOpacity
                  key={type.id}
                  style={[s.typeCard, contentType === type.id && s.typeCardActive]}
                  onPress={() => setContentType(type.id)}
                  activeOpacity={0.8}
                >
                  <Ionicons name={type.icon} size={24} color={contentType === type.id ? ACCENT : T2} />
                  <Text style={[s.typeLabel, contentType === type.id && s.typeLabelActive]}>{type.label}</Text>
                  <Text style={s.typeDesc}>{type.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <Text style={s.sectionLabel}>IMAGEN</Text>
        <View style={s.imagePreview}>
          {selectedImage && <Image source={selectedImage.source} style={s.previewImage} />}
        </View>
        <View style={s.imageGrid}>
          {AVAILABLE_IMAGES.map(img => (
            <TouchableOpacity
              key={img.id}
              style={[s.imageOption, form.image_id === img.id && s.imageOptionActive]}
              onPress={() => updateField('image_id', img.id)}
              activeOpacity={0.8}
            >
              <Image source={img.source} style={s.imageOptionImg} />
              <Text style={[s.imageOptionLabel, form.image_id === img.id && s.imageOptionLabelActive]}>{img.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.sectionLabel}>INFORMACIÓN</Text>
        <Input label="Título *" value={form.title} onChangeText={v => updateField('title', v)} placeholder="Nombre del contenido" />
        
        <View style={s.row}>
          <View style={{ flex: 1 }}>
            <Input label="Rating" value={form.rating} onChangeText={v => updateField('rating', v)} placeholder="4.5" keyboardType="decimal-pad" />
          </View>
          <View style={{ flex: 1 }}>
            <Input label="Usuarios" value={form.users} onChangeText={v => updateField('users', v)} placeholder="0" />
          </View>
        </View>

        <Text style={s.sectionLabel}>NIVEL</Text>
        <View style={s.optionsRow}>
          {LEVELS.map(level => (
            <TouchableOpacity
              key={level}
              style={[s.optionBtn, form.level === level && s.optionBtnActive]}
              onPress={() => updateField('level', level)}
              activeOpacity={0.8}
            >
              <Text style={[s.optionBtnText, form.level === level && s.optionBtnTextActive]}>{level}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.sectionLabel}>BADGE</Text>
        <View style={s.optionsRow}>
          {BADGES.map(badge => (
            <TouchableOpacity
              key={badge}
              style={[s.optionBtn, form.badge === badge && s.optionBtnActive]}
              onPress={() => updateField('badge', badge)}
              activeOpacity={0.8}
            >
              <Text style={[s.optionBtnText, form.badge === badge && s.optionBtnTextActive]}>
                {badge === 'Ninguno' ? 'Sin badge' : badge}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ✅ FORMULARIO COMPLETO DE RETO */}
        {contentType === 'challenge' && (
          <>
            <Text style={s.sectionLabel}>DATOS DEL RETO</Text>
            <Input label="Subtítulo" value={challengeData.subtitle} onChangeText={v => setChallengeData(p => ({ ...p, subtitle: v }))} placeholder="Ej: Core de acero en un mes" />
            <TextArea label="Descripción *" value={challengeData.description} onChangeText={v => setChallengeData(p => ({ ...p, description: v }))} placeholder="¿De qué trata el reto?" height={100} />
            
            <View style={s.row}>
              <View style={{ flex: 1 }}>
                <Input label="Duración (días)" value={challengeData.duration} onChangeText={v => setChallengeData(p => ({ ...p, duration: v }))} placeholder="30" keyboardType="numeric" />
              </View>
              <View style={{ flex: 1 }}>
                <Input label="Frecuencia" value={challengeData.frequency} onChangeText={v => setChallengeData(p => ({ ...p, frequency: v }))} placeholder="4 días/sem" />
              </View>
            </View>
            <Input label="Tiempo por sesión" value={challengeData.session_time} onChangeText={v => setChallengeData(p => ({ ...p, session_time: v }))} placeholder="60 min" />

            {/* OBJETIVOS */}
            <Text style={s.sectionLabel}>🎯 LO QUE LOGRARÁS</Text>
            {challengeData.objectives.map((obj, idx) => (
              <View key={idx} style={s.itemRow}>
                <TextInput
                  style={[s.input, { flex: 1 }]}
                  value={obj}
                  onChangeText={v => updateObjective(idx, v)}
                  placeholder="Ej: Aumentar fuerza del core"
                  placeholderTextColor={T3}
                />
                <TouchableOpacity onPress={() => deleteObjective(idx)} style={s.deleteBtn}>
                  <Ionicons name="close-circle" size={22} color="#FF453A" />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={s.addBtn} onPress={addObjective}>
              <Ionicons name="add-circle" size={18} color={ACCENT} />
              <Text style={s.addBtnText}>Agregar objetivo</Text>
            </TouchableOpacity>

            {/* FASES */}
            <Text style={s.sectionLabel}>📊 FASES DEL PROGRAMA</Text>
            {challengeData.phases.map((phase, idx) => (
              <View key={idx} style={s.phaseCard}>
                <View style={s.phaseHeader}>
                  <Text style={s.phaseTitle}>Fase {idx + 1}</Text>
                  <TouchableOpacity onPress={() => deletePhase(idx)}>
                    <Ionicons name="trash" size={18} color="#FF453A" />
                  </TouchableOpacity>
                </View>
                <Input label="Título" value={phase.title} onChangeText={v => updatePhase(idx, 'title', v)} placeholder="Ej: Activación" />
                <View style={s.row}>
                  <View style={{ flex: 1 }}>
                    <Input label="Semana" value={phase.week} onChangeText={v => updatePhase(idx, 'week', v)} placeholder="Semana 1" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Input label="Enfoque" value={phase.focus} onChangeText={v => updatePhase(idx, 'focus', v)} placeholder="Técnica" />
                  </View>
                </View>
                <Text style={s.miniLabel}>Color</Text>
                <View style={s.colorRow}>
                  {[ACCENT, PURPLE, ORANGE, CYAN].map(color => (
                    <TouchableOpacity
                      key={color}
                      style={[s.colorOption, { backgroundColor: color }, phase.color === color && s.colorOptionActive]}
                      onPress={() => updatePhase(idx, 'color', color)}
                    />
                  ))}
                </View>
              </View>
            ))}
            <TouchableOpacity style={s.addBtn} onPress={addPhase}>
              <Ionicons name="add-circle" size={18} color={ACCENT} />
              <Text style={s.addBtnText}>Agregar fase</Text>
            </TouchableOpacity>

            {/* DÍAS CON EJERCICIOS */}
            <Text style={s.sectionLabel}>💪 DÍAS DE ENTRENAMIENTO</Text>
            {challengeData.days.map((day, dayIdx) => (
              <View key={dayIdx} style={s.dayCard}>
                <View style={s.dayHeader}>
                  <TextInput
                    style={[s.dayNameInput, { flex: 1 }]}
                    value={day.name}
                    onChangeText={v => updateDay(dayIdx, 'name', v)}
                    placeholder="DÍA A"
                    placeholderTextColor={T3}
                  />
                  <TouchableOpacity onPress={() => deleteDay(dayIdx)}>
                    <Ionicons name="trash" size={18} color="#FF453A" />
                  </TouchableOpacity>
                </View>
                <Input label="Tipo de día" value={day.type} onChangeText={v => updateDay(dayIdx, 'type', v)} placeholder="Ej: Upper Fuerza" />
                
                <Text style={s.miniLabel}>Ejercicios</Text>
                {day.exercises.map((ex, exIdx) => (
                  <View key={exIdx} style={s.exerciseCard}>
                    <View style={s.exerciseHeader}>
                      <Text style={s.exerciseTitle}>Ejercicio {exIdx + 1}</Text>
                      <TouchableOpacity onPress={() => deleteExercise(dayIdx, exIdx)}>
                        <Ionicons name="close-circle" size={18} color={T3} />
                      </TouchableOpacity>
                    </View>
                    <Input label="Nombre" value={ex.name} onChangeText={v => updateExercise(dayIdx, exIdx, 'name', v)} placeholder="Ej: Press banca" />
                    <View style={s.exerciseRow}>
                      <View style={{ flex: 1 }}>
                        <Input label="Series" value={ex.sets} onChangeText={v => updateExercise(dayIdx, exIdx, 'sets', v)} placeholder="3" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Input label="Reps" value={ex.reps} onChangeText={v => updateExercise(dayIdx, exIdx, 'reps', v)} placeholder="10" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Input label="Descanso" value={ex.rest} onChangeText={v => updateExercise(dayIdx, exIdx, 'rest', v)} placeholder="60s" />
                      </View>
                    </View>
                  </View>
                ))}
                <TouchableOpacity style={s.addExerciseBtn} onPress={() => addExercise(dayIdx)}>
                  <Ionicons name="add" size={14} color={ACCENT} />
                  <Text style={s.addExerciseBtnText}>Agregar ejercicio</Text>
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={s.addBtn} onPress={addDay}>
              <Ionicons name="add-circle" size={18} color={ACCENT} />
              <Text style={s.addBtnText}>Agregar día</Text>
            </TouchableOpacity>
          </>
        )}

        {contentType === 'link' && (
          <>
            <Text style={s.sectionLabel}>RUTA DE DESTINO *</Text>
            <Input label="Ruta" value={form.route} onChangeText={v => updateField('route', v)} placeholder="/explore/..." autoCapitalize="none" />
          </>
        )}

        {contentType === 'routine' && (
          <>
            <Text style={s.sectionLabel}>DATOS DE LA RUTINA</Text>
            <TextArea label="Descripción *" value={routineData.description} onChangeText={v => setRoutineData(p => ({ ...p, description: v }))} placeholder="¿De qué trata?" height={100} />
            <Input label="Frecuencia" value={routineData.frequency} onChangeText={v => setRoutineData(p => ({ ...p, frequency: v }))} placeholder="3 días/sem" />
          </>
        )}

        {contentType === 'article' && (
          <>
            <Text style={s.sectionLabel}>DATOS DEL ARTÍCULO</Text>
            <Text style={s.miniLabel}>Categoría</Text>
            <View style={s.optionsRow}>
              {['Nutrición', 'Técnica', 'Entrenamiento', 'Recuperación'].map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[s.optionBtn, articleData.category === cat && s.optionBtnActive]}
                  onPress={() => setArticleData(p => ({ ...p, category: cat }))}
                  activeOpacity={0.8}
                >
                  <Text style={[s.optionBtnText, articleData.category === cat && s.optionBtnTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Input label="Autor *" value={articleData.author} onChangeText={v => setArticleData(p => ({ ...p, author: v }))} placeholder="Tu nombre" />
            <TextArea label="Introducción *" value={articleData.intro} onChangeText={v => setArticleData(p => ({ ...p, intro: v }))} placeholder="Resumen..." height={80} />
            <TextArea label="Contenido" value={articleData.content} onChangeText={v => setArticleData(p => ({ ...p, content: v }))} placeholder="Contenido..." height={150} />
          </>
        )}

        {contentType === 'recipe' && (
          <>
            <Text style={s.sectionLabel}>DATOS DE LA RECETA</Text>
            <Input label="Tiempo" value={recipeData.time} onChangeText={v => setRecipeData(p => ({ ...p, time: v }))} placeholder="15 min" />
            <View style={s.row}>
              <View style={{ flex: 1 }}><Input label="Calorías *" value={recipeData.calories} onChangeText={v => setRecipeData(p => ({ ...p, calories: v }))} keyboardType="numeric" /></View>
              <View style={{ flex: 1 }}><Input label="Proteína *" value={recipeData.protein} onChangeText={v => setRecipeData(p => ({ ...p, protein: v }))} keyboardType="numeric" /></View>
            </View>
            <View style={s.row}>
              <View style={{ flex: 1 }}><Input label="Carbos *" value={recipeData.carbs} onChangeText={v => setRecipeData(p => ({ ...p, carbs: v }))} keyboardType="numeric" /></View>
              <View style={{ flex: 1 }}><Input label="Grasas *" value={recipeData.fat} onChangeText={v => setRecipeData(p => ({ ...p, fat: v }))} keyboardType="numeric" /></View>
            </View>
            <TextArea label="Ingredientes (coma)" value={recipeData.ingredients} onChangeText={v => setRecipeData(p => ({ ...p, ingredients: v }))} placeholder="Pollo, arroz..." height={80} />
            <TextArea label="Pasos (uno por línea)" value={recipeData.steps} onChangeText={v => setRecipeData(p => ({ ...p, steps: v }))} placeholder="1. Cocinar..." height={120} />
          </>
        )}

        <Text style={s.sectionLabel}>ESTADO</Text>
        <TouchableOpacity
          style={[s.toggleCard, form.is_active && s.toggleCardActive]}
          onPress={() => updateField('is_active', !form.is_active)}
          activeOpacity={0.8}
        >
          <Ionicons name={form.is_active ? "eye" : "eye-off"} size={20} color={form.is_active ? ACCENT : T3} />
          <View style={{ flex: 1 }}>
            <Text style={s.toggleTitle}>{form.is_active ? 'Activa' : 'Inactiva'}</Text>
            <Text style={s.toggleSub}>{form.is_active ? 'Visible en ExploreScreen' : 'Oculta'}</Text>
          </View>
        </TouchableOpacity>
{/* MOSTRAR EN VER TODO */}
<Text style={s.sectionLabel}>VISIBILIDAD EN "VER TODO"</Text>
<TouchableOpacity
  style={[s.toggleCard, form.show_in_see_all && s.toggleCardActive]}
  onPress={() => updateField('show_in_see_all', !form.show_in_see_all)}
  activeOpacity={0.8}
>
  <Ionicons name={form.show_in_see_all ? "eye" : "eye-off"} size={20} color={form.show_in_see_all ? ACCENT : T3} />
  <View style={{ flex: 1 }}>
    <Text style={s.toggleTitle}>{form.show_in_see_all ? 'Visible en Ver todo' : 'Oculta en Ver todo'}</Text>
    <Text style={s.toggleSub}>
      {form.show_in_see_all ? 'Aparecerá en la pantalla de Ver todo de Tendencias' : 'Solo aparecerá en el ExploreScreen'}
    </Text>
  </View>
</TouchableOpacity>
        <TouchableOpacity
          style={[s.saveBtn, saving && s.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          <Text style={s.saveBtnText}>{saving ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear')}</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function Input({ label, value, onChangeText, placeholder, keyboardType = 'default', autoCapitalize = 'sentences' }) {
  return (
    <View style={s.inputWrap}>
      <Text style={s.inputLabel}>{label}</Text>
      <TextInput style={s.input} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={T3} keyboardType={keyboardType} autoCapitalize={autoCapitalize} />
    </View>
  );
}

function TextArea({ label, value, onChangeText, placeholder, height = 80 }) {
  return (
    <View style={s.inputWrap}>
      <Text style={s.inputLabel}>{label}</Text>
      <TextInput style={[s.input, { height, textAlignVertical: 'top' }]} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={T3} multiline />
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
  miniLabel: { fontSize: 11, color: T3, fontWeight: '600', marginBottom: 6, marginTop: 4 },

  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  typeCard: { width: '47%', backgroundColor: SURFACE, borderRadius: 14, padding: 14, borderWidth: 2, borderColor: BORDER, alignItems: 'center' },
  typeCardActive: { borderColor: ACCENT, backgroundColor: ACCENT + '10' },
  typeLabel: { fontSize: 13, fontWeight: '700', color: T2, marginTop: 6 },
  typeLabelActive: { color: ACCENT },
  typeDesc: { fontSize: 10, color: T3, textAlign: 'center', marginTop: 4 },

  imagePreview: { alignItems: 'center', marginBottom: 12 },
  previewImage: { width: '100%', height: 160, borderRadius: 16 },
  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  imageOption: { width: 80, alignItems: 'center', backgroundColor: SURFACE, borderRadius: 12, padding: 8, borderWidth: 2, borderColor: BORDER },
  imageOptionActive: { borderColor: ACCENT },
  imageOptionImg: { width: 64, height: 64, borderRadius: 8, marginBottom: 4 },
  imageOptionLabel: { fontSize: 10, color: T2, fontWeight: '600' },
  imageOptionLabelActive: { color: ACCENT },

  row: { flexDirection: 'row', gap: 10 },
  inputWrap: { marginBottom: 10 },
  inputLabel: { fontSize: 12, color: T2, fontWeight: '600', marginBottom: 6 },
  input: { backgroundColor: SURFACE, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: T1, fontSize: 14, borderWidth: 1, borderColor: BORDER },

  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  optionBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER },
  optionBtnActive: { backgroundColor: ACCENT, borderColor: ACCENT },
  optionBtnText: { fontSize: 12, fontWeight: '700', color: T2 },
  optionBtnTextActive: { color: BG },

  // Objetivos, fases, días
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  deleteBtn: { padding: 4 },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: SURFACE, borderRadius: 12, paddingVertical: 12, borderWidth: 1, borderColor: ACCENT + '40', marginBottom: 14 },
  addBtnText: { fontSize: 13, color: ACCENT, fontWeight: '700' },

  phaseCard: { backgroundColor: SURFACE, borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: BORDER },
  phaseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  phaseTitle: { fontSize: 13, fontWeight: '700', color: ACCENT },
  colorRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  colorOption: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: 'transparent' },
  colorOptionActive: { borderColor: T1 },

  dayCard: { backgroundColor: SURFACE, borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: BORDER },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  dayNameInput: { backgroundColor: BG, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, color: ACCENT, fontSize: 14, fontWeight: '800', borderWidth: 1, borderColor: BORDER },

  exerciseCard: { backgroundColor: BG, borderRadius: 10, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: BORDER },
  exerciseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  exerciseTitle: { fontSize: 11, color: T3, fontWeight: '600' },
  exerciseRow: { flexDirection: 'row', gap: 6 },

  addExerciseBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 8, marginTop: 4 },
  addExerciseBtnText: { fontSize: 11, color: ACCENT, fontWeight: '600' },

  toggleCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: SURFACE, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: BORDER, marginBottom: 14 },
  toggleCardActive: { borderColor: ACCENT + '40' },
  toggleTitle: { fontSize: 14, fontWeight: '700', color: T1, marginBottom: 2 },
  toggleSub: { fontSize: 11, color: T3 },

  saveBtn: { backgroundColor: ACCENT, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 20 },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontSize: 15, fontWeight: '800', color: BG },
});