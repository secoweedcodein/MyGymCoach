// src/screens/ExploreScreen.js
import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Dimensions, Image, Animated, Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import BottomTabBar from '../../components/BottomTabBar';
import { supabase } from '../../lib/supabase';

const ACCENT   = '#C0FF3E';
const BG       = '#0D0D0D';
const SURFACE  = '#161616';
const SURFACE2 = '#1E1E1E';
const BORDER   = '#FFFFFF0D';
const T1       = '#FFFFFF';
const T2       = '#A0A0A0';
const T3       = '#555555';
const PURPLE   = '#8B7CFF';
const ORANGE   = '#FF6B3E';
const CYAN     = '#3EE5FF';
const PINK     = '#FF3EAA';

// ✅ Mapa de imágenes disponibles para tendencias

const TREND_IMAGES = {
  abs: require('../../assets/wmremove-transformed.png'),
  hipertrofia: require('../../assets/hiperftrofia.png'),
  funcional: require('../../assets/funcional.png'),
  upper: require('../../assets/upper.png'),
  ppl: require('../../assets/PPL.png'),
  fullbody: require('../../assets/fullbody.png'),
  '5x5': require('../../assets/5x5.png'),
  '30dias': require('../../assets/30diashipertrofia.png'),
};
// ✅ Mapa de imágenes para contenido destacado
const FEATURED_IMAGES = {
  abs: require('../../assets/wmremove-transformed.png'),
  hipertrofia: require('../../assets/hiperftrofia.png'),
  funcional: require('../../assets/funcional.png'),
  upper: require('../../assets/upper.png'),
  ppl: require('../../assets/PPL.png'),
  fullbody: require('../../assets/fullbody.png'),
  '5x5': require('../../assets/5x5.png'),
  '30dias': require('../../assets/30diashipertrofia.png'),
  dominadas: require('../../assets/dominadas.png'),
};


