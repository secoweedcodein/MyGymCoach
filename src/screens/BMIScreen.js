// src/screens/BMIScreen.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Animated, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';

const ACCENT   = '#C0FF3E';
const BG       = '#0D0D0D';
const SURFACE  = '#161616';
const SURFACE2 = '#1E1E1E';
const BORDER   = '#FFFFFF0D';
const BORDER2  = '#FFFFFF18';
const T1       = '#FFFFFF';
const T2       = '#A0A0A0';
const T3       = '#555555';

// ── Categorías IMC ────────────────────────────────────────────────────────────
const BMI_RANGES = [
  { label: 'Bajo peso',       min: 0,    max: 18.5, color: '#3EE5FF', textColor: '#1A8FA8' },
  { label: 'Normal',          min: 18.5, max: 25,   color: '#C0FF3E', textColor: '#6B8C00' },
  { label: 'Sobrepeso',       min: 25,   max: 30,   color: '#FF9500', textColor: '#CC7700' },
  { label: 'Obesidad I',      min: 30,   max: 35,   color: '#FF6B3E', textColor: '#CC4400' },
  { label: 'Obesidad II',     min: 35,   max: 40,   color: '#FF453A', textColor: '#CC1F15' },
  { label: 'Obesidad III',    min: 40,   max: 999,  color: '#FF2D55', textColor: '#CC0028' },
];

function getBMICategory(bmi) {
  return BMI_RANGES.find(r => bmi >= r.min && bmi < r.max) ?? BMI_RANGES[BMI_RANGES.length - 1];
}

// ── Consejo por objetivo + categoría ─────────────────────────────────────────
function getAdvice(category, goal) {
  const map = {
    'Normal': {
      'Ganar masa muscular': 'Tu IMC es ideal para ganar masa. Enfócate en superávit calórico moderado (+250-300 kcal) y prioriza el entrenamiento de fuerza progresivo.',
      'Perder grasa':        'Ya tienes un IMC saludable. Si quieres definir, aplica un déficit leve (-200 kcal) y conserva el músculo con proteína alta (+2g/kg).',
      'Fuerza máxima':       'IMC óptimo para rendimiento de fuerza. Mantén tu peso y maximiza tu ratio fuerza/peso con periodización de cargas.',
      'Resistencia':         'IMC ideal para deportes de resistencia. Mantén el peso con ingesta adecuada de carbohidratos para el rendimiento aeróbico.',
      'Mantenimiento':       'Perfecto. Mantén tus hábitos actuales: entrenamiento regular y alimentación balanceada.',
    },
    'Bajo peso': {
      'Ganar masa muscular': 'Tu IMC indica bajo peso — ideal momento para ganar masa muscular. Aumenta calorías (+400-500 kcal sobre mantenimiento) con énfasis en proteína (2-2.5g/kg).',
      'Perder grasa':        'Con bajo peso, prioriza primero llegar a un IMC saludable. Aumenta ingesta calórica y entrena fuerza para ganar masa muscular antes de pensar en definir.',
      'Fuerza máxima':       'El bajo peso puede limitar tu potencial de fuerza. Gana masa corporal con superávit calórico y proteína alta para aumentar tu base muscular.',
      'Resistencia':         'Asegúrate de consumir suficientes carbohidratos para el entrenamiento. El bajo peso puede afectar la energía disponible para sesiones largas.',
      'Mantenimiento':       'Aunque tu meta es mantenimiento, considera aumentar ligeramente las calorías para llegar a un IMC más saludable.',
    },
    'Sobrepeso': {
      'Ganar masa muscular': 'Con sobrepeso puedes hacer una recomposición corporal: déficit leve (-200 kcal) + entrenamiento de fuerza. Ganarás músculo mientras pierdes grasa.',
      'Perder grasa':        'Buen momento para reducir grasa. Aplica un déficit moderado (-400 kcal), prioriza proteína (2g/kg) para preservar músculo y añade cardio 3x/semana.',
      'Fuerza máxima':       'Considera reducir algo de peso para mejorar tu ratio fuerza/peso. Un déficit leve (-200 kcal) mientras mantienes el entrenamiento puede ayudar.',
      'Resistencia':         'Reducir peso mejorará significativamente tu rendimiento en resistencia. Cada kg menos = mayor eficiencia energética en carrera o ciclismo.',
      'Mantenimiento':       'Te recomiendo cambiar el objetivo a perder grasa para llegar a un IMC saludable antes de mantener.',
    },
    'Obesidad I': {
      'Ganar masa muscular': 'Con tu IMC actual, prioriza primero perder grasa. El entrenamiento de fuerza es clave — te ayudará a perder grasa y ganar músculo simultáneamente.',
      'Perder grasa':        'Momento de actuar. Déficit calórico moderado (-400-500 kcal), entrenamiento de fuerza 3-4x/semana y cardio de bajo impacto. Consulta a un nutricionista.',
      'Fuerza máxima':       'El exceso de peso añade estrés a articulaciones. Pierde grasa gradualmente mientras mantienes fuerza. Consulta a un especialista para periodización segura.',
      'Resistencia':         'Elige actividades de bajo impacto (natación, ciclismo) para proteger las articulaciones mientras reduces peso. El cardio también acelerará la pérdida de grasa.',
      'Mantenimiento':       'Reconsiderarías cambiar el objetivo a perder grasa. Tu salud se beneficiaría de alcanzar un IMC más saludable.',
    },
  };

  const cat = category.label;
  const catKey = ['Obesidad I','Obesidad II','Obesidad III'].includes(cat) ? 'Obesidad I' : cat;
  const goalAdvice = map[catKey];
  if (!goalAdvice) return 'Consulta a un profesional de salud para un plan personalizado según tu IMC.';
  return goalAdvice[goal] ?? 'Consulta a un profesional de salud para un plan personalizado según tu IMC y objetivo.';
}

