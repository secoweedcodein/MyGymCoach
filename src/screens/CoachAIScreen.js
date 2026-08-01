// src/screens/CoachAIScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Modal,
} from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { runFullAnalysis } from '../../services/coachAnalysis';
import BottomTabBar from '../../components/BottomTabBar';

const ACCENT   = '#C0FF3E';
const BG       = '#0D0D0D';
const SURFACE  = '#161616';
const SRF2     = '#1E1E1E';
const BORDER   = '#FFFFFF0D';
const BORDER2  = '#FFFFFF18';
const T1       = '#FFFFFF';
const T2       = '#A0A0A0';
const T3       = '#555555';
const RED      = '#FF453A';
const ORANGE   = '#FF9500';
const BLUE     = '#3E8EFF';
const GREEN    = '#3DD68C';

export default function CoachAIScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [showProgress, setShowProgress] = useState(false);

  const loadAnalysis = useCallback(async () => {
    if (!userId) return;
    try {
      const result = await runFullAnalysis(userId);
      setAnalysis(result);
    } catch (err) {
      console.error('[CoachAI] Error:', err);
    }
  }, [userId]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        await loadAnalysis();
      }
      setLoading(false);
    })();
  }, []);

  useFocusEffect(useCallback(() => {
    if (userId) loadAnalysis();
  }, [userId, loadAnalysis]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAnalysis();
    setRefreshing(false);
  }, [loadAnalysis]);

  if (loading) {
    return (
      <View style={s.loading}>
        <ActivityIndicator size="large" color={ACCENT} />
        <Text style={s.loadingText}>Analizando tus datos...</Text>
      </View>
    );
  }

  if (!analysis) {
    return (
      <View style={s.loading}>
        <Text style={s.loadingText}>No se pudieron cargar los datos</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} />}
        contentContainerStyle={s.scroll}
      >
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.replace('/')} style={s.backBtn}>
  <Text style={s.backBtnText}>←</Text>
</TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.title}>Coach IA</Text>
            <Text style={s.subtitle}>Tu entrenador personal inteligente</Text>
          </View>
          <View style={s.aiBadge}>
            <Text style={s.aiBadgeText}>🧠</Text>
          </View>
        </View>

        {/* Motivación del día */}
        <View style={s.quoteCard}>
          <View style={s.quoteGlow} />
          <Text style={s.quoteIcon}>💡</Text>
          <Text style={s.quoteText}>"{analysis.quote}"</Text>
        </View>

        {/* SECCIÓN 1: Resumen del día */}
        <SectionTitle icon="📊" label="Resumen del día" />
        <View style={s.card}>
          <DailySummary data={analysis.daily} />
        </View>

        {/* SECCIÓN 2: Análisis del entrenamiento */}
        <SectionTitle icon="🏋️" label="Entrenamiento" />
        <View style={s.card}>
          <TrainingAnalysis data={analysis.training} />
        </View>

        {/* SECCIÓN 3: Análisis nutricional (con rachas) */}
        <SectionTitle icon="🥗" label="Nutrición" />
        <View style={s.card}>
          <NutritionAnalysis data={analysis.nutrition} />
        </View>

        {/* SECCIÓN 4: Progreso físico */}
        <SectionTitle icon="⚖️" label="Progreso físico" />
        <View style={s.card}>
          <PhysicalProgress data={analysis.physical} />
        </View>

        {/* SECCIÓN 5: Récords */}
        <SectionTitle icon="🏆" label="Récords" />
        <View style={s.card}>
          <RecordsSection data={analysis.records} />
        </View>

        {/* SECCIÓN 6: Recomendaciones */}
        <SectionTitle icon="✨" label="Recomendaciones" />
        <View style={s.card}>
          {analysis.recommendations.map((rec, idx) => (
            <RecommendationItem key={idx} rec={rec} />
          ))}
        </View>

        {/* BOTÓN: ANALIZAR PROGRESO */}
        <TouchableOpacity
          style={s.analyzeBtn}
          onPress={() => setShowProgress(true)}
          activeOpacity={0.85}
        >
          <View style={s.analyzeBtnGlow} />
          <View style={s.analyzeBtnContent}>
            <Text style={s.analyzeBtnIcon}>📈</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.analyzeBtnTitle}>Analizar progreso</Text>
              <Text style={s.analyzeBtnSub}>Ver resumen y recomendaciones</Text>
            </View>
            <Text style={s.analyzeBtnArrow}>→</Text>
          </View>
        </TouchableOpacity>

        {/* SECCIÓN: Preguntar al Coach */}
        <TouchableOpacity
          style={s.askBtn}
          onPress={() => router.push('/coach-chat')}
          activeOpacity={0.85}
        >
          <View style={s.askBtnGlow} />
          <View style={s.askBtnContent}>
            <View style={s.askBtnLeft}>
              <Text style={s.askBtnIcon}>💬</Text>
              <View>
                <Text style={s.askBtnTitle}>Hacer una consulta</Text>
                <Text style={s.askBtnSub}>Pregúntale algo al Coach IA</Text>
              </View>
            </View>
            <Text style={s.askBtnArrow}>→</Text>
          </View>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* MODAL DE ANÁLISIS DE PROGRESO */}
      <ProgressModal 
        visible={showProgress} 
        onClose={() => setShowProgress(false)} 
        data={analysis} 
      />

      {/* BARRA INFERIOR */}
      <BottomTabBar />
    </View>
  );
}

