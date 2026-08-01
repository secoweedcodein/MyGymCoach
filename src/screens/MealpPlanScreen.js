// src/screens/MealPlanScreen.js
import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAlert } from "../context/AlertContext";

const ACCENT  = '#C0FF3E';
const BG      = '#0D0D0D';
const SURFACE = '#161616';
const SRF2    = '#1E1E1E';
const BORDER  = '#FFFFFF0D';
const BORDER2 = '#FFFFFF18';
const T1      = '#FFFFFF';
const T2      = '#A0A0A0';
const T3      = '#555555';

const DAYS   = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
const MEALS  = [
  { key: 'breakfast', label: 'Desayuno', icon: '🌅' },
  { key: 'lunch',     label: 'Almuerzo', icon: '☀️'  },
  { key: 'dinner',    label: 'Cena',     icon: '🌙'  },
  { key: 'snack',     label: 'Snack',    icon: '🍎'  },
];
function getWeekStart() {
  const d   = new Date();
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1 - day);
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatWeekLabel(weekStart) {
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  return `${weekStart.getDate()} ${months[weekStart.getMonth()]} – ${end.getDate()} ${months[end.getMonth()]}`;
}

export default function MealPlanScreen() {
  const { showAlert } = useAlert();
  const [loading, setLoading]       = useState(true);
  const [userId, setUserId]         = useState(null);
  const [weekStart, setWeekStart]   = useState(getWeekStart());
  const [plan, setPlan]             = useState([]);
  const [goals, setGoals]           = useState(null);
  const [activeDay, setActiveDay]   = useState(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1);


  useFocusEffect(useCallback(() => { loadAll(); }, [weekStart]));

  async function loadAll() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    setUserId(user.id);

    const weekStr = weekStart.toISOString().split('T')[0];

    const [planRes, goalsRes] = await Promise.all([
      supabase.from('meal_plans').select('*').eq('user_id', user.id).eq('week_start', weekStr).order('day_of_week').order('meal_type'),
      supabase.from('nutrition_goals').select('*').eq('user_id', user.id).maybeSingle(),
    ]);

    if (planRes.data)  setPlan(planRes.data);
    if (goalsRes.data) setGoals(goalsRes.data);
    setLoading(false);
  }

  function prevWeek() {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(d);
  }

  function nextWeek() {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(d);
  }

  async function removePlanItem(id) {
    await supabase.from('meal_plans').delete().eq('id', id);
    loadAll();
  }

  async function copyDayToLog(dayIndex) {
    if (!userId) return;
    const items = plan.filter(p => p.day_of_week === dayIndex);
    if (items.length === 0) { showAlert('Día vacío', 'No hay alimentos planificados para este día.'); return; }

    const today = new Date().toISOString().split('T')[0];
    const toInsert = items.map(item => ({
      user_id:     userId,
      meal_type:   item.meal_type,
      food_name:   item.food_name,
      calories:    item.calories,
      protein_g:   item.protein_g,
      carbs_g:     item.carbs_g,
      fat_g:       item.fat_g,
      quantity_g:  100,
      logged_date: today,
    }));

    const { error } = await supabase.from('nutrition_logs').insert(toInsert);
    if (error) { showAlert('Error', error.message); return; }
   showAlert('✅ Listo', 'Los alimentos del día se añadieron al log de hoy.');
  }

  // Totales del día activo
  const dayItems = plan.filter(p => p.day_of_week === activeDay);
  const dayTotals = dayItems.reduce((acc, item) => ({
    calories: acc.calories + (item.calories  || 0),
    protein:  acc.protein  + (item.protein_g || 0),
    carbs:    acc.carbs    + (item.carbs_g   || 0),
    fat:      acc.fat      + (item.fat_g     || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  // Calorías por día para el heatmap
  const dayCalories = DAYS.map((_, i) => {
    const items = plan.filter(p => p.day_of_week === i);
    return items.reduce((a, item) => a + (item.calories || 0), 0);
  });
  const maxCal = Math.max(...dayCalories, 1);

  if (loading) {
    return (
      <View style={s.loading}>
        <ActivityIndicator size="large" color={ACCENT} />
      </View>
    );
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

      {/* HEADER */}
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
          <Text style={s.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={s.title}>Plan semanal</Text>
      </View>

      {/* NAVEGACIÓN SEMANA */}
      <View style={s.weekNav}>
        <TouchableOpacity onPress={prevWeek} style={s.weekArrow} activeOpacity={0.7}>
          <Text style={s.weekArrowText}>‹</Text>
        </TouchableOpacity>
        <Text style={s.weekLabel}>{formatWeekLabel(weekStart)}</Text>
        <TouchableOpacity onPress={nextWeek} style={s.weekArrow} activeOpacity={0.7}>
          <Text style={s.weekArrowText}>›</Text>
        </TouchableOpacity>
      </View>

      {/* HEATMAP SEMANAL */}
      <View style={s.heatmapCard}>
        {DAYS.map((day, i) => {
          const calPct = dayCalories[i] / maxCal;
          const isActive = i === activeDay;
          const isToday  = i === (new Date().getDay() === 0 ? 6 : new Date().getDay() - 1);
          return (
            <TouchableOpacity
              key={day}
              style={s.heatmapDay}
              onPress={() => setActiveDay(i)}
              activeOpacity={0.8}
            >
              <Text style={[s.heatmapDayLabel, isToday && { color: ACCENT }]}>{day}</Text>
              <View style={[
                s.heatmapBar,
                { backgroundColor: isActive ? ACCENT : `rgba(192,255,62,${0.1 + calPct * 0.6})` },
              ]}>
                <Text style={[s.heatmapCal, { color: isActive ? '#000' : T3 }]}>
                  {dayCalories[i] > 0 ? Math.round(dayCalories[i]) : '—'}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* DÍA ACTIVO */}
      <View style={s.dayHeader}>
        <View>
          <Text style={s.dayTitle}>{DAYS[activeDay]}</Text>
          <Text style={s.dayCalories}>{Math.round(dayTotals.calories)} kcal · P {Math.round(dayTotals.protein)}g · C {Math.round(dayTotals.carbs)}g · G {Math.round(dayTotals.fat)}g</Text>
        </View>
        {dayItems.length > 0 && (
          <TouchableOpacity style={s.copyBtn} onPress={() => copyDayToLog(activeDay)} activeOpacity={0.8}>
            <Text style={s.copyBtnText}>📋 Usar hoy</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* COMIDAS DEL DÍA */}
      {MEALS.map(meal => {
        const mealItems = dayItems.filter(p => p.meal_type === meal.key);
        const mealCals  = mealItems.reduce((a, i) => a + (i.calories || 0), 0);

        return (
          <View key={meal.key} style={s.mealBlock}>
            <View style={s.mealBlockHdr}>
              <Text style={s.mealBlockIcon}>{meal.icon}</Text>
              <Text style={s.mealBlockName}>{meal.label}</Text>
              <Text style={s.mealBlockCal}>{Math.round(mealCals)} kcal</Text>
              <TouchableOpacity
                style={s.addToMealBtn}
                onPress={() => router.push({
                  pathname: '/food-search',
                  params: {
                    mealType:  meal.key,
                    planMode:  'true',
                    dayOfWeek: String(activeDay),
                    weekStart: weekStart.toISOString().split('T')[0],
                  }
                })}
                activeOpacity={0.8}
              >
                <Text style={s.addToMealBtnText}>+</Text>
              </TouchableOpacity>
            </View>

            {mealItems.map(item => (
              <View key={item.id} style={s.planItem}>
                <View style={{ flex: 1 }}>
                  <Text style={s.planItemName} numberOfLines={1}>{item.food_name}</Text>
                  <Text style={s.planItemMacros}>P {Math.round(item.protein_g)}g · C {Math.round(item.carbs_g)}g · G {Math.round(item.fat_g)}g</Text>
                </View>
                <Text style={s.planItemCal}>{Math.round(item.calories)} kcal</Text>
                <TouchableOpacity
                  onPress={() => showAlert('Eliminar', `¿Eliminar ${item.food_name}?`, [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Eliminar', style: 'destructive', onPress: () => removePlanItem(item.id) },
                  ])}
                  style={s.removeItem}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={s.removeItemText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}

            {mealItems.length === 0 && (
              <TouchableOpacity
                style={s.emptyMeal}
                onPress={() => router.push({
                  pathname: '/food-search',
                  params: {
                    mealType:  meal.key,
                    planMode:  'true',
                    dayOfWeek: String(activeDay),
                    weekStart: weekStart.toISOString().split('T')[0],
                  }
                })}
                activeOpacity={0.7}
              >
                <Text style={s.emptyMealText}>+ Añadir alimentos</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}

      {/* Banner sin objetivo */}
      {!goals && (
        <TouchableOpacity style={s.noGoalBanner} onPress={() => router.push('/profile')} activeOpacity={0.8}>
          <Text style={s.noGoalText}>⚡ Configura tu objetivo calórico en el perfil para ver el progreso →</Text>
        </TouchableOpacity>
      )}

    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: BG },
  scroll:      { padding: 20, paddingTop: 52, paddingBottom: 60 },
  loading:     { flex: 1, backgroundColor: BG, alignItems: 'center', justifyContent: 'center' },

  topBar:      { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 22 },
  backBtn:     { width: 38, height: 38, borderRadius: 11, backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER2, alignItems: 'center', justifyContent: 'center' },
  backBtnText: { fontSize: 18, color: T1, fontWeight: '700' },
  title:       { fontSize: 24, fontWeight: '800', color: T1, letterSpacing: -0.6 },

  weekNav:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  weekArrow:   { width: 36, height: 36, borderRadius: 10, backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER2, alignItems: 'center', justifyContent: 'center' },
  weekArrowText:{ fontSize: 20, color: T1, fontWeight: '700' },
  weekLabel:   { fontSize: 13, fontWeight: '700', color: T1 },

  // Heatmap
  heatmapCard: { flexDirection: 'row', backgroundColor: SURFACE, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: BORDER, marginBottom: 20, gap: 4 },
  heatmapDay:  { flex: 1, alignItems: 'center', gap: 6 },
  heatmapDayLabel: { fontSize: 9, fontWeight: '700', color: T3, letterSpacing: 0.5 },
  heatmapBar:  { width: '100%', borderRadius: 8, paddingVertical: 10, alignItems: 'center', minHeight: 44 },
  heatmapCal:  { fontSize: 8, fontWeight: '700' },

  // Día activo
  dayHeader:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  dayTitle:    { fontSize: 22, fontWeight: '800', color: T1, letterSpacing: -0.5 },
  dayCalories: { fontSize: 11, color: T3, marginTop: 3, fontWeight: '500' },
  copyBtn:     { backgroundColor: ACCENT + '15', borderWidth: 1, borderColor: ACCENT + '33', borderRadius: 20, paddingHorizontal: 13, paddingVertical: 7 },
  copyBtnText: { fontSize: 11, fontWeight: '700', color: ACCENT },

  // Meal block
  mealBlock:   { backgroundColor: SURFACE, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: BORDER, overflow: 'hidden' },
  mealBlockHdr:{ flexDirection: 'row', alignItems: 'center', padding: 12, gap: 8 },
  mealBlockIcon:{ fontSize: 18 },
  mealBlockName:{ fontSize: 13, fontWeight: '700', color: T1, flex: 1 },
  mealBlockCal: { fontSize: 11, color: T3, fontWeight: '600' },
  addToMealBtn: { width: 28, height: 28, borderRadius: 8, backgroundColor: SRF2, borderWidth: 1, borderColor: BORDER2, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  addToMealBtnText: { fontSize: 16, color: ACCENT, fontWeight: '800', lineHeight: 20 },

  // Plan item
  planItem:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: BORDER, gap: 8 },
  planItemName:{ fontSize: 12, fontWeight: '600', color: T2 },
  planItemMacros:{ fontSize: 10, color: T3, marginTop: 2 },
  planItemCal: { fontSize: 11, fontWeight: '700', color: T1 },
  removeItem:  { padding: 4 },
  removeItemText:{ fontSize: 12, color: T3 },

  emptyMeal:   { paddingHorizontal: 12, paddingVertical: 12, borderTopWidth: 1, borderTopColor: BORDER },
  emptyMealText:{ fontSize: 12, color: T3, fontWeight: '500' },

  noGoalBanner: { backgroundColor: ACCENT + '10', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: ACCENT + '25', alignItems: 'center', marginTop: 16 },
  noGoalText:   { fontSize: 12, color: ACCENT, fontWeight: '600', textAlign: 'center', lineHeight: 18 },
});