// ── Indicador de posición en la barra ────────────────────────────────────────
function BMIBar({ bmi }) {
  const clampedBmi = Math.min(Math.max(bmi, 10), 45);
  const pct        = ((clampedBmi - 10) / 35) * 100;
  const posAnim    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(posAnim, { toValue: pct, useNativeDriver: false, tension: 60 }).start();
  }, [pct]);

  return (
    <View style={bar.wrap}>
      {/* Segmentos de color */}
      <View style={bar.track}>
        <View style={[bar.seg, { flex: 2.1, backgroundColor: '#3EE5FF' }]} />
        <View style={[bar.seg, { flex: 2.2, backgroundColor: '#C0FF3E' }]} />
        <View style={[bar.seg, { flex: 1.8, backgroundColor: '#FF9500' }]} />
        <View style={[bar.seg, { flex: 1.8, backgroundColor: '#FF6B3E' }]} />
        <View style={[bar.seg, { flex: 1.5, backgroundColor: '#FF453A' }]} />
        <View style={[bar.seg, { flex: 2.6, backgroundColor: '#FF2D55', borderTopRightRadius: 6, borderBottomRightRadius: 6 }]} />
      </View>

      {/* Indicador animado */}
      <Animated.View style={[bar.indicator, {
        left: posAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
      }]}>
        <View style={bar.indicatorDot} />
        <Text style={bar.indicatorLabel}>{bmi.toFixed(1)}</Text>
      </Animated.View>

      {/* Etiquetas */}
      <View style={bar.labels}>
        <Text style={bar.labelText}>10</Text>
        <Text style={bar.labelText}>18.5</Text>
        <Text style={bar.labelText}>25</Text>
        <Text style={bar.labelText}>30</Text>
        <Text style={bar.labelText}>35</Text>
        <Text style={bar.labelText}>40+</Text>
      </View>
    </View>
  );
}