const BADGE_COLORS = {
  popular:   ACCENT,
  ia:        '#8B7CFF',
  nuevo:     '#3EE5FF',
  verificado:'#3E8CFF',
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CATEGORIES = [
  { id: 'trends',    label: '🔥 Tendencias' },
  { id: 'routines',  label: '🏋️ Rutinas' },
  { id: 'recipes',   label: '🍳 Recetas' },
  { id: 'learn',     label: '📚 Aprende' },
  { id: 'challenges',label: '🎯 Retos' },
  { id: 'exercise',  label: '⭐ Ejercicios' },
];

const TRENDING = [
  { id: 'abs-30d', type: 'routine', image: require('../../assets/wmremove-transformed.png'), title: 'Reto 30 días Abs', level: 'Intermedio', rating: 4.8, users: '12.3k', badge: 'popular' },
  { id: 'hipertrofia', type: 'routine', image: require('../../assets/hiperftrofia.png'), title: 'Hipertrofia Avanzada', level: 'Avanzado', rating: 8.1, users: '12.3k' },
  { id: 'funcional', type: 'routine', image: require('../../assets/funcional.png'), title: 'Fuerza Funcional', level: 'Principiante', rating: 4.6, users: '5.4k', badge: 'nuevo' },
];

const ROUTINES = [
  { id: 'upper', image: require('../../assets/upper.png'), title: 'Hipertrofia Upper', level: 'Intermedio', rating: 4.7, users: '12.3k', badge: 'popular' },
  { id: 'ppl', image: require('../../assets/PPL.png'), title: 'Push Pull Legs', level: 'Intermedio', rating: 4.8, users: '9.7k', badge: 'verificado' },
  { id: 'fullbody', image: require('../../assets/fullbody.png'), title: 'Full Body 3 Días', level: 'Principiante', rating: 4.5, users: '6.2k' },
  { id: '5x5', image: require('../../assets/5x5.png'), title: 'Fuerza 5x5', level: 'Avanzado', rating: 4.9, users: '4.8k', badge: 'ia' },
];

const RECIPES_IA = [
  { id: 'bowl-pollo', image: require('../../assets/bowlpollo.png'), name: 'Bowl proteico de pollo', protein: 48, calories: 520, time: '20 min', author: 'MyGymCoach IA' },
  { id: 'pancakes-avena', image: require('../../assets/pancakes.png'), name: 'Pancakes de avena fit', protein: 28, calories: 380, time: '15 min', author: 'MyGymCoach IA' },
  { id: 'wrap-atun', image: require('../../assets/wrap.png'), name: 'Wrap de atún y aguacate', protein: 35, calories: 420, time: '10 min', author: 'MyGymCoach IA' },
];

const RECIPES_USERS = [
  { id: 'ru1', image: 'https://picsum.photos/seed/urecipe1/400/300', name: 'Ensalada de quinoa', protein: 22, calories: 320, time: '12 min', author: '@lucia.fit' },
  { id: 'ru2', image: 'https://picsum.photos/seed/urecipe2/400/300', name: 'Tacos de carne magra', protein: 38, calories: 460, time: '20 min', author: '@carlos_gym' },
];

const ARTICLES = [
  { id: 'suplementos', image: require('../../assets/suples.png'), title: 'Guía completa de suplementos', category: 'Nutrición', readTime: '6 min' },
  { id: 'sentadilla', image: require('../../assets/SENTADILLA.png'), title: 'Técnica correcta de sentadilla', category: 'Técnica', readTime: '4 min' },
  { id: 'estancamiento', image: require('../../assets/estancamiento.png'), title: 'Cómo romper un estancamiento', category: 'Entrenamiento', readTime: '8 min' },
];

const CHALLENGES = [
  { id: 'c1', title: '10.000 pasos al día', participants: '4.2k', daysLeft: 12, progress: 0.4 },
  { id: 'c2', title: 'Sin azúcar 7 días', participants: '2.8k', daysLeft: 3, progress: 0.7 },
  { id: 'c3', title: '100 flexiones diarias', participants: '6.1k', daysLeft: 20, progress: 0.15 },
];

const EXERCISE_OF_DAY = {
  image: require('../../assets/dominadas.png'),
  name: 'Dominadas lastradas',
  muscle: 'Espalda y bíceps',
  difficulty: 'Avanzado',
};

export default function ExploreScreen() {
  const [articles, setArticles] = useState([]);
  useEffect(() => {
  async function loadArticles() {
    const { data } = await supabase
      .from('articles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3);
    
    if (data) {
      setArticles(data.map(a => ({
        id: a.id,
        image: require('../../assets/suples.png'), // Placeholder
        title: a.title,
        category: a.category,
        readTime: a.read_time,
      })));
    }
  }
  loadArticles();
}, []);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('trends');
  const scrollRef = useRef(null);
  const sectionY = useRef({});
  const categoryBarRef = useRef(null);
  const [trends, setTrends] = useState([]);
  const [featured, setFeatured] = useState({
  hero: { title: '30 días de hipertrofia', subtitle: 'Reto del mes', image_id: '30dias', route: '/explore/challenge-detail', participants: '12.548' },
  exercise: { title: 'Dominadas lastradas', subtitle: 'Espalda y bíceps', image_id: 'dominadas', route: '/explore/exercise-day' },
});

useEffect(() => {
  async function loadFeatured() {
    const { data } = await supabase.from('featured_content').select('*');
    if (data) {
      const hero = data.find(d => d.id === 'hero_challenge');
      const ex = data.find(d => d.id === 'exercise_of_day');
      setFeatured({
        hero: hero || featured.hero,
        exercise: ex || featured.exercise,
      });
    }
  }
  loadFeatured();
}, []);

  useEffect(() => {
  async function loadTrends() {
    const { data } = await supabase
      .from('trends')
      .select('*')
      .eq('is_active', true)
      .order('position', { ascending: true });
    if (data) setTrends(data);
  }
  loadTrends();
}, []);
  // ✅ NUEVO: Estado para guardar las recetas reales de la base de datos
  const [userRecipes, setUserRecipes] = useState([]);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(t);
  }, []);

  // ✅ NUEVO: Cargar las últimas 2 recetas de usuario desde Supabase
  useEffect(() => {
    async function loadUserRecipes() {
      const { data } = await supabase
        .from('user_recipes')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(2);
      
      if (data) {
        setUserRecipes(data.map(r => ({
          id: r.id,
          name: r.recipe_name,
          author: r.author_name,
          protein: r.protein,
          calories: r.calories,
          time: r.time,
          image: 'https://picsum.photos/seed/recipe/400/300', // Imagen placeholder
        })));
      }
    }
    loadUserRecipes();
  }, []);

  const handleSectionLayout = useCallback((id) => (e) => {
    sectionY.current[id] = e.nativeEvent.layout.y;
  }, []);

  function scrollToSection(id) {
    setActiveCategory(id);
    const y = sectionY.current[id];
    if (scrollRef.current && typeof y === 'number') {
      scrollRef.current.scrollTo({ y: y - 12, animated: true });
    }
  }

  return (
    <View style={s.container}>
      <View style={s.headerContainer}>
        <Header />
        <CategoryBar ref={categoryBarRef} activeCategory={activeCategory} onSelect={scrollToSection} />
      </View>

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
        onScroll={(e) => {
          const scrollY = e.nativeEvent.contentOffset.y;
          let current = 'trends';
          for (const [id, y] of Object.entries(sectionY.current)) {
            if (scrollY >= y - 100) current = id;
          }
          if (current !== activeCategory) setActiveCategory(current);
        }}
        scrollEventThrottle={16}
      >
        <FadeInUp delay={0}><HeroCard data={featured.hero} /></FadeInUp>

        <View onLayout={handleSectionLayout('trends')}>
  <FadeInUp delay={60}>
    <Section title="🔥 Tendencias" description="Lo más popular este mes" onSeeAll={() => router.push('/explore/trends')}>
  {loading || trends.length === 0 ? <SkeletonRow /> : (
    <HorizontalList data={trends} renderItem={(item) => (
      <ContentCard 
        key={item.id} 
        item={{
          id: item.id,
          title: item.title,
          level: item.level,
          rating: item.rating,
          users: item.users,
          badge: item.badge,
          image_id: item.image_id,
          route: item.route, // ✅ ESTO ES CRUCIAL
        }} 
      />
    )} />
  )}
</Section>
  </FadeInUp>
</View>

        <View onLayout={handleSectionLayout('routines')}>
          <FadeInUp delay={100}>
            <Section title="🏋️ Rutinas" description="Las más populares esta semana" onSeeAll={() => router.push('/explore/routines')}>
              {loading ? <SkeletonRow /> : (
                <HorizontalList data={ROUTINES} renderItem={(item) => (
                  <ContentCard key={item.id} item={item} />
                )} />
              )}
            </Section>
          </FadeInUp>
        </View>

        <View onLayout={handleSectionLayout('recipes')}>
          <FadeInUp delay={140}>
            <Section title="🍳 Recetas IA" description="Generadas según tus objetivos" onSeeAll={() => router.push('/explore/recipes-ai')}>
              {loading ? <SkeletonRow /> : (
                <HorizontalList data={RECIPES_IA} renderItem={(item) => <RecipeCard key={item.id} item={item} />} />
              )}
            </Section>
          </FadeInUp>
          <FadeInUp delay={160}>
  <Section
    title="👨‍🍳 Recetas de usuarios"
    description="Compartidas por la comunidad"
    onSeeAll={() => router.push('/explore/user-recipes')}
  >
    {loading ? (
      <SkeletonRow />
    ) : (
      <HorizontalList data={userRecipes} renderItem={(item) => (
  <RecipeCard key={item.id} item={item} isUser={true} />
)} />
    )}
  </Section>
</FadeInUp>
        </View>

        <View onLayout={handleSectionLayout('learn')}>
  <FadeInUp delay={200}>
    <Section title="📚 Aprende" description="Artículos, técnica y consejos" onSeeAll={() => router.push('/explore/learn')}>
      {loading || articles.length === 0 ? <SkeletonRow /> : (
        <HorizontalList data={articles} renderItem={(item) => <ArticleCard key={item.id} item={item} />} />
      )}
    </Section>
  </FadeInUp>
</View>

        <View onLayout={handleSectionLayout('challenges')}>
          <FadeInUp delay={220}>
            <Section title="🎯 Retos" description="Únete y compite con la comunidad" onSeeAll={() => router.push('/explore/challenge')}>
              {loading ? <SkeletonChallenge /> : (
                <View style={{ paddingHorizontal: 20, gap: 12 }}>
                  {CHALLENGES.map((c) => (
                    <ChallengeCard key={c.id} item={c} onPress={() => router.push(`/explore/challenge/${c.id}`)} />
                  ))}
                </View>
              )}
            </Section>
          </FadeInUp>
        </View>

        <View onLayout={handleSectionLayout('exercise')}>
          <FadeInUp delay={240}>
            <Section title="⭐ Ejercicio del día" description="Domina tu técnica con la guía de hoy" onSeeAll={() => router.push('/explore/exercise-day')}>
             <ExerciseOfDayCard data={featured.exercise} />
            </Section>
          </FadeInUp>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <TouchableOpacity style={s.fab} onPress={() => router.push('/explore/create')} activeOpacity={0.85}>
        <Ionicons name="add" size={28} color={BG} />
      </TouchableOpacity>

      <BottomTabBar />
    </View>
  );
}

