// src/screens/explore/CommunityRecipesScreen.js
import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { RECIPES_USERS } from '../data/exploreData';
import BottomTabBar from '../../../components/BottomTabBar';

const ACCENT = '#C0FF3E';
const BG = '#0D0D0D';
const SURFACE = '#161616';
const SURFACE2 = '#1E1E1E';
const BORDER = '#FFFFFF0D';
const T1 = '#FFFFFF';
const T2 = '#A0A0A0';
const T3 = '#555555';

export default function CommunityRecipesScreen() {
  const [search, setSearch] = useState('');

  const filtered = RECIPES_USERS.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.author.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={T1} />
        </TouchableOpacity>
        <Text style={s.title}>Recetas Comunidad</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={s.searchContainer}>
        <Ionicons name="search" size={18} color={T3} />
        <TextInput
          style={s.searchInput}
          placeholder="Buscar recetas o usuarios..."
          placeholderTextColor={T3}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.list}>
        {filtered.map(item => (
          <TouchableOpacity key={item.id} style={s.card} activeOpacity={0.85}>
            <Image source={{ uri: item.image }} style={s.cardImage} />
            <View style={s.cardBody}>
              <Text style={s.cardTitle}>{item.name}</Text>
              <Text style={s.cardAuthor}>{item.author}</Text>
              
              <View style={s.macroRow}>
                <View style={s.macroItem}>
                  <Text style={s.macroValue}>{item.protein}g</Text>
                  <Text style={s.macroLabel}>Proteína</Text>
                </View>
                <View style={s.macroItem}>
                  <Text style={s.macroValue}>{item.calories}</Text>
                  <Text style={s.macroLabel}>Kcal</Text>
                </View>
                <View style={s.macroItem}>
                  <Text style={s.macroValue}>{item.time}</Text>
                  <Text style={s.macroLabel}>Tiempo</Text>
                </View>
              </View>

              <View style={s.socialRow}>
                <View style={s.socialItem}>
                  <Ionicons name="heart" size={16} color={T2} />
                  <Text style={s.socialText}>{item.likes}</Text>
                </View>
                <View style={s.socialItem}>
                  <Ionicons name="chatbubble" size={16} color={T2} />
                  <Text style={s.socialText}>{item.comments}</Text>
                </View>
                <TouchableOpacity style={s.shareBtn} activeOpacity={0.8}>
                  <Ionicons name="share-social" size={16} color={ACCENT} />
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        ))}
        <View style={{ height: 100 }} />
      </ScrollView>

      <BottomTabBar />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '800', color: T1 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: SURFACE, borderRadius: 14, padding: 12, marginHorizontal: 20, marginBottom: 16, borderWidth: 1, borderColor: BORDER },
  searchInput: { flex: 1, color: T1, fontSize: 14, marginLeft: 10 },
  list: { paddingHorizontal: 20, gap: 16 },
  card: { backgroundColor: SURFACE, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: BORDER },
  cardImage: { width: '100%', height: 160 },
  cardBody: { padding: 16 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: T1, marginBottom: 4 },
  cardAuthor: { fontSize: 12, color: ACCENT, fontWeight: '600', marginBottom: 12 },
  macroRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12, backgroundColor: SURFACE2, padding: 10, borderRadius: 10 },
  macroItem: { alignItems: 'center' },
  macroValue: { fontSize: 14, fontWeight: '800', color: T1 },
  macroLabel: { fontSize: 10, color: T3, fontWeight: '600' },
  socialRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  socialItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  socialText: { fontSize: 12, color: T2, fontWeight: '600' },
  shareBtn: { marginLeft: 'auto', width: 36, height: 36, borderRadius: 18, backgroundColor: SURFACE2, alignItems: 'center', justifyContent: 'center' },
});