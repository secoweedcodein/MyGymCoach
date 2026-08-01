// src/screens/explore/ArticleDetailScreen.js
import React, { useState, useEffect } from 'react';  // ✅ Agregado useEffect
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, Dimensions, ActivityIndicator, Alert,  // ✅ Agregados ActivityIndicator y Alert
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';  // ✅ Agregado supabase
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

// ✅ Imágenes por categoría (fallback para artículos de Supabase)
const CATEGORY_IMAGES = {
  'Nutrición': require('../../../assets/suples.png'),
  'Técnica': require('../../../assets/SENTADILLA.png'),
  'Entrenamiento': require('../../../assets/estancamiento.png'),
  'Recuperación': require('../../../assets/SENTADILLA.png'),
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

    // ✅ Adaptar nombres de Supabase a la UI
    setArticle({
      ...data,
      categoryColor: data.category_color,
      readTime: data.read_time,
      publishedAt: data.published_at,
      keyTakeaways: data.key_takeaways || [],
    });
    setLoading(false);
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: BG, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={ACCENT} />
      </View>
    );
  }

  if (!article) return null;

  // ✅ Obtener imagen según categoría
  const imageSource = CATEGORY_IMAGES[article.category] || CATEGORY_IMAGES['Nutrición'];

  return (  // ✅ ESTE RETURN FALTABA - era la causa del error
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HERO */}
        <View style={s.heroSection}>
          <Image source={imageSource} style={s.heroImage} />
          <View style={s.heroGradient} />
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={22} color={T1} />
          </TouchableOpacity>
          <View style={s.heroBottom}>
            <View style={[s.categoryBadge, { backgroundColor: article.categoryColor || ACCENT }]}>
              <Text style={s.categoryBadgeText}>{article.category}</Text>
            </View>
            <Text style={s.heroTitle}>{article.title}</Text>
            <View style={s.metaRow}>
              <Ionicons name="person" size={12} color={T2} />
              <Text style={s.metaText}>{article.author}</Text>
              <Text style={s.metaDivider}>·</Text>
              <Ionicons name="time-outline" size={12} color={T2} />
              <Text style={s.metaText}>{article.readTime}</Text>
              <Text style={s.metaDivider}>·</Text>
              <Text style={s.metaText}>{article.publishedAt}</Text>
            </View>
          </View>
        </View>

        {/* INTRO */}
        <View style={s.section}>
          <View style={s.introCard}>
            <Text style={s.introText}>{article.intro}</Text>
          </View>
        </View>

        {/* SECCIONES */}
        {article.sections && article.sections.map((section, sIdx) => (
          <View key={sIdx} style={s.section}>
            <Text style={s.sectionTitle}>{section.title}</Text>
            <View style={s.contentCard}>
              {section.content && section.content.map((item, iIdx) => (
                <View key={iIdx} style={s.contentItem}>
                  <Text style={s.subtitle}>{item.subtitle}</Text>
                  <Text style={s.contentText}>{item.text}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* KEY TAKEAWAYS */}
        {article.keyTakeaways && article.keyTakeaways.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>💡 Puntos clave</Text>
            <View style={s.takeawaysCard}>
              {article.keyTakeaways.map((takeaway, idx) => (
                <View key={idx} style={s.takeawayRow}>
                  <View style={s.takeawayDot}>
                    <Ionicons name="checkmark" size={12} color={BG} />
                  </View>
                  <Text style={s.takeawayText}>{takeaway}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
      <BottomTabBar />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  heroSection: { width: '100%', height: 320, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 220, backgroundColor: 'rgba(13,13,13,0.95)' },
  backBtn: { position: 'absolute', top: 56, left: 20, width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  heroBottom: { position: 'absolute', bottom: 20, left: 20, right: 20 },
  categoryBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, marginBottom: 12 },
  categoryBadgeText: { fontSize: 11, fontWeight: '800', color: BG },
  heroTitle: { fontSize: 28, fontWeight: '800', color: T1, marginBottom: 8, letterSpacing: -0.5, lineHeight: 34 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  metaText: { fontSize: 11, color: T2, fontWeight: '500' },
  metaDivider: { fontSize: 11, color: T3 },
  section: { marginTop: 24, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: T1, marginBottom: 12 },
  introCard: { backgroundColor: SURFACE, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: BORDER, borderLeftWidth: 4, borderLeftColor: ACCENT },
  introText: { fontSize: 14, color: T2, lineHeight: 22 },
  contentCard: { backgroundColor: SURFACE, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: BORDER },
  contentItem: { marginBottom: 16 },
  subtitle: { fontSize: 14, fontWeight: '700', color: ACCENT, marginBottom: 6 },
  contentText: { fontSize: 13, color: T2, lineHeight: 20 },
  takeawaysCard: { backgroundColor: ACCENT + '10', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: ACCENT + '30' },
  takeawayRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  takeawayDot: { width: 22, height: 22, borderRadius: 11, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  takeawayText: { flex: 1, fontSize: 13, color: T1, lineHeight: 20, fontWeight: '500' },
});