function Header() {
  const scale = useRef(new Animated.Value(1)).current;
  function pressIn() { Animated.spring(scale, { toValue: 0.9, useNativeDriver: true, speed: 30 }).start(); }
  function pressOut() { Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20 }).start(); }
  return (
    <View style={s.header}>
      <View style={{ flex: 1 }}>
        <Text style={s.headerTitle}>Explorar</Text>
        <Text style={s.headerSubtitle}>Descubre nuevo contenido para mejorar.</Text>
      </View>
      <Pressable onPressIn={pressIn} onPressOut={pressOut} onPress={() => router.push('/explore/search')}>
        <Animated.View style={[s.searchBtn, { transform: [{ scale }] }]}>
          <Ionicons name="search" size={20} color={T1} />
        </Animated.View>
      </Pressable>
    </View>
  );
}

function CategoryBar({ activeCategory, onSelect }) {
  const scrollRef = useRef(null);
  useEffect(() => {
    if (scrollRef.current) {
      const index = CATEGORIES.findIndex(c => c.id === activeCategory);
      if (index >= 0) scrollRef.current.scrollTo({ x: index * 120 - 100, animated: true });
    }
  }, [activeCategory]);

  return (
    <ScrollView ref={scrollRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.categoryBar}>
      {CATEGORIES.map((cat) => {
        const active = cat.id === activeCategory;
        return (
          <TouchableOpacity key={cat.id} style={[s.chip, active && s.chipActive]} onPress={() => onSelect(cat.id)} activeOpacity={0.8}>
            <Text style={[s.chipText, active && s.chipTextActive]}>{cat.label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

function HeroCard({ data }) {
  const scale = useRef(new Animated.Value(1)).current;
  function pressIn() { Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 30 }).start(); }
  function pressOut() { Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20 }).start(); }

  const imageSource = FEATURED_IMAGES[data?.image_id] || FEATURED_IMAGES['30dias'];

  return (
    <Pressable onPressIn={pressIn} onPressOut={pressOut} style={s.heroWrap}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Image source={imageSource} style={s.heroImage} />
        <LinearGradient colors={['transparent', 'rgba(13,13,13,0.75)', BG]} style={s.heroGradient} />
        <View style={s.heroContent}>
          <View style={s.heroTag}><Text style={s.heroTagText}>RETO DEL MES</Text></View>
          <Text style={s.heroTitle}>{data?.title || '30 días de hipertrofia'}</Text>
          <View style={s.heroMetaRow}>
            <Ionicons name="people" size={14} color={T2} />
            <Text style={s.heroMetaText}>{data?.participants || '0'} participantes</Text>
          </View>
          <TouchableOpacity 
            style={s.heroBtn} 
            activeOpacity={0.85} 
            onPress={() => data?.route && router.push(data.route)}
          >
            <Text style={s.heroBtnText}>Participar</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Pressable>
  );
}

function Section({ title, description, children, onSeeAll }) {
  return (
    <View style={s.section}>
      <View style={s.sectionHeader}>
        <View style={{ flex: 1 }}>
          <Text style={s.sectionTitle}>{title}</Text>
          <Text style={s.sectionDescription}>{description}</Text>
        </View>
        <TouchableOpacity style={s.seeAllBtn} activeOpacity={0.7} onPress={onSeeAll}>
          <Text style={s.seeAllText}>Ver todo</Text>
          <Ionicons name="chevron-forward" size={14} color={ACCENT} />
        </TouchableOpacity>
      </View>
      {children}
    </View>
  );
}

function HorizontalList({ data, renderItem }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}>
      {data.map(renderItem)}
    </ScrollView>
  );
}

function Badge({ type }) {
  const map = { popular: { text: 'Popular', icon: 'flame' }, ia: { text: 'IA', icon: 'sparkles' }, nuevo: { text: 'Nuevo', icon: 'star' }, verificado: { text: 'Verificado', icon: 'checkmark-circle' } };
  const conf = map[type];
  if (!conf) return null;
  const color = BADGE_COLORS[type];
  return (
    <View style={[s.badge, { backgroundColor: color + '22', borderColor: color + '55' }]}>
      <Ionicons name={conf.icon} size={11} color={color} />
      <Text style={[s.badgeText, { color }]}>{conf.text}</Text>
    </View>
  );
}

function PressableCard({ style, children, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;
  function pressIn() { Animated.spring(scale, { toValue: 0.95, useNativeDriver: true, speed: 40 }).start(); }
  function pressOut() { Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 24 }).start(); }
  return (
    <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut}>
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

function ContentCard({ item }) {
  const handlePress = () => {
    // ✅ PRIORIDAD 1: Si viene con ruta directa desde Supabase, usarla SIEMPRE
    if (item.route && item.route.trim()) {
      router.push(item.route.trim());
      return;
    }

    // Fallback: solo para las rutinas del array ROUTINES (que no vienen de Supabase)
    const titleLower = item.title?.toLowerCase() || '';
    
    if (titleLower.includes('abs') && titleLower.includes('30')) {
      router.push('/explore/abs-challenge');
    } else if (titleLower.includes('hipertrofia') && titleLower.includes('avanzada')) {
      router.push('/explore/hipertrofia-challenge');
    } else if (titleLower.includes('hipertrofia') && titleLower.includes('30')) {
      router.push('/explore/challenge-detail');
    } else if (item.id && ['upper', 'ppl', 'fullbody', '5x5', 'funcional', 'powerbuilding'].includes(item.id)) {
      router.push(`/explore/routine-detail?id=${item.id}`);
    } else {
      // Último recurso: ir a la pantalla de rutina con el ID
      router.push(`/explore/routine-detail?id=${item.id}`);
    }
  };

  // Obtener la imagen correcta
  const imageSource = item.image_id && TREND_IMAGES[item.image_id]
    ? TREND_IMAGES[item.image_id]
    : (typeof item.image === 'string' ? { uri: item.image } : item.image) || TREND_IMAGES.abs;

  return (
    <PressableCard style={s.card} onPress={handlePress}>
      <View style={s.cardImageWrap}>
        <Image source={imageSource} style={s.cardImage} />
        {item.badge && (
          <View style={s.cardBadgeWrap}>
            <Badge type={item.badge} />
          </View>
        )}
      </View>
      <View style={s.cardBody}>
        <Text style={s.cardTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={s.cardSub}>{item.level}</Text>
        <View style={s.cardMetaRow}>
          <View style={s.cardMetaItem}>
            <Ionicons name="star" size={12} color={ACCENT} />
            <Text style={s.cardMetaText}>{item.rating}</Text>
          </View>
          <View style={s.cardMetaItem}>
            <Ionicons name="people" size={12} color={T3} />
            <Text style={s.cardMetaText}>{item.users}</Text>
          </View>
        </View>
      </View>
    </PressableCard>
  );
}

function RecipeCard({ item, isUser = false }) {
  const handlePress = () => {
    if (isUser) {
      // ✅ Ahora sí navegamos al detalle con el ID real de Supabase
      router.push(`/explore/user-recipe-detail?id=${item.id}`);
    } else {
      router.push(`/explore/recipe-detail?id=${item.id}`);
    }
  };

  return (
    <PressableCard style={s.card} onPress={handlePress}>
      <View style={s.cardImageWrap}>
        <Image
          source={typeof item.image === 'string' ? { uri: item.image } : item.image}
          style={s.cardImage}
        />
        <View style={s.cardBadgeWrap}>
          {isUser ? (
            <View style={[s.aiBadge, { backgroundColor: ORANGE + 'DD' }]}>
              <Ionicons name="people" size={10} color={T1} />
              <Text style={s.aiBadgeText}>USER</Text>
            </View>
          ) : (
            <View style={s.aiBadge}>
              <Ionicons name="sparkles" size={10} color={ACCENT} />
              <Text style={s.aiBadgeText}>IA</Text>
            </View>
          )}
        </View>
      </View>
      <View style={s.cardBody}>
        <Text style={s.cardTitle} numberOfLines={1}>{item.name}</Text>
        <Text style={s.cardSub}>{item.author}</Text>
        <View style={s.cardMetaRow}>
          <View style={s.cardMetaItem}>
            <Ionicons name="flash" size={12} color={ORANGE} />
            <Text style={s.cardMetaText}>{item.protein}g prot</Text>
          </View>
          <View style={s.cardMetaItem}>
            <Ionicons name="flame" size={12} color={ACCENT} />
            <Text style={s.cardMetaText}>{item.calories} kcal</Text>
          </View>
        </View>
        <View style={s.cardMetaRow}>
          <View style={s.cardMetaItem}>
            <Ionicons name="time-outline" size={12} color={T3} />
            <Text style={s.cardMetaText}>{item.time}</Text>
          </View>
        </View>
      </View>
    </PressableCard>
  );
}

function ArticleCard({ item }) {
  return (
    <PressableCard 
      style={s.card} 
      onPress={() => router.push(`/explore/article-detail?id=${item.id}`)}
    >
      <View style={s.cardImageWrap}>
        <Image source={typeof item.image === 'string' ? { uri: item.image } : item.image} style={s.cardImage} />
        <View style={s.cardBadgeWrap}>
          <View style={s.categoryPill}>
            <Text style={s.categoryPillText}>{item.category}</Text>
          </View>
        </View>
      </View>
      <View style={s.cardBody}>
        <Text style={s.cardTitle} numberOfLines={2}>{item.title}</Text>
        <View style={s.cardMetaItem}>
          <Ionicons name="book-outline" size={12} color={T3} />
          <Text style={s.cardMetaText}>{item.readTime} de lectura</Text>
        </View>
      </View>
    </PressableCard>
  );
}

function ChallengeCard({ item, onPress }) {
  return (
    <TouchableOpacity style={s.challengeCard} activeOpacity={0.85} onPress={onPress}>
      <View style={s.challengeIconWrap}>
        <Ionicons name="trophy" size={20} color={ACCENT} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.challengeTitle}>{item.title}</Text>
        <View style={s.challengeTrack}>
          <View style={[s.challengeFill, { width: `${Math.round(item.progress * 100)}%` }]} />
        </View>
        <View style={s.challengeMetaRow}>
          <Text style={s.challengeMetaText}>{item.participants} participantes</Text>
          <Text style={s.challengeMetaText}>{item.daysLeft} días restantes</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function ExerciseOfDayCard({ data }) {
  const imageSource = FEATURED_IMAGES[data?.image_id] || FEATURED_IMAGES['dominadas'];
  const [muscle, difficulty] = (data?.subtitle || '').split(' · ');

  return (
    <View style={[s.card, s.exerciseCard]}>
      <Image source={imageSource} style={s.exerciseImage} />
      <LinearGradient colors={['transparent', 'rgba(13,13,13,0.85)']} style={s.exerciseGradient} />
      <View style={s.exerciseContent}>
        <Text style={s.exerciseName}>{data?.title || 'Dominadas lastradas'}</Text>
        <View style={s.exerciseMetaRow}>
          {muscle && <View style={s.categoryPill}><Text style={s.categoryPillText}>{muscle}</Text></View>}
          {difficulty && <View style={s.categoryPill}><Text style={s.categoryPillText}>{difficulty}</Text></View>}
        </View>
        <TouchableOpacity 
          style={s.exerciseBtn} 
          activeOpacity={0.85} 
          onPress={() => data?.route && router.push(data.route)}
        >
          <Ionicons name="play-circle" size={16} color={BG} />
          <Text style={s.exerciseBtnText}>Ver ejecución</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function FadeInUp({ children, delay = 0 }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 420, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 420, delay, useNativeDriver: true }),
    ]).start();
  }, []);
  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}

