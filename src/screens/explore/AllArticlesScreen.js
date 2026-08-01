// src/screens/explore/AllArticlesScreen.js
import React, { useState, useEffect } from 'react'; // 👉 Agregado useEffect
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, TextInput, ActivityIndicator
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import BottomTabBar from '../../../components/BottomTabBar';

// 👉 IMPORTANTE: Asegúrate de importar tu cliente de Supabase (ajusta la ruta según tu proyecto)
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
const PINK = '#FF3EAA';

const CATEGORIES = ['Todas', 'Nutrición', 'Técnica', 'Entrenamiento', 'Recuperación'];

// Puedes borrar el arreglo estático ALL_ARTICLES porque ya no lo usarás.

export default function AllArticlesScreen() {
    
  const [activeCategory, setActiveCategory] = useState('Todas');
  const [searchQuery, setSearchQuery] = useState('');

  // 👇 --- AQUÍ AGREGAMOS TUS NUEVOS ESTADOS Y EL USEEFFECT --- 👇
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadArticles();
  }, []);

  async function loadArticles() {
    const { data } = await supabase
      .from('articles')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setArticles(data);
    setLoading(false);
  }
  // 👆 -------------------------------------------------------- 👆

  // 👇 --- AQUÍ ACTUALIZAMOS EL FILTRADO PARA USAR 'articles' EN LUGAR DE 'ALL_ARTICLES' --- 👇
  const filteredArticles = articles.filter(a => {
    const matchCategory = activeCategory === 'Todas' || a.category === activeCategory;
    const matchSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <View style={s.container}>
      {/* HEADER */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color={T1} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>📚 Aprende</Text>
          <Text style={s.headerSubtitle}>Artículos basados en ciencia</Text>
        </View>
      </View>

      {/* SEARCH */}
      <View style={s.searchContainer}>
        <Ionicons name="search" size={18} color={T3} />
        <TextInput
          style={s.searchInput}
          placeholder="Buscar artículos..."
          placeholderTextColor={T3}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* CATEGORIES */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.categoriesScroll}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[s.categoryChip, activeCategory === cat && s.categoryChipActive]}
            onPress={() => setActiveCategory(cat)}
            activeOpacity={0.8}
          >
            <Text style={[s.categoryText, activeCategory === cat && s.categoryTextActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ARTICLES LIST */}
      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Pequeña mejora: Mostrar un indicador de carga mientras se obtienen los datos */}
        {loading ? (
          <ActivityIndicator size="large" color={ACCENT} style={{ marginTop: 40 }} />
        ) : (
          <>
            <Text style={s.resultsCount}>
              {filteredArticles.length} {filteredArticles.length === 1 ? 'artículo' : 'artículos'}
            </Text>

            {filteredArticles.map((article) => (
              <TouchableOpacity
                key={article.id}
                style={s.articleCard}
                onPress={() => router.push(`/explore/article-detail?id=${article.id}`)}
                activeOpacity={0.8}
              >
                {/* Nota: si las imágenes de Supabase vienen como URL, deberás usar {uri: article.image} en lugar de require */}
                <Image source={typeof article.image === 'string' ? { uri: article.image } : article.image} style={s.articleImage} />
                <View style={s.articleContent}>
                  <View style={s.articleHeader}>
                    <View style={[s.categoryBadge, { backgroundColor: (article.categoryColor || ACCENT) + '22', borderColor: (article.categoryColor || ACCENT) + '55' }]}>
                      <Text style={[s.categoryText, { color: article.categoryColor || ACCENT }]}>{article.category}</Text>
                    </View>
                    <View style={s.readTimeBadge}>
                      <Ionicons name="time-outline" size={12} color={T3} />
                      <Text style={s.readTimeText}>{article.readTime || '5 min'}</Text>
                    </View>
                  </View>
                  <Text style={s.articleTitle} numberOfLines={2}>{article.title}</Text>
                  <View style={s.authorRow}>
                    <Ionicons name="person-circle" size={12} color={T3} />
                    <Text style={s.authorText}>{article.author}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}

            {filteredArticles.length === 0 && (
              <View style={s.emptyState}>
                <Ionicons name="book-outline" size={48} color={T3} />
                <Text style={s.emptyTitle}>Sin resultados</Text>
                <Text style={s.emptyText}>Prueba con otra categoría o búsqueda</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <BottomTabBar />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16, gap: 12 },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: T1 },
  headerSubtitle: { fontSize: 12, color: T2, marginTop: 2 },

  searchContainer: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 20, backgroundColor: SURFACE, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: BORDER, marginBottom: 16 },
  searchInput: { flex: 1, color: T1, fontSize: 14 },

  categoriesScroll: { paddingHorizontal: 20, marginBottom: 16 },
  categoryChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER, marginRight: 8 },
  categoryChipActive: { backgroundColor: ACCENT, borderColor: ACCENT },
  categoryText: { fontSize: 12, fontWeight: '700', color: T2 },
  categoryTextActive: { color: BG },

  scrollContent: { paddingHorizontal: 20, paddingBottom: 100 },
  resultsCount: { fontSize: 12, color: T3, fontWeight: '600', marginBottom: 12 },

  articleCard: { flexDirection: 'row', backgroundColor: SURFACE, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: BORDER, marginBottom: 12 },
  articleImage: { width: 110, height: 130 },
  articleContent: { flex: 1, padding: 12, justifyContent: 'space-between' },
  articleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  categoryBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  readTimeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  readTimeText: { fontSize: 10, color: T3, fontWeight: '600' },
  articleTitle: { fontSize: 14, fontWeight: '700', color: T1, marginBottom: 6 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  authorText: { fontSize: 11, color: T3, fontWeight: '500' },

  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: T1, marginTop: 8 },
  emptyText: { fontSize: 12, color: T2 },
});