// src/screens/explore/ArticleDetailScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, Dimensions, ActivityIndicator, Alert,
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
const PINK = '#FF3EAA';

const { width } = Dimensions.get('window');

// Imágenes por categoría
const CATEGORY_IMAGES = {
  'Nutrición': require('../../../assets/suples.png'),
  'Técnica': require('../../../assets/SENTADILLA.png'),
  'Entrenamiento': require('../../../assets/estancamiento.png'),
  'Recuperación': require('../../../assets/SENTADILLA.png'),
};

// Colores por categoría
const CATEGORY_COLORS = {
  'Nutrición': ACCENT,
  'Técnica': CYAN,
  'Entrenamiento': ORANGE,
  'Recuperación': PURPLE,
};

export default function ArticleDetailScreen() {
  const { id } = useLocalSearchParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadArticle();
  }, [id]);

  async function loadArticle() {
    setLoading(true);
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      console.error('Error cargando artículo:', error);
      Alert.alert('Error', 'No se encontró el artículo');
      router.back();
      return;
    }

    setArticle({
      ...data,
      categoryColor: data.category_color || CATEGORY_COLORS[data.category] || ACCENT,
      readTime: data.read_time || '0 min',
      publishedAt: data.published_at || '',
      keyTakeaways: data.key_takeaways || [],
    });
    setLoading(false);
  }

  if (loading) {
    return (
      <View style={s.loadingContainer}>
        <ActivityIndicator size="large" color={ACCENT} />
      </View>
    );
  }

  if (!article) return null;

  const imageSource = CATEGORY_IMAGES[article.category] || CATEGORY_IMAGES['Nutrición'];
  const categoryColor = article.categoryColor || CATEGORY_COLORS[article.category] || ACCENT;

  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HERO SECTION */}
        <View style={s.heroSection}>
          <Image source={imageSource} style={s.heroImage} />
          <View style={s.heroGradient} />
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={22} color={T1} />
          </TouchableOpacity>
          <View style={s.heroBottom}>
            <View style={[s.categoryBadge, { backgroundColor: categoryColor }]}>
              <Ionicons name="book" size={12} color={BG} />
              <Text style={s.categoryBadgeText}>{article.category}</Text>
            </View>
            <Text style={s.heroTitle}>{article.title}</Text>
            <View style={s.metaRow}>
              <View style={s.metaItem}>
                <Ionicons name="person-circle" size={14} color={T2} />
                <Text style={s.metaText}>{article.author}</Text>
              </View>
              <Text style={s.metaDivider}>·</Text>
              <View style={s.metaItem}>
                <Ionicons name="time-outline" size={14} color={T2} />
                <Text style={s.metaText}>{article.readTime}</Text>
              </View>
              <Text style={s.metaDivider}>·</Text>
              <View style={s.metaItem}>
                <Ionicons name="calendar-outline" size={14} color={T2} />
                <Text style={s.metaText}>{article.publishedAt}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* INTRODUCCIÓN */}
        <View style={s.section}>
          <View style={s.introCard}>
            <View style={s.introHeader}>
              <Ionicons name="information-circle" size={24} color={categoryColor} />
              <Text style={s.introLabel}>INTRODUCCIÓN</Text>
            </View>
            <Text style={s.introText}>{article.intro}</Text>
          </View>
        </View>

        {/* SECCIONES DEL ARTÍCULO */}
        {article.sections && article.sections.map((section, sIdx) => (
          <View key={sIdx} style={s.section}>
            <View style={s.sectionHeader}>
              <View style={[s.sectionDot, { backgroundColor: categoryColor }]} />
              <Text style={s.sectionTitle}>{section.title}</Text>
            </View>
            <View style={s.contentCard}>
              {section.content && section.content.map((item, iIdx) => (
                <View key={iIdx} style={s.contentItem}>
                  <View style={s.contentHeader}>
                    <View style={[s.contentIcon, { backgroundColor: categoryColor + '20' }]}>
                      <Ionicons name="checkmark" size={14} color={categoryColor} />
                    </View>
                    <Text style={s.subtitle}>{item.subtitle}</Text>
                  </View>
                  <Text style={s.contentText}>{item.text}</Text>
                  {iIdx < section.content.length - 1 && <View style={s.divider} />}
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* KEY TAKEAWAYS */}
        {article.keyTakeaways && article.keyTakeaways.length > 0 && (
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Ionicons name="bulb" size={24} color={ACCENT} />
              <Text style={s.sectionTitle}>Puntos clave</Text>
            </View>
            <View style={s.takeawaysCard}>
              {article.keyTakeaways.map((takeaway, idx) => (
                <View key={idx} style={s.takeawayRow}>
                  <View style={[s.takeawayDot, { backgroundColor: categoryColor }]}>
                    <Ionicons name="checkmark" size={12} color={BG} />
                  </View>
                  <Text style={s.takeawayText}>{takeaway}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* BOTÓN GUARDAR */}
        <TouchableOpacity
          style={[s.saveBtn, saved && s.saveBtnSaved]}
          onPress={() => setSaved(!saved)}
          activeOpacity={0.85}
        >
          <Ionicons name={saved ? "bookmark" : "bookmark-outline"} size={20} color={saved ? BG : ACCENT} />
          <Text style={[s.saveBtnText, saved && s.saveBtnTextSaved]}>
            {saved ? 'Artículo guardado' : 'Guardar artículo'}
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
  
  // Hero section
  heroSection: { width: '100%', height: 360, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 260, backgroundColor: 'rgba(13,13,13,0.95)' },
  backBtn: { position: 'absolute', top: 56, left: 20, width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  heroBottom: { position: 'absolute', bottom: 20, left: 20, right: 20 },
  categoryBadge: { flexDirection: 'row', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, marginBottom: 12, gap: 6, alignItems: 'center' },
  categoryBadgeText: { fontSize: 11, fontWeight: '800', color: BG, letterSpacing: 0.5 },
  heroTitle: { fontSize: 30, fontWeight: '800', color: T1, marginBottom: 12, letterSpacing: -0.5, lineHeight: 36 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: T2, fontWeight: '500' },
  metaDivider: { fontSize: 12, color: T3 },

  // Sections
  section: { marginTop: 28, paddingHorizontal: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  sectionDot: { width: 8, height: 8, borderRadius: 4 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: T1 },

  // Intro card
  introCard: { backgroundColor: SURFACE, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: BORDER, borderLeftWidth: 4 },
  introHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  introLabel: { fontSize: 10, fontWeight: '800', color: T3, letterSpacing: 1 },
  introText: { fontSize: 15, color: T2, lineHeight: 24 },

  // Content card
  contentCard: { backgroundColor: SURFACE, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: BORDER },
  contentItem: { marginBottom: 18 },
  contentHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  contentIcon: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  subtitle: { fontSize: 16, fontWeight: '700', color: T1 },
  contentText: { fontSize: 14, color: T2, lineHeight: 22, marginLeft: 34 },
  divider: { height: 1, backgroundColor: BORDER, marginTop: 18, marginLeft: 34 },

  // Takeaways
  takeawaysCard: { backgroundColor: ACCENT + '08', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: ACCENT + '30' },
  takeawayRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  takeawayDot: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  takeawayText: { flex: 1, fontSize: 14, color: T1, lineHeight: 22, fontWeight: '500' },

  // Save button
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: SURFACE, borderWidth: 2, borderColor: ACCENT, borderRadius: 16, paddingVertical: 16, marginHorizontal: 20, marginTop: 28 },
  saveBtnSaved: { backgroundColor: ACCENT },
  saveBtnText: { fontSize: 15, fontWeight: '800', color: ACCENT },
  saveBtnTextSaved: { color: BG },
});