function usePulse() {
  const pulse = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);
  return pulse;
}

function SkeletonRow() {
  const pulse = usePulse();
  return (
    <View style={{ flexDirection: 'row', paddingHorizontal: 20, gap: 12 }}>
      {[0, 1, 2].map((i) => (
        <Animated.View key={i} style={[s.card, s.skeletonCard, { opacity: pulse }]} />
      ))}
    </View>
  );
}

function SkeletonChallenge() {
  const pulse = usePulse();
  return (
    <View style={{ paddingHorizontal: 20, gap: 12 }}>
      {[0, 1].map((i) => (
        <Animated.View key={i} style={[s.challengeCard, { opacity: pulse }]} />
      ))}
    </View>
  );
}

function EmptyState({ onRefresh }) {
  return (
    <View style={s.emptyState}>
      <Ionicons name="cloud-offline-outline" size={32} color={T3} />
      <Text style={s.emptyTitle}>Sin contenido por ahora</Text>
      <Text style={s.emptyText}>Vuelve a intentarlo en unos minutos.</Text>
      <TouchableOpacity style={s.emptyBtn} onPress={onRefresh} activeOpacity={0.8}>
        <Text style={s.emptyBtnText}>Actualizar</Text>
      </TouchableOpacity>
    </View>
  );
}

