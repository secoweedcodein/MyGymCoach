// src/screens/admin/AdminArticlesScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';

const ACCENT = '#C0FF3E';
const BG = '#0D0D0D';
const SURFACE = '#161616';
const BORDER = '#FFFFFF0D';
const T1 = '#FFFFFF';
const T2 = '#A0A0A0';
const T3 = '#555555';
const RED = '#FF453A';

export default function AdminArticlesScreen() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadArticles();
  }, []);

  async function loadArticles() {
    setLoading(true);
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setArticles(data || []);
    }
    setLoading(false);
  }

  function handleDelete(article) {
    Alert.alert(
      'Eliminar artículo',
      `¿Seguro que quieres eliminar "${article.title}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase
              .from('articles')
              .delete()
              .eq('id', article.id);

            if (error) {
              Alert.alert('Error', error.message);
            } else {
              setArticles(prev => prev.filter(a => a.id !== article.id));
              Alert.alert('Eliminado', 'Artículo eliminado correctamente');
            }
          }
        }
      ]
    );
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
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>📚 Artículos</Text>
          <Text style={s.headerSubtitle}>{articles.length} artículos publicados</Text>
        </View>
        <TouchableOpacity
          style={s.addBtn}
          onPress={() => router.push('/admin/article-form')}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={20} color={BG} />
        </TouchableOpacity>
      </View>

      {/* LISTA */}
      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {articles.length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="document-text-outline" size={48} color={T3} />
            <Text style={s.emptyTitle}>Sin artículos</Text>
            <Text style={s.emptyText}>Crea el primero con el botón +</Text>
          </View>
        ) : (
          articles.map((article) => (
            <View key={article.id} style={s.articleCard}>
              <View style={s.articleHeader}>
                <View style={[s.categoryBadge, { backgroundColor: (article.category_color || ACCENT) + '22' }]}>
                  <Text style={[s.categoryText, { color: article.category_color || ACCENT }]}>
                    {article.category}
                  </Text>
                </View>
                <Text style={s.readTime}>{article.read_time}</Text>
              </View>

              <Text style={s.articleTitle}>{article.title}</Text>
              <Text style={s.articleMeta}>
                Por {article.author} · {article.published_at}
              </Text>

              <View style={s.actionsRow}>
                <TouchableOpacity
                  style={s.editBtn}
                  onPress={() => router.push({
                    pathname: '/admin/article-form',
                    params: { id: article.id }
                  })}
                  activeOpacity={0.8}
                >
                  <Ionicons name="create-outline" size={16} color={ACCENT} />
                  <Text style={s.editBtnText}>Editar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={s.deleteBtn}
                  onPress={() => handleDelete(article)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="trash-outline" size={16} color={RED} />
                  <Text style={s.deleteBtnText}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  loading: { flex: 1, backgroundColor: BG, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16, gap: 12 },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: T1 },
  headerSubtitle: { fontSize: 12, color: T2, marginTop: 2 },
  addBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center' },

  scrollContent: { padding: 20, paddingBottom: 100 },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: T1, marginTop: 8 },
  emptyText: { fontSize: 12, color: T2 },

  articleCard: { backgroundColor: SURFACE, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: BORDER },
  articleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  categoryBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  categoryText: { fontSize: 11, fontWeight: '700' },
  readTime: { fontSize: 11, color: T3, fontWeight: '600' },
  articleTitle: { fontSize: 16, fontWeight: '700', color: T1, marginBottom: 6 },
  articleMeta: { fontSize: 11, color: T3, marginBottom: 12 },

  actionsRow: { flexDirection: 'row', gap: 10 },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: ACCENT + '15', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: ACCENT + '40' },
  editBtnText: { fontSize: 12, fontWeight: '700', color: ACCENT },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: RED + '15', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: RED + '40' },
  deleteBtnText: { fontSize: 12, fontWeight: '700', color: RED },
});