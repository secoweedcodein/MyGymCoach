// src/screens/explore/ArticleDetailScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, ActivityIndicator, Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';
import BottomTabBar from '../../../components/BottomTabBar';

const ACCENT = '#C0FF3E';
const BG = '#0D0D0D';
const SURFACE = '#161616';
const SURFACE2 = '#1E1E1E';
const BORDER = '#FFFFFF0D';
const T1 = '#FFFFFF';
const T2 = '#A0A0A0';
const T3 = '#555555';
const PURPLE = '#8B7CFF';
const ORANGE = '#FF6B3E';
const CYAN = '#3EE5FF';

const CATEGORY_IMAGES = {
  'Nutrición': require('../../../assets/suples.png'),
  'Técnica': require('../../../assets/SENTADILLA.png'),
  'Entrenamiento': require('../../../assets/estancamiento.png'),
  'Recuperación': require('../../../assets/SENTADILLA.png'),
  'Suplementación': require('../../../assets/suples.png'),
};

const CATEGORY_COLORS = {
  'Nutrición': ACCENT,
  'Técnica': CYAN,
  'Entrenamiento': ORANGE,
  'Recuperación': PURPLE,
  'Suplementación': PURPLE,
};

function articleImage(article) {
  if (article.image_url && typeof article.image_url === 'string' && article.image_url.startsWith('http')) {
    return { uri: article.image_url };
  }
  return CATEGORY_IMAGES[article.category] || CATEGORY_IMAGES['Nutrición'];
}

function formatDate(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch (e) {
    return '';
  }
}

export default function ArticleDetailScreen() {
  const { id } = useLocalSearchParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadArticle();
  }, [id]);

  useEffect(() => {
    if (!article) return;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('content_favorites')
        .select('content_id')
        .eq('user_id', user.id)
        .eq('content_type', 'article')
        .eq('content_id', id)
        .maybeSingle();
      if (data) setSaved(true);
    })();
  }, [article]);

  async function loadArticle() {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('id, title, category, content, read_time, image_id, image_url, created_at')
        .eq('id', id)
        .single();
      if (error || !data) throw error || new Error('Artículo no encontrado');
      setArticle(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { Alert.alert('Sesión requerida', 'Debes iniciar sesión para guardar artículos'); return; }

    if (saved) {
      const { error } = await supabase
        .from('content_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('content_type', 'article')
        .eq('content_id', id);
      if (error) { Alert.alert('Error', error.message); return; }
      setSaved(false);
      Alert.alert('Eliminado', 'El artículo se quitó de tus guardados');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from('content_favorites').upsert({
        user_id: user.id,
        content_type: 'article',
        content_id: id,
      }, { onConflict: 'user_id,content_type,content_id' });
      if (error) throw error;
      setSaved(true);
      Alert.alert('¡Guardado!', 'El artículo quedó en tus guardados');
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={s.loadingContainer}>
        <ActivityIndicator size="large" color={ACCENT} />
      </View>
    );
  }

  if (error || !article) {
    return (
      <View style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={22} color={T1} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Artículo</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={s.centerBox}>
          <Ionicons name="cloud-offline-outline" size={40} color={T3} />
          <Text style={s.emptyText}>No se pudo cargar el artículo</Text>
          <TouchableOpacity style={s.retryBtn} onPress={loadArticle} activeOpacity={0.8}>
            <Text style={s.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
        <BottomTabBar />
      </View>
    );
  }

  const categoryColor = CATEGORY_COLORS[article.category] || ACCENT;
  const readTime = article.read_time ? `${article.read_time} min` : '5 min';
  const publishedAt = formatDate(article.created_at);
  const paragraphs = (article.content || '')
    .split(/\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 0);

  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HERO SECTION */}
        <View style={s.heroSection}>
          <Image source={articleImage(article)} style={s.heroImage} />
          <View style={s.heroGradient} />
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={22} color={T1} />
          </TouchableOpacity>
          <View style={s.heroBottom}>
            <View style={[s.categoryBadge, { backgroundColor: categoryColor }]}>
              <Ionicons name="book" size={12} color={BG} />
              <Text style={s.categoryBadgeText}>{article.category || 'General'}</Text>
            </View>
            <Text style={s.heroTitle}>{article.title}</Text>
            <View style={s.metaRow}>
              <View style={s.metaItem}>
                <Ionicons name="time-outline" size={14} color={T2} />
                <Text style={s.metaText}>{readTime}</Text>
              </View>
              {publishedAt ? (
                <>
                  <Text style={s.metaDivider}>·</Text>
                  <View style={s.metaItem}>
                    <Ionicons name="calendar-outline" size={14} color={T2} />
                    <Text style={s.metaText}>{publishedAt}</Text>
                  </View>
                </>
              ) : null}
            </View>
          </View>
        </View>

        {/* CONTENIDO */}
        <View style={s.section}>
          {paragraphs.length === 0 ? (
            <View style={s.contentCard}>
              <Text style={s.contentText}>Este artículo aún no tiene contenido.</Text>
            </View>
          ) : (
            paragraphs.map((p, idx) => (
              <View key={idx} style={[s.contentCard, idx > 0 && s.contentCardGap]}>
                <Text style={s.contentText}>{p}</Text>
              </View>
            ))
          )}
        </View>

        {/* BOTÓN GUARDAR */}
        <TouchableOpacity
          style={[s.saveBtn, saved && s.saveBtnSaved]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={20} color={saved ? BG : ACCENT} />
          <Text style={[s.saveBtnText, saved && s.saveBtnTextSaved]}>
            {saving ? 'Guardando...' : saved ? 'Artículo guardado' : 'Guardar artículo'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
      <BottomTabBar />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  loadingContainer: { flex: 1, backgroundColor: BG, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
  backBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: T1, flex: 1 },
  centerBox: { alignItems: 'center', paddingTop: 80, gap: 10 },
  emptyText: { fontSize: 14, fontWeight: '700', color: T2 },
  retryBtn: { marginTop: 8, backgroundColor: ACCENT, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 },
  retryText: { fontSize: 13, fontWeight: '800', color: BG },

  heroSection: { width: '100%', height: 360, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 260, backgroundColor: 'rgba(13,13,13,0.95)' },
  heroBottom: { position: 'absolute', bottom: 20, left: 20, right: 20 },
  categoryBadge: { flexDirection: 'row', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, marginBottom: 12, gap: 6, alignItems: 'center' },
  categoryBadgeText: { fontSize: 11, fontWeight: '800', color: BG, letterSpacing: 0.5 },
  heroTitle: { fontSize: 30, fontWeight: '800', color: T1, marginBottom: 12, letterSpacing: -0.5, lineHeight: 36 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: T2, fontWeight: '500' },
  metaDivider: { fontSize: 12, color: T3 },

  section: { marginTop: 28, paddingHorizontal: 20 },
  contentCard: { backgroundColor: SURFACE, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: BORDER, borderLeftWidth: 4, borderLeftColor: ACCENT },
  contentCardGap: { marginTop: 12 },
  contentText: { fontSize: 15, color: T2, lineHeight: 24 },

  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: SURFACE, borderWidth: 2, borderColor: ACCENT, borderRadius: 16, paddingVertical: 16, marginHorizontal: 20, marginTop: 28 },
  saveBtnSaved: { backgroundColor: ACCENT },
  saveBtnText: { fontSize: 15, fontWeight: '800', color: ACCENT },
  saveBtnTextSaved: { color: BG },
});