const bar = StyleSheet.create({
  wrap:          { marginBottom: 8 },
  track:         { flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden', marginBottom: 22, position: 'relative' },
  seg:           { height: '100%' },
  indicator:     { position: 'absolute', top: -4, alignItems: 'center', transform: [{ translateX: -10 }] },
  indicatorDot:  { width: 20, height: 20, borderRadius: 10, backgroundColor: T1, borderWidth: 3, borderColor: BG },
  indicatorLabel:{ fontSize: 11, fontWeight: '800', color: T1, marginTop: 2 },
  labels:        { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  labelText:     { fontSize: 9, color: T3, fontWeight: '600' },
});

// ── Componente principal ──────────────────────────────────────────────────────
export default function BMIScreen() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [bmi, setBmi]         = useState(null);
  const [category, setCategory] = useState(null);

  // Animación del número grande
  const bmiAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(useCallback(() => { loadProfile(); }, []));

  async function loadProfile() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data } = await supabase
      .from('user_profiles')
      .select('full_name, weight_kg, height_cm, birth_year, goal, activity_level_id')
      .eq('id', user.id)
      .maybeSingle();

    if (data) {
      setProfile(data);
      if (data.weight_kg && data.height_cm) {
        const heightM = data.height_cm / 100;
        const computed = data.weight_kg / (heightM * heightM);
        const rounded  = Math.round(computed * 10) / 10;
        setBmi(rounded);
        setCategory(getBMICategory(rounded));

        // Animar número
        Animated.timing(bmiAnim, { toValue: rounded, duration: 1000, useNativeDriver: false }).start();
      }
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <View style={s.loading}>
        <ActivityIndicator size="large" color={ACCENT} />
      </View>
    );
  }

  // Sin datos suficientes
  const missingData = !profile?.weight_kg || !profile?.height_cm;

  return (
    <ScrollView style={s.container} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

      {/* HEADER */}
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
          <Text style={s.backBtnText}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={s.title}>IMC</Text>
          <Text style={s.subtitle}>Índice de Masa Corporal</Text>
        </View>
      </View>

      {/* SIN DATOS */}
      {missingData && (
        <View style={s.noDataCard}>
          <Text style={s.noDataIcon}>📏</Text>
          <Text style={s.noDataTitle}>Faltan tus datos</Text>
          <Text style={s.noDataText}>
            Para calcular tu IMC necesitamos tu peso y altura. Agrégalos en tu perfil.
          </Text>
          <TouchableOpacity style={s.noDataBtn} onPress={() => router.push('/profile')} activeOpacity={0.8}>
            <Text style={s.noDataBtnText}>Completar perfil →</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* RESULTADO */}
      {bmi && category && (
        <>
          {/* Card principal con IMC */}
          <View style={[s.heroCard, { borderColor: category.color + '44' }]}>
            <View style={[s.heroBg, { backgroundColor: category.color + '08' }]} />

            {/* Número grande */}
            <View style={s.heroTop}>
              <View style={s.bmiNumberWrap}>
                <Animated.Text style={[s.bmiNumber, { color: category.color }]}>
                  {bmi.toFixed(1)}
                </Animated.Text>
                <Text style={s.bmiUnit}>kg/m²</Text>
              </View>
              <View style={[s.categoryBadge, { backgroundColor: category.color + '18', borderColor: category.color + '44' }]}>
                <View style={[s.categoryDot, { backgroundColor: category.color }]} />
                <Text style={[s.categoryLabel, { color: category.color }]}>{category.label}</Text>
              </View>
            </View>

            {/* Datos usados */}
            <View style={s.dataRow}>
              <View style={s.dataItem}>
                <Text style={s.dataValue}>{profile.weight_kg} kg</Text>
                <Text style={s.dataLabel}>Peso</Text>
              </View>
              <View style={s.dataDivider} />
              <View style={s.dataItem}>
                <Text style={s.dataValue}>{profile.height_cm} cm</Text>
                <Text style={s.dataLabel}>Altura</Text>
              </View>
              {profile.birth_year && (
                <>
                  <View style={s.dataDivider} />
                  <View style={s.dataItem}>
                    <Text style={s.dataValue}>{new Date().getFullYear() - profile.birth_year} a</Text>
                    <Text style={s.dataLabel}>Edad</Text>
                  </View>
                </>
              )}
            </View>
          </View>

          {/* BARRA VISUAL */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Tu posición</Text>
            <BMIBar bmi={bmi} />
          </View>

          {/* RANGOS */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Rangos de referencia</Text>
            {BMI_RANGES.map((range, i) => {
              const isActive = category.label === range.label;
              return (
                <View key={i} style={[s.rangeRow, isActive && { backgroundColor: range.color + '10', borderRadius: 10, marginHorizontal: -4, paddingHorizontal: 4 }]}>
                  <View style={[s.rangeDot, { backgroundColor: range.color }]} />
                  <Text style={[s.rangeLabel, isActive && { color: T1, fontWeight: '700' }]}>{range.label}</Text>
                  <Text style={s.rangeValues}>
                    {range.max === 999 ? `≥ ${range.min}` : `${range.min} – ${range.max}`}
                  </Text>
                  {isActive && (
                    <View style={[s.activeTag, { backgroundColor: range.color + '22' }]}>
                      <Text style={[s.activeTagText, { color: range.color }]}>tú</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          {/* CONSEJO PERSONALIZADO */}
          <View style={[s.adviceCard, { borderColor: category.color + '33' }]}>
            <View style={s.adviceHeader}>
              <Text style={s.adviceIcon}>💡</Text>
              <View>
                <Text style={s.adviceTitle}>Consejo para tu objetivo</Text>
                <Text style={[s.adviceGoal, { color: category.color }]}>
                  {profile.goal ?? 'Sin objetivo definido'}
                </Text>
              </View>
            </View>
            <Text style={s.adviceText}>
              {getAdvice(category, profile.goal)}
            </Text>
          </View>

          {/* PESO IDEAL */}
          {profile.height_cm && (
            <View style={s.card}>
              <Text style={s.cardTitle}>Rango de peso saludable</Text>
              <Text style={s.idealSub}>Para tu altura de {profile.height_cm} cm (IMC 18.5 – 25)</Text>
              <View style={s.idealRow}>
                <View style={s.idealItem}>
                  <Text style={s.idealValue}>
                    {Math.round(18.5 * Math.pow(profile.height_cm / 100, 2))} kg
                  </Text>
                  <Text style={s.idealLabel}>Mínimo saludable</Text>
                </View>
                <View style={s.idealDivider} />
                <View style={s.idealItem}>
                  <Text style={s.idealValue}>
                    {Math.round(24.9 * Math.pow(profile.height_cm / 100, 2))} kg
                  </Text>
                  <Text style={s.idealLabel}>Máximo saludable</Text>
                </View>
              </View>

              {/* Diferencia con peso actual */}
              {profile.weight_kg && (() => {
                const minIdeal = Math.round(18.5 * Math.pow(profile.height_cm / 100, 2));
                const maxIdeal = Math.round(24.9 * Math.pow(profile.height_cm / 100, 2));
                const current  = profile.weight_kg;
                const inRange  = current >= minIdeal && current <= maxIdeal;
                const diff     = inRange ? 0 : current < minIdeal ? minIdeal - current : current - maxIdeal;
                const dir      = current < minIdeal ? 'ganar' : 'perder';
                if (inRange) return (
                  <View style={[s.diffBanner, { backgroundColor: '#C0FF3E12', borderColor: '#C0FF3E33' }]}>
                    <Text style={[s.diffText, { color: ACCENT }]}>✓ Estás dentro del rango saludable</Text>
                  </View>
                );
                return (
                  <View style={[s.diffBanner, { backgroundColor: category.color + '10', borderColor: category.color + '25' }]}>
                    <Text style={[s.diffText, { color: category.color }]}>
                      Necesitas {dir} ~{Math.round(diff)} kg para llegar al rango saludable
                    </Text>
                  </View>
                );
              })()}
            </View>
          )}

          {/* BOTÓN ACTUALIZAR */}
          <TouchableOpacity style={s.updateBtn} onPress={() => router.push('/profile')} activeOpacity={0.8}>
            <Text style={s.updateBtnText}>✎  Actualizar datos en perfil</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: BG },
  scroll:       { padding: 20, paddingTop: 52, paddingBottom: 60 },
  loading:      { flex: 1, backgroundColor: BG, alignItems: 'center', justifyContent: 'center' },

  topBar:       { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 24 },
  backBtn:      { width: 38, height: 38, borderRadius: 11, backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER2, alignItems: 'center', justifyContent: 'center' },
  backBtnText:  { fontSize: 18, color: T1, fontWeight: '700' },
  title:        { fontSize: 28, fontWeight: '800', color: T1, letterSpacing: -0.8 },
  subtitle:     { fontSize: 12, color: T3, marginTop: 1, fontWeight: '500' },

  // Sin datos
  noDataCard:   { backgroundColor: SURFACE, borderRadius: 20, padding: 28, alignItems: 'center', borderWidth: 1, borderColor: BORDER },
  noDataIcon:   { fontSize: 40, marginBottom: 14 },
  noDataTitle:  { fontSize: 18, fontWeight: '800', color: T1, marginBottom: 8 },
  noDataText:   { fontSize: 13, color: T2, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  noDataBtn:    { backgroundColor: ACCENT, borderRadius: 14, paddingVertical: 13, paddingHorizontal: 28 },
  noDataBtnText:{ fontSize: 14, fontWeight: '800', color: '#000' },

  // Hero
  heroCard:     { backgroundColor: SURFACE, borderRadius: 22, padding: 18, marginBottom: 10, borderWidth: 1, overflow: 'hidden', position: 'relative' },
  heroBg:       { position: 'absolute', inset: 0, top: 0, left: 0, right: 0, bottom: 0 },
  heroTop:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  bmiNumberWrap:{ },
  bmiNumber:    { fontSize: 64, fontWeight: '800', letterSpacing: -2, lineHeight: 68 },
  bmiUnit:      { fontSize: 13, color: T3, fontWeight: '600', marginTop: 2 },
  categoryBadge:{ flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, alignSelf: 'flex-start' },
  categoryDot:  { width: 8, height: 8, borderRadius: 4 },
  categoryLabel:{ fontSize: 13, fontWeight: '700' },
  dataRow:      { flexDirection: 'row', backgroundColor: SURFACE2, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: BORDER2 },
  dataItem:     { flex: 1, alignItems: 'center' },
  dataValue:    { fontSize: 16, fontWeight: '800', color: T1 },
  dataLabel:    { fontSize: 10, color: T3, fontWeight: '600', marginTop: 2 },
  dataDivider:  { width: 1, backgroundColor: BORDER2, marginHorizontal: 4 },

  // Cards
  card:         { backgroundColor: SURFACE, borderRadius: 18, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: BORDER },
  cardTitle:    { fontSize: 14, fontWeight: '700', color: T1, marginBottom: 14, letterSpacing: -0.2 },

  // Rangos
  rangeRow:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 9, gap: 10 },
  rangeDot:     { width: 10, height: 10, borderRadius: 3, flexShrink: 0 },
  rangeLabel:   { flex: 1, fontSize: 13, color: T2, fontWeight: '500' },
  rangeValues:  { fontSize: 12, color: T3, fontWeight: '600' },
  activeTag:    { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginLeft: 6 },
  activeTagText:{ fontSize: 10, fontWeight: '800' },

  // Consejo
  adviceCard:   { backgroundColor: SURFACE, borderRadius: 18, padding: 16, marginBottom: 10, borderWidth: 1 },
  adviceHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  adviceIcon:   { fontSize: 22 },
  adviceTitle:  { fontSize: 13, fontWeight: '700', color: T1 },
  adviceGoal:   { fontSize: 11, fontWeight: '600', marginTop: 2 },
  adviceText:   { fontSize: 13, color: T2, lineHeight: 20, fontWeight: '400' },

  // Peso ideal
  idealSub:     { fontSize: 11, color: T3, marginBottom: 14, fontWeight: '500' },
  idealRow:     { flexDirection: 'row', backgroundColor: SURFACE2, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: BORDER2, marginBottom: 10 },
  idealItem:    { flex: 1, alignItems: 'center' },
  idealValue:   { fontSize: 20, fontWeight: '800', color: T1 },
  idealLabel:   { fontSize: 10, color: T3, marginTop: 3, fontWeight: '600' },
  idealDivider: { width: 1, backgroundColor: BORDER2 },
  diffBanner:   { borderRadius: 10, padding: 12, borderWidth: 1, alignItems: 'center' },
  diffText:     { fontSize: 12, fontWeight: '700', textAlign: 'center' },

  // Update btn
  updateBtn:    { backgroundColor: SURFACE, borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: BORDER2, marginTop: 4 },
  updateBtnText:{ fontSize: 13, fontWeight: '700', color: T2 },
});