// ─── Modal de Análisis de Progreso ───────────────────────────────────────────
function ProgressModal({ visible, onClose, data }) {
  const calAdherence = data.nutrition.totalDays > 0 
    ? Math.round((data.nutrition.daysCaloriesOk / data.nutrition.totalDays) * 100) 
    : 0;
  
  const weightChange = parseFloat(data.physical.changeKg || 0);
  const weightText = weightChange > 0 
    ? `subió ${weightChange} kg` 
    : weightChange < 0 
      ? `bajó ${Math.abs(weightChange)} kg` 
      : 'se mantuvo';

  const volumeChange = Math.abs(data.training.volumeChange || 0);
  const sessionsThisMonth = Math.max(4, data.training.thisWeekSessions * 4);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={pm.overlay}>
        <View style={pm.sheet}>
          <View style={pm.handle} />
          <Text style={pm.title}>Análisis de Progreso</Text>

          <View style={pm.checklist}>
            <CheckItem icon="✔" text={`Entrenaste ${sessionsThisMonth} veces este mes`} />
            <CheckItem icon="✔" text={`Aumentaste un ${volumeChange}% tu volumen`} />
            <CheckItem icon="✔" text={`Tu peso ${weightText}`} />
            {data.records.bestProgress && (
              <CheckItem icon="✔" text={`Tu fuerza aumentó en: ${data.records.bestProgress.name} +${data.records.bestProgress.progress.toFixed(1)} kg`} />
            )}
            <CheckItem icon="✔" text={`Cumpliste tu objetivo calórico el ${calAdherence}% de los días`} />
          </View>

          <View style={pm.divider} />

          <Text style={pm.recTitle}>Coach IA recomienda:</Text>
          <View style={pm.recs}>
            <RecItem text="Aumentar carbohidratos los días de pierna." />
            <RecItem text="Mantener el volumen actual." />
            <RecItem text="Añadir una serie extra en espalda." />
          </View>

          <TouchableOpacity style={pm.closeBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={pm.closeBtnText}>Entendido, ¡a seguir!</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function CheckItem({ icon, text }) {
  return (
    <View style={pm.checkRow}>
      <Text style={pm.checkIcon}>{icon}</Text>
      <Text style={pm.checkText}>{text}</Text>
    </View>
  );
}

function RecItem({ text }) {
  return (
    <View style={pm.recRow}>
      <View style={pm.recDot} />
      <Text style={pm.recText}>{text}</Text>
    </View>
  );
}

// ── Componentes auxiliares ───────────────────────────────────────────────────
function SectionTitle({ icon, label }) {
  return (
    <View style={st.sectionHeader}>
      <Text style={st.sectionIcon}>{icon}</Text>
      <Text style={st.sectionLabel}>{label}</Text>
    </View>
  );
}

function DailySummary({ data }) {
  if (!data) return <Text style={ds.emptyText}>No hay datos disponibles</Text>;
  
  const calPct = data.goalCalories > 0 ? data.caloriesConsumed / data.goalCalories : 0;
  const protPct = data.proteinGoal > 0 ? data.proteinConsumed / data.proteinGoal : 0;

  return (
    <View>
      <View style={ds.row}>
        <View style={ds.stat}>
          <Text style={ds.statLabel}>Calorías</Text>
          <Text style={ds.statValue}>{data.caloriesConsumed}<Text style={ds.statUnit}>/{data.goalCalories}</Text></Text>
          <View style={ds.barTrack}>
            <View style={[ds.barFill, { width: `${Math.min(calPct * 100, 100)}%`, backgroundColor: ACCENT }]} />
          </View>
        </View>
        <View style={ds.stat}>
          <Text style={ds.statLabel}>Proteína</Text>
          <Text style={ds.statValue}>{Math.round(data.proteinConsumed)}<Text style={ds.statUnit}>/{data.proteinGoal}g</Text></Text>
          <View style={ds.barTrack}>
            <View style={[ds.barFill, { width: `${Math.min(protPct * 100, 100)}%`, backgroundColor: BLUE }]} />
          </View>
        </View>
      </View>
      <View style={ds.row}>
        <View style={ds.miniStat}>
          <Text style={ds.miniIcon}>{data.workoutDone ? '✅' : '⏳'}</Text>
          <View>
            <Text style={ds.miniLabel}>Entrenamiento</Text>
            <Text style={ds.miniValue}>{data.workoutDone ? `${data.workoutTime} min` : 'Pendiente'}</Text>
          </View>
        </View>
        <View style={ds.miniStat}>
          <Text style={ds.miniIcon}>🔥</Text>
          <View>
            <Text style={ds.miniLabel}>Restantes</Text>
            <Text style={ds.miniValue}>{data.caloriesRemaining} kcal</Text>
          </View>
        </View>
      </View>
      {data.recommendation && (
        <View style={ds.tipBox}>
          <Text style={ds.tipIcon}></Text>
          <Text style={ds.tipText}>{data.recommendation}</Text>
        </View>
      )}
    </View>
  );
}

function TrainingAnalysis({ data }) {
  return (
    <View>
      <View style={ta.statsRow}>
        <View style={ta.statBox}>
          <Text style={ta.statValue}>{data.thisWeekSessions}</Text>
          <Text style={ta.statLabel}>Sesiones</Text>
        </View>
        <View style={ta.statBox}>
          <Text style={ta.statValue}>{data.thisWeekVolume}</Text>
          <Text style={ta.statLabel}>Volumen (kg)</Text>
        </View>
        <View style={ta.statBox}>
          <Text style={[ta.statValue, { color: data.volumeChange >= 0 ? GREEN : RED }]}>
            {data.volumeChange >= 0 ? '+' : ''}{data.volumeChange}%
          </Text>
          <Text style={ta.statLabel}>vs sem. pasada</Text>
        </View>
      </View>
      {data.insights.map((insight, idx) => (
        <View key={idx} style={ta.insightRow}>
          <Text style={ta.insightDot}>•</Text>
          <Text style={ta.insightText}>{insight}</Text>
        </View>
      ))}
    </View>
  );
}

function NutritionAnalysis({ data }) {
  return (
    <View>
      <View style={na.statsRow}>
        <View style={na.statBox}>
          <Text style={na.statValue}>{data.avgCalories}</Text>
          <Text style={na.statLabel}>kcal promedio</Text>
        </View>
        <View style={na.statBox}>
          <Text style={na.statValue}>{data.avgProtein}g</Text>
          <Text style={na.statLabel}>proteína</Text>
        </View>
      </View>

      {/* SISTEMA DE RACHAS */}
      <View style={na.streakContainer}>
        <View style={na.streakBox}>
          <Text style={na.streakIcon}>🔥</Text>
          <Text style={na.streakValue}>{data.currentStreak || 0}</Text>
          <Text style={na.streakLabel}>días seguidos</Text>
        </View>
        <View style={na.streakBox}>
          <Text style={na.streakIcon}>🏆</Text>
          <Text style={na.streakValue}>{data.bestStreak || 0}</Text>
          <Text style={na.streakLabel}>mejor racha</Text>
        </View>
      </View>

      <View style={na.complianceRow}>
        <CompliancePill label="Calorías" value={data.daysCaloriesOk} total={data.totalDays} color={ACCENT} />
        <CompliancePill label="Proteína" value={data.daysProteinOk} total={data.totalDays} color={BLUE} />
      </View>
      {data.insights.map((insight, idx) => (
        <View key={idx} style={na.insightRow}>
          <Text style={na.insightDot}>•</Text>
          <Text style={na.insightText}>{insight}</Text>
        </View>
      ))}
    </View>
  );
}

function CompliancePill({ label, value, total, color }) {
  return (
    <View style={cp.wrap}>
      <Text style={cp.label}>{label}</Text>
      <Text style={[cp.value, { color }]}>{value}/{total}</Text>
      <View style={cp.barTrack}>
        <View style={[cp.barFill, { width: `${total > 0 ? (value / total) * 100 : 0}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

function PhysicalProgress({ data }) {
  if (!data.hasData) {
    return <Text style={pp.empty}>{data.insight}</Text>;
  }
  const isLoss = parseFloat(data.changeKg) < 0;
  const isGain = parseFloat(data.changeKg) > 0;
  return (
    <View>
      <View style={pp.mainStat}>
        <Text style={pp.weight}>{data.currentWeight} kg</Text>
        <Text style={[pp.change, { color: isLoss ? GREEN : isGain ? ORANGE : T2 }]}>
          {isLoss ? '↓' : isGain ? '↑' : '='} {Math.abs(parseFloat(data.changeKg))} kg en {data.daysDiff} días
        </Text>
      </View>
      <View style={pp.insightBox}>
        <Text style={pp.insightText}>{data.insight}</Text>
      </View>
    </View>
  );
}

function RecordsSection({ data }) {
  if (!data.hasRecords) {
    return <Text style={rs.empty}>{data.insights[0]}</Text>;
  }
  return (
    <View>
      {data.recent.map((r, idx) => (
        <View key={idx} style={rs.recordRow}>
          <Text style={rs.medal}>{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={rs.exercise}>{r.exercise}</Text>
            <Text style={rs.date}>{r.date}</Text>
          </View>
          <Text style={rs.value}>{r.weight}kg × {r.reps}</Text>
        </View>
      ))}
      {data.bestProgress && (
        <View style={rs.progressBox}>
          <Text style={rs.progressIcon}>📈</Text>
          <Text style={rs.progressText}>
            Mayor progreso: <Text style={rs.progressBold}>{data.bestProgress.name}</Text> (+{data.bestProgress.progress.toFixed(1)} kg)
          </Text>
        </View>
      )}
    </View>
  );
}

function RecommendationItem({ rec }) {
  const priorityConfig = {
    high:   { color: RED,    label: 'ALTA',   bg: RED + '15',    border: RED + '40' },
    medium: { color: ORANGE, label: 'MEDIA',  bg: ORANGE + '15', border: ORANGE + '40' },
    low:    { color: GREEN,  label: 'BAJA',   bg: GREEN + '15',  border: GREEN + '40' },
  };
  const cfg = priorityConfig[rec.priority] || priorityConfig.low;
  return (
    <View style={[ri.wrap, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
      <Text style={ri.icon}>{rec.icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={ri.text}>{rec.text}</Text>
      </View>
      <View style={[ri.badge, { borderColor: cfg.color }]}>
        <Text style={[ri.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
      </View>
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  loading: { flex: 1, backgroundColor: BG, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: T3, marginTop: 12, fontSize: 13 },
  scroll: { paddingBottom: 40 },

  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: 52, paddingBottom: 16 },
  backBtn: { width: 38, height: 38, borderRadius: 11, backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER2, alignItems: 'center', justifyContent: 'center' },
  backBtnText: { fontSize: 18, color: T1, fontWeight: '700' },
  title: { fontSize: 22, fontWeight: '800', color: T1, letterSpacing: -0.5 },
  subtitle: { fontSize: 12, color: T3, marginTop: 2, fontWeight: '500' },
  aiBadge: { width: 40, height: 40, borderRadius: 20, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center' },
  aiBadgeText: { fontSize: 20 },

  quoteCard: { marginHorizontal: 20, marginBottom: 20, backgroundColor: SURFACE, borderRadius: 18, padding: 20, borderWidth: 1, borderColor: ACCENT + '30', overflow: 'hidden', position: 'relative' },
  quoteGlow: { position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: ACCENT, opacity: 0.08 },
  quoteIcon: { fontSize: 24, marginBottom: 8 },
  quoteText: { fontSize: 14, color: T1, fontWeight: '600', lineHeight: 22, fontStyle: 'italic' },

  card: { marginHorizontal: 20, marginBottom: 16, backgroundColor: SURFACE, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: BORDER },

  analyzeBtn: {
    marginHorizontal: 20, marginBottom: 16, backgroundColor: SURFACE,
    borderRadius: 18, padding: 18, borderWidth: 1, borderColor: BLUE + '40',
    overflow: 'hidden', position: 'relative',
  },
  analyzeBtnGlow: {
    position: 'absolute', top: -20, right: -20, width: 100, height: 100,
    borderRadius: 50, backgroundColor: BLUE, opacity: 0.1,
  },
  analyzeBtnContent: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  analyzeBtnIcon: { fontSize: 28 },
  analyzeBtnTitle: { fontSize: 15, fontWeight: '800', color: T1, marginBottom: 2 },
  analyzeBtnSub: { fontSize: 11, color: T3, fontWeight: '500' },
  analyzeBtnArrow: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: BLUE,
    alignItems: 'center', justifyContent: 'center',
  },

  askBtn: {
    marginHorizontal: 20, marginTop: 8, backgroundColor: SURFACE,
    borderRadius: 18, padding: 18, borderWidth: 1, borderColor: ACCENT + '40',
    overflow: 'hidden', position: 'relative',
  },
  askBtnGlow: { position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: 50, backgroundColor: ACCENT, opacity: 0.1 },
  askBtnContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  askBtnLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  askBtnIcon: { fontSize: 28 },
  askBtnTitle: { fontSize: 15, fontWeight: '800', color: T1, marginBottom: 2 },
  askBtnSub: { fontSize: 11, color: T3, fontWeight: '500' },
  askBtnArrow: { width: 36, height: 36, borderRadius: 18, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center' },
});

const st = StyleSheet.create({
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, marginBottom: 10, marginTop: 8 },
  sectionIcon: { fontSize: 16 },
  sectionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 2, color: T3, textTransform: 'uppercase' },
});

const ds = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  stat: { flex: 1 },
  statLabel: { fontSize: 10, color: T3, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: '800', color: T1, letterSpacing: -0.5 },
  statUnit: { fontSize: 11, color: T3, fontWeight: '600' },
  barTrack: { height: 4, backgroundColor: SRF2, borderRadius: 2, marginTop: 6, overflow: 'hidden' },
  barFill: { height: 4, borderRadius: 2 },
  miniStat: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: SRF2, padding: 10, borderRadius: 10 },
  miniIcon: { fontSize: 20 },
  miniLabel: { fontSize: 10, color: T3, fontWeight: '600' },
  miniValue: { fontSize: 13, color: T1, fontWeight: '700', marginTop: 1 },
  tipBox: { flexDirection: 'row', gap: 8, backgroundColor: ACCENT + '12', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: ACCENT + '30', marginTop: 4 },
  tipIcon: { fontSize: 16 },
  tipText: { flex: 1, fontSize: 12, color: T1, fontWeight: '500', lineHeight: 18 },
  emptyText: { fontSize: 12, color: T3, textAlign: 'center', paddingVertical: 20 },
});

const ta = StyleSheet.create({
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  statBox: { flex: 1, backgroundColor: SRF2, padding: 12, borderRadius: 10, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '800', color: T1 },
  statLabel: { fontSize: 9, color: T3, fontWeight: '600', marginTop: 2, textTransform: 'uppercase' },
  insightRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  insightDot: { color: ACCENT, fontSize: 16, fontWeight: '800', lineHeight: 18 },
  insightText: { flex: 1, fontSize: 12, color: T2, lineHeight: 18, fontWeight: '500' },
});

const na = StyleSheet.create({
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  statBox: { flex: 1, backgroundColor: SRF2, padding: 12, borderRadius: 10, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '800', color: T1 },
  statLabel: { fontSize: 9, color: T3, fontWeight: '600', marginTop: 2, textTransform: 'uppercase' },
  
  // Rachas
  streakContainer: { 
    flexDirection: 'row', 
    gap: 10, 
    marginBottom: 14,
    backgroundColor: ACCENT + '10',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ACCENT + '30',
  },
  streakBox: { flex: 1, alignItems: 'center', padding: 8 },
  streakIcon: { fontSize: 24, marginBottom: 4 },
  streakValue: { fontSize: 24, fontWeight: '800', color: ACCENT },
  streakLabel: { fontSize: 10, color: T3, fontWeight: '600', marginTop: 2 },
  
  complianceRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  insightRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  insightDot: { color: ACCENT, fontSize: 16, fontWeight: '800', lineHeight: 18 },
  insightText: { flex: 1, fontSize: 12, color: T2, lineHeight: 18, fontWeight: '500' },
});

const cp = StyleSheet.create({
  wrap: { flex: 1 },
  label: { fontSize: 10, color: T3, fontWeight: '600', marginBottom: 4 },
  value: { fontSize: 18, fontWeight: '800', marginBottom: 6 },
  barTrack: { height: 4, backgroundColor: SRF2, borderRadius: 2, overflow: 'hidden' },
  barFill: { height: 4, borderRadius: 2 },
});

const pp = StyleSheet.create({
  empty: { fontSize: 12, color: T3, textAlign: 'center', paddingVertical: 10 },
  mainStat: { alignItems: 'center', paddingVertical: 10, marginBottom: 10, borderBottomWidth: 1, borderBottomColor: BORDER },
  weight: { fontSize: 32, fontWeight: '800', color: T1, letterSpacing: -1 },
  change: { fontSize: 12, fontWeight: '700', marginTop: 4 },
  insightBox: { backgroundColor: SRF2, padding: 12, borderRadius: 10 },
  insightText: { fontSize: 12, color: T2, lineHeight: 18, textAlign: 'center', fontWeight: '500' },
});

const rs = StyleSheet.create({
  empty: { fontSize: 12, color: T3, textAlign: 'center', paddingVertical: 10 },
  recordRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10, borderBottomWidth: 1, borderBottomColor: BORDER },
  medal: { fontSize: 20 },
  exercise: { fontSize: 13, fontWeight: '700', color: T1 },
  date: { fontSize: 10, color: T3, marginTop: 2 },
  value: { fontSize: 13, fontWeight: '800', color: ACCENT },
  progressBox: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12, backgroundColor: SRF2, padding: 12, borderRadius: 10 },
  progressIcon: { fontSize: 18 },
  progressText: { flex: 1, fontSize: 12, color: T2, fontWeight: '500' },
  progressBold: { color: ACCENT, fontWeight: '700' },
});

const ri = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  icon: { fontSize: 22 },
  text: { flex: 1, fontSize: 12, color: T1, fontWeight: '500', lineHeight: 18 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  badgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
});

const pm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: SURFACE, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, borderWidth: 1, borderColor: BORDER2 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: BORDER2, alignSelf: 'center', marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '800', color: T1, marginBottom: 20, textAlign: 'center' },
  
  checklist: { marginBottom: 20 },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  checkIcon: { fontSize: 16, color: GREEN, fontWeight: '800', marginTop: 2 },
  checkText: { flex: 1, fontSize: 14, color: T1, fontWeight: '500', lineHeight: 20 },
  
  divider: { height: 1, backgroundColor: BORDER, marginVertical: 20 },
  
  recTitle: { fontSize: 16, fontWeight: '700', color: ACCENT, marginBottom: 12 },
  recs: { marginBottom: 24 },
  recRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  recDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: ACCENT, marginTop: 7 },
  recText: { flex: 1, fontSize: 14, color: T2, fontWeight: '500', lineHeight: 20 },
  
  closeBtn: { backgroundColor: ACCENT, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  closeBtnText: { fontSize: 15, fontWeight: '800', color: BG },
});