const CARD_WIDTH = SCREEN_WIDTH * 0.42;
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  headerContainer: { backgroundColor: BG, zIndex: 10 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
  headerTitle: { fontSize: 32, fontWeight: '800', color: T1, letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 13, color: T2, marginTop: 4, fontWeight: '500' },
  searchBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER, alignItems: 'center', justifyContent: 'center' },
  categoryBar: { paddingHorizontal: 20, gap: 8, paddingBottom: 16 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER },
  chipActive: { backgroundColor: ACCENT, borderColor: ACCENT },
  chipText: { fontSize: 13, fontWeight: '700', color: T2 },
  chipTextActive: { color: '#000' },
  scrollContent: { paddingTop: 8 },
  heroWrap: { marginHorizontal: 20, marginBottom: 36, borderRadius: 24, overflow: 'hidden', backgroundColor: SURFACE },
  heroImage: { width: '100%', height: 220 },
  heroGradient: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 160 },
  heroContent: { position: 'absolute', left: 20, right: 20, bottom: 18 },
  heroTag: { alignSelf: 'flex-start', backgroundColor: ACCENT, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, marginBottom: 10 },
  heroTagText: { fontSize: 10, fontWeight: '800', color: '#000', letterSpacing: 0.5 },
  heroTitle: { fontSize: 24, fontWeight: '800', color: T1, marginBottom: 8, letterSpacing: -0.5 },
  heroMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
  heroMetaText: { fontSize: 12, color: T2, fontWeight: '600' },
  heroBtn: { backgroundColor: ACCENT, borderRadius: 14, paddingVertical: 12, alignItems: 'center', width: 150 },
  heroBtnText: { fontSize: 14, fontWeight: '800', color: '#000' },
  section: { marginBottom: 32 },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 20, marginBottom: 14 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: T1, letterSpacing: -0.3 },
  sectionDescription: { fontSize: 12, color: T2, marginTop: 3, fontWeight: '500' },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingTop: 2 },
  seeAllText: { fontSize: 12, fontWeight: '700', color: ACCENT },
  card: { width: CARD_WIDTH, backgroundColor: SURFACE, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: BORDER },
  cardImageWrap: { width: '100%', height: 110, position: 'relative' },
  cardImage: { width: '100%', height: '100%' },
  cardBadgeWrap: { position: 'absolute', top: 8, left: 8 },
  cardBody: { padding: 12, gap: 4 },
  cardTitle: { fontSize: 13, fontWeight: '700', color: T1 },
  cardSub: { fontSize: 11, color: T2, fontWeight: '500' },
  cardMetaRow: { flexDirection: 'row', gap: 10, marginTop: 2 },
  cardMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardMetaText: { fontSize: 11, color: T3, fontWeight: '600' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, borderWidth: 1, paddingHorizontal: 7, paddingVertical: 3 },
  badgeText: { fontSize: 10, fontWeight: '800' },
  categoryPill: { backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  categoryPillText: { fontSize: 10, fontWeight: '700', color: T1 },
  challengeCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: SURFACE, borderRadius: 18, borderWidth: 1, borderColor: BORDER, padding: 16, height: 92 },
  challengeIconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: ACCENT + '1A', alignItems: 'center', justifyContent: 'center' },
  challengeTitle: { fontSize: 14, fontWeight: '700', color: T1, marginBottom: 8 },
  challengeTrack: { height: 6, borderRadius: 3, backgroundColor: SURFACE2, overflow: 'hidden' },
  challengeFill: { height: '100%', borderRadius: 3, backgroundColor: ACCENT },
  challengeMetaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  challengeMetaText: { fontSize: 10, color: T3, fontWeight: '600' },
  exerciseCard: { width: SCREEN_WIDTH - 40, marginHorizontal: 20, height: 240 },
  exerciseImage: { width: '100%', height: '100%', position: 'absolute' },
  exerciseGradient: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 160 },
  exerciseContent: { position: 'absolute', left: 16, right: 16, bottom: 16 },
  exerciseName: { fontSize: 20, fontWeight: '800', color: T1, marginBottom: 8 },
  exerciseMetaRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  exerciseBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: ACCENT, borderRadius: 14, paddingVertical: 12 },
  exerciseBtnText: { fontSize: 13, fontWeight: '800', color: BG },
  skeletonCard: { height: 176, backgroundColor: SURFACE2 },
  emptyState: { marginHorizontal: 20, backgroundColor: SURFACE, borderRadius: 18, borderWidth: 1, borderColor: BORDER, borderStyle: 'dashed', paddingVertical: 32, alignItems: 'center', gap: 6 },
  emptyTitle: { fontSize: 14, fontWeight: '700', color: T1, marginTop: 4 },
  emptyText: { fontSize: 12, color: T2, textAlign: 'center' },
  emptyBtn: { marginTop: 10, backgroundColor: ACCENT, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 18 },
  emptyBtnText: { fontSize: 12, fontWeight: '800', color: '#000' },
  fab: { position: 'absolute', bottom: 100, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8, zIndex: 20 },
aiBadge: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 3,
  backgroundColor: PURPLE + 'DD',
  paddingHorizontal: 6,
  paddingVertical: 3,
  borderRadius: 6,
},
aiBadgeText: { fontSize: 9, fontWeight: '800', color: T1 },
});