// src/screens/ProfileScreen.js
import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, StyleSheet, Modal, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAlert } from "../context/AlertContext";
import BottomTabBar from '../../components/BottomTabBar';

// ── Tokens de diseño ──────────────────────────────────────────────────────────
const ACCENT   = '#C0FF3E';
const BG       = '#0D0D0D';
const SURFACE  = '#161616';
const SURFACE2 = '#1E1E1E';
const BORDER   = '#FFFFFF0D';
const BORDER2  = '#FFFFFF18';
const T1       = '#FFFFFF';
const T2       = '#A0A0A0';
const T3       = '#555555';
const RED      = '#FF453A';

const GOALS = ['Ganar masa muscular', 'Perder grasa', 'Fuerza máxima', 'Resistencia', 'Mantenimiento'];

// ── Utilidades ───────────────────────────────────────────────────────────────
function getInitials(name) {
  if (!name?.trim()) return '?';
  return name.trim().split(' ').slice(0, 2).map(w => w[0].toUpperCase()).join('');
}

function formatVolume(kg) {
  if (!kg) return '0 kg';
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)} t`;
  return `${Math.round(kg)} kg`;
}

function getAge(birthYear) {
  if (!birthYear) return '—';
  return new Date().getFullYear() - birthYear;
}

function daysAgoISO(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

function calculateTDEE(profileData, activity) {
  if (!profileData.weight_kg || !profileData.height_cm || !profileData.age) return null;
  const bmr = 10 * profileData.weight_kg + 6.25 * profileData.height_cm - 5 * profileData.age + 5;
  const multipliers = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725 };
  const tdee = Math.round(bmr * (multipliers[activity] || 1.2));
  
  return {
    calories: tdee,
    protein_g: Math.round(profileData.weight_kg * 2),
    carbs_g: Math.round((tdee * 0.45) / 4),
    fat_g: Math.round((tdee * 0.25) / 9),
  };
}

// ── Calcular racha de días consecutivos ───────────────────────────────────────
function calculateStreak(weekNutrition, goals) {
  if (!weekNutrition || weekNutrition.length === 0) {
    return { currentStreak: 0, bestStreak: 0 };
  }

  const byDay = {};
  weekNutrition.forEach(l => {
    if (!byDay[l.logged_date]) byDay[l.logged_date] = { calories: 0, protein: 0 };
    byDay[l.logged_date].calories += l.calories || 0;
    byDay[l.logged_date].protein += l.protein_g || 0;
  });

  const sortedDays = Object.entries(byDay).sort((a, b) => new Date(b[0]) - new Date(a[0]));

  let currentStreak = 0;
  let bestStreak = 0;
  let tempStreak = 0;
  let lastDate = null;

  for (const [date, totals] of sortedDays) {
    const calOk = totals.calories >= goals.calories * 0.9 && totals.calories <= goals.calories * 1.1;
    const protOk = totals.protein >= goals.protein_g * 0.9;
    const dayOk = calOk && protOk;

    if (dayOk) {
      tempStreak++;
      if (tempStreak > bestStreak) bestStreak = tempStreak;
      
      if (lastDate) {
        const daysDiff = Math.round((new Date(lastDate) - new Date(date)) / (1000 * 60 * 60 * 24));
        if (daysDiff <= 1) {
          currentStreak = tempStreak;
        } else {
          tempStreak = 1;
        }
      } else {
        currentStreak = 1;
      }
      lastDate = date;
    } else {
      tempStreak = 0;
    }
  }

  return { currentStreak, bestStreak };
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function ProfileScreen() {
  const [loading, setLoading]       = useState(true);
  const [profile, setProfile]       = useState(null);
  const [stats, setStats]           = useState({ workouts: 0, sets: 0, volume: 0 });
  const [userId, setUserId]         = useState(null);
  const [nutritionStreak, setNutritionStreak] = useState({ currentStreak: 0, bestStreak: 0 });
  const { showAlert } = useAlert();

  // Estado modal edición
  const [showModal, setShowModal]   = useState(false);
  const [editName, setEditName]     = useState('');
  const [editWeight, setEditWeight] = useState('');
  const [editHeight, setEditHeight] = useState('');
  const [editAge, setEditAge]       = useState('');
  const [editGoal, setEditGoal]     = useState(GOALS[0]);
  const [editActivity, setEditActivity] = useState('sedentary');
  const [saving, setSaving]         = useState(false);

  useFocusEffect(useCallback(() => { loadAll(); }, []));

  async function loadAll() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    setUserId(user.id);

    const [profileRes, statsRes, weekNutritionRes, goalsRes] = await Promise.all([
      supabase.from('user_profiles').select('*').eq('id', user.id).maybeSingle(),
      supabase.from('workout_sessions').select('total_sets, total_volume_kg').eq('user_id', user.id).not('finished_at', 'is', null),
      supabase.from('nutrition_logs').select('*').eq('user_id', user.id).gte('logged_date', daysAgoISO(7)),
      supabase.from('nutrition_goals').select('*').eq('user_id', user.id).maybeSingle(),
    ]);

    if (profileRes.data) setProfile(profileRes.data);

    if (statsRes.data) {
      const workouts = statsRes.data.length;
      const totalSets = statsRes.data.reduce((a, s) => a + (s.total_sets ?? 0), 0);
      const totalVolume = statsRes.data.reduce((a, s) => a + (s.total_volume_kg ?? 0), 0);
      setStats({ workouts, sets: totalSets, volume: totalVolume });
    }

    // Calcular rachas de nutrición
    if (weekNutritionRes.data && goalsRes.data) {
      const streak = calculateStreak(weekNutritionRes.data, goalsRes.data);
      setNutritionStreak(streak);
    }

    setLoading(false);
  }

  function openModal() {
    setEditName(profile?.full_name ?? '');
    setEditWeight(profile?.weight_kg ? String(profile.weight_kg) : '');
    setEditHeight(profile?.height_cm ? String(profile.height_cm) : '');
    setEditAge(profile?.birth_year ? String(new Date().getFullYear() - profile.birth_year) : '');
    setEditGoal(profile?.goal ?? GOALS[0]);
    setEditActivity(profile?.activity_level_id ?? 'sedentary');
    setShowModal(true);
  }

  async function saveProfile() {
    if (!editName.trim()) {
      showAlert('Falta el nombre', 'Escribe tu nombre para continuar.');
      return;
    }
    setSaving(true);

    const birthYear = editAge ? new Date().getFullYear() - parseInt(editAge) : null;
    const profileData = {
      weight_kg: editWeight ? parseFloat(editWeight) : null,
      height_cm: editHeight ? parseFloat(editHeight) : null,
      age: editAge ? parseInt(editAge) : null,
    };

    // 1. Guardar perfil
    const { error: profileError } = await supabase.from('user_profiles').upsert({
      id: userId,
      full_name: editName.trim(),
      weight_kg: profileData.weight_kg,
      height_cm: profileData.height_cm,
      birth_year: birthYear,
      goal: editGoal,
      activity_level_id: editActivity,
    });

    if (profileError) {
      setSaving(false);
      showAlert('Error', profileError.message);
      return;
    }

    // 2. Sincronización con Coach IA: Guardar en el historial de peso
    if (profileData.weight_kg) {
      const today = new Date().toISOString().split('T')[0];
      await supabase.from('weight_logs').upsert({
        user_id: userId,
        weight_kg: profileData.weight_kg,
        logged_date: today,
      }, { onConflict: 'user_id,logged_date' });
    }

    // 3. Actualizar metas nutricionales
    const tdee = calculateTDEE(profileData, editActivity);
    if (tdee) {
      await supabase.from('nutrition_goals').upsert({
        user_id: userId,
        calories: tdee.calories,
        protein_g: tdee.protein_g,
        carbs_g: tdee.carbs_g,
        fat_g: tdee.fat_g,
        activity_level: editActivity,
      });
    }

    setSaving(false);
    setShowModal(false);
    loadAll();
    showAlert('¡Guardado!', 'Tu perfil y metas se han actualizado.');
  }

  async function handleSignOut() {
    showAlert('Cerrar sesión', '¿Seguro que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace('/');
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View style={p.loadingContainer}>
        <ActivityIndicator size="large" color={ACCENT} />
      </View>
    );
  }

  const displayName = profile?.full_name || 'Atleta';
  const initials = getInitials(displayName);
  const age = getAge(profile?.birth_year);
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
    : 'Reciente';

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <ScrollView style={p.container} showsVerticalScrollIndicator={false}>
        {/* Header de Perfil */}
        <View style={p.profileHeader}>
          <View style={p.avatar}>
            <Text style={p.avatarText}>{initials}</Text>
          </View>
          <View style={p.userInfo}>
            <Text style={p.userName}>{displayName}</Text>
            <Text style={p.userMeta}>{age} años · {profile?.goal || 'Atleta'}</Text>
            <Text style={p.memberSince}>Miembro desde {memberSince}</Text>
          </View>
          <TouchableOpacity style={p.editBtn} onPress={openModal} activeOpacity={0.7}>
            <Text style={p.editBtnText}>Editar</Text>
          </TouchableOpacity>
        </View>

        {/* Estadísticas Rápidas */}
        <View style={p.statsRow}>
          <StatBox label="Entrenos" value={stats.workouts} />
          <StatBox label="Series" value={stats.sets} />
          <StatBox label="Volumen" value={formatVolume(stats.volume)} />
        </View>

        {/* Rachas de Nutrición */}
        <SectionHeader title="🔥 Rachas de Nutrición" />
        <StreakCard current={nutritionStreak.currentStreak} best={nutritionStreak.bestStreak} />

        {/* Sección: Récords */}
        <SectionHeader title="🏆 Récords Personales" />
        <View style={p.card}>
          <Text style={p.cardText}>Tus récords se actualizan automáticamente al terminar un entreno.</Text>
        </View>

        {/* Sección: Logros */}
        <SectionHeader title="🎖️ Logros" />
        <View style={p.achievementsRow}>
          <Achievement icon="🔥" label="Racha 7 días" unlocked={stats.workouts >= 7} />
          <Achievement icon="💪" label="100 series" unlocked={stats.sets >= 100} />
          <Achievement icon="🏋️" label="1 tonelada" unlocked={stats.volume >= 1000} />
          <Achievement icon="" label="Meta cumplida" unlocked={false} />
        </View>

        {/* Sección: Configuración */}
        <SectionHeader title="⚙️ Configuración" />
        <View style={p.card}>
          <SettingItem icon="🔔" label="Notificaciones" />
          <SettingItem icon="📏" label="Unidades (kg/cm)" />
          <SettingItem icon="🌙" label="Modo Oscuro" />
          <TouchableOpacity style={p.signOutRow} onPress={handleSignOut} activeOpacity={0.7}>
            <Text style={p.settingIcon}>🚪</Text>
            <Text style={p.signOutLabel}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Modal de edición */}
      <Modal visible={showModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={m.overlay}>
          <View style={m.sheet}>
            <View style={m.handle} />
            <Text style={m.title}>Editar Perfil</Text>

            <Text style={m.label}>Nombre</Text>
            <TextInput style={m.input} value={editName} onChangeText={setEditName} placeholder="Tu nombre" placeholderTextColor={T3} />

            <View style={m.row}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={m.label}>Peso (kg)</Text>
                <TextInput style={m.input} value={editWeight} onChangeText={setEditWeight} placeholder="75" keyboardType="numeric" placeholderTextColor={T3} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={m.label}>Altura (cm)</Text>
                <TextInput style={m.input} value={editHeight} onChangeText={setEditHeight} placeholder="175" keyboardType="numeric" placeholderTextColor={T3} />
              </View>
            </View>

            <Text style={m.label}>Edad</Text>
            <TextInput style={m.input} value={editAge} onChangeText={setEditAge} placeholder="25" keyboardType="numeric" placeholderTextColor={T3} />

            <Text style={m.label}>Objetivo</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={m.chipScroll}>
              {GOALS.map(g => (
                <TouchableOpacity key={g} style={[m.chip, editGoal === g && m.chipActive]} onPress={() => setEditGoal(g)}>
                  <Text style={[m.chipText, editGoal === g && m.chipTextActive]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity style={[m.saveBtn, saving && { opacity: 0.6 }]} onPress={saveProfile} disabled={saving} activeOpacity={0.8}>
              {saving ? <ActivityIndicator color={BG} /> : <Text style={m.saveBtnText}>Guardar Cambios</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={m.cancelBtn} onPress={() => setShowModal(false)}>
              <Text style={m.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* BARRA INFERIOR */}
      <BottomTabBar />
    </View>
  );
}

// ── Sub-componentes ───────────────────────────────────────────────────────────
function StatBox({ label, value }) {
  return (
    <View style={p.statBox}>
      <Text style={p.statValue}>{value}</Text>
      <Text style={p.statLabel}>{label}</Text>
    </View>
  );
}

function SectionHeader({ title }) {
  return <Text style={p.sectionTitle}>{title}</Text>;
}

function StreakCard({ current, best }) {
  return (
    <View style={p.streakCard}>
      <View style={p.streakItem}>
        <Text style={p.streakIcon}></Text>
        <Text style={p.streakValue}>{current}</Text>
        <Text style={p.streakLabel}>días seguidos</Text>
      </View>
      <View style={p.streakDivider} />
      <View style={p.streakItem}>
        <Text style={p.streakIcon}>🏆</Text>
        <Text style={p.streakValue}>{best}</Text>
        <Text style={p.streakLabel}>mejor racha</Text>
      </View>
    </View>
  );
}

function Achievement({ icon, label, unlocked }) {
  return (
    <View style={[p.achievement, !unlocked && p.achievementLocked]}>
      <Text style={p.achievementIcon}>{icon}</Text>
      <Text style={[p.achievementLabel, !unlocked && p.achievementLabelLocked]}>{label}</Text>
    </View>
  );
}

function SettingItem({ icon, label }) {
  return (
    <View style={p.settingRow}>
      <Text style={p.settingIcon}>{icon}</Text>
      <Text style={p.settingLabel}>{label}</Text>
      <Text style={p.settingArrow}>›</Text>
    </View>
  );
}

// ── Estilos ──────────────────────────────────────────────────────────────────
const p = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  loadingContainer: { flex: 1, backgroundColor: BG, alignItems: 'center', justifyContent: 'center' },
  
  profileHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
  avatar: { width: 70, height: 70, borderRadius: 35, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  avatarText: { fontSize: 28, fontWeight: '800', color: BG },
  userInfo: { flex: 1 },
  userName: { fontSize: 22, fontWeight: '800', color: T1 },
  userMeta: { fontSize: 13, color: T2, marginTop: 2 },
  memberSince: { fontSize: 11, color: T3, marginTop: 4 },
  editBtn: { backgroundColor: SURFACE, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: BORDER },
  editBtnText: { fontSize: 12, fontWeight: '700', color: T1 },

  statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 24 },
  statBox: { flex: 1, backgroundColor: SURFACE, borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: BORDER },
  statValue: { fontSize: 18, fontWeight: '800', color: T1 },
  statLabel: { fontSize: 10, color: T3, fontWeight: '600', marginTop: 2 },

  // Rachas
  streakCard: {
    flexDirection: 'row',
    backgroundColor: SURFACE,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: ACCENT + '30',
  },
  streakItem: { flex: 1, alignItems: 'center' },
  streakIcon: { fontSize: 28, marginBottom: 6 },
  streakValue: { fontSize: 28, fontWeight: '800', color: ACCENT },
  streakLabel: { fontSize: 11, color: T3, fontWeight: '600', marginTop: 2 },
  streakDivider: { width: 1, backgroundColor: BORDER, marginHorizontal: 12 },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: T1, paddingHorizontal: 20, marginBottom: 10 },
  card: { marginHorizontal: 20, backgroundColor: SURFACE, borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: BORDER },
  cardText: { fontSize: 12, color: T3, textAlign: 'center' },

  achievementsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 24, flexWrap: 'wrap' },
  achievement: { width: '47%', backgroundColor: SURFACE, borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: ACCENT + '40' },
  achievementLocked: { borderColor: BORDER, opacity: 0.5 },
  achievementIcon: { fontSize: 24, marginBottom: 6 },
  achievementLabel: { fontSize: 11, fontWeight: '700', color: T1 },
  achievementLabelLocked: { color: T3 },

  settingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: BORDER },
  settingIcon: { fontSize: 18, marginRight: 12, width: 24, textAlign: 'center' },
  settingLabel: { flex: 1, fontSize: 14, color: T1, fontWeight: '500' },
  settingArrow: { fontSize: 18, color: T3 },
  
  signOutRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, marginTop: 8 },
  signOutLabel: { fontSize: 14, color: RED, fontWeight: '700', marginLeft: 12 },
});

const m = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: SURFACE, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: BORDER2, alignSelf: 'center', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: '800', color: T1, marginBottom: 20 },
  label: { fontSize: 11, fontWeight: '700', color: T3, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: SURFACE2, borderWidth: 1, borderColor: BORDER2, borderRadius: 10, padding: 12, fontSize: 15, color: T1, marginBottom: 16 },
  row: { flexDirection: 'row', marginBottom: 0 },
  chipScroll: { marginBottom: 20 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: SURFACE2, borderWidth: 1, borderColor: BORDER2, marginRight: 8 },
  chipActive: { backgroundColor: ACCENT + '20', borderColor: ACCENT },
  chipText: { fontSize: 12, color: T2, fontWeight: '600' },
  chipTextActive: { color: ACCENT, fontWeight: '700' },
  saveBtn: { backgroundColor: ACCENT, borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 12 },
  saveBtnText: { fontSize: 15, fontWeight: '800', color: BG },
  cancelBtn: { alignItems: 'center', padding: 12 },
  cancelBtnText: { fontSize: 14, color: T3, fontWeight: '600' },
});