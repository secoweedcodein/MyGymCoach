import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCENT = '#C0FF3E';
const BG = '#0D0D0D';
const SURFACE = '#161616';
const SURFACE2 = '#1E1E1E';
const BORDER = '#FFFFFF0D';
const BORDER2 = '#FFFFFF18';
const T1 = '#FFFFFF';
const T2 = '#A0A0A0';
const T3 = '#555555';

const GOALS = [
  { id: 'ganar_musculo', label: 'Ganar músculo', icon: '💪', description: 'Hipertrofia y fuerza' },
  { id: 'perder_peso', label: 'Perder peso', icon: '🔥', description: 'Quemar grasa' },
  { id: 'mantenimiento', label: 'Mantenimiento', icon: '⚖️', description: 'Mantenerme en forma' },
];

const DAYS_OPTIONS = [
  { id: '2', label: '2 días', icon: '📅' },
  { id: '3', label: '3 días', icon: '📅📅' },
  { id: '4', label: '4 días', icon: '📅📅📅' },
  { id: '5', label: '5 días', icon: '📅📅📅📅' },
  { id: '6', label: '6 días', icon: '🏋️' },
];

export default function OnboardingScreen() {
  const [step, setStep] = useState(1);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [selectedDays, setSelectedDays] = useState(null);
  const [loading, setLoading] = useState(false);

  const fadeAnim = useState(new Animated.Value(0))[0];

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [step]);

  const handleNext = () => {
    if (step === 1 && selectedGoal) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setStep(2);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }
  };

  const handleFinish = async () => {
    if (!selectedDays) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      // Guardar en user_profiles
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .update({
          goal: selectedGoal,
          days_per_week: Number.parseInt(selectedDays, 10),
        })
        .eq('id', user.id)
        .select('id')
        .maybeSingle();

      if (error) throw error;
      if (!profile) throw new Error('No existe el perfil del usuario');

      // Marcar onboarding como completado
      await AsyncStorage.setItem('@mygymcoach_onboarding_completed', 'true');

      // Navegar al home
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      alert(`Error al guardar tu perfil: ${error.message || 'Intenta de nuevo.'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.container}>
      {/* Progress Bar */}
      <View style={s.progressContainer}>
        <View style={[s.progressBar, { width: step === 1 ? '50%' : '100%' }]} />
      </View>

      <Animated.View style={[s.content, { opacity: fadeAnim }]}>
        {step === 1 ? (
          <>
            <Text style={s.title}>¿Cuál es tu objetivo?</Text>
            <Text style={s.subtitle}>
              Esto nos ayuda a personalizar tu experiencia
            </Text>

            <View style={s.optionsContainer}>
              {GOALS.map((goal) => (
                <TouchableOpacity
                  key={goal.id}
                  style={[
                    s.optionCard,
                    selectedGoal === goal.id && s.optionCardSelected,
                  ]}
                  onPress={() => setSelectedGoal(goal.id)}
                  activeOpacity={0.7}
                >
                  <Text style={s.optionIcon}>{goal.icon}</Text>
                  <View style={s.optionText}>
                    <Text style={s.optionLabel}>{goal.label}</Text>
                    <Text style={s.optionDescription}>{goal.description}</Text>
                  </View>
                  {selectedGoal === goal.id && (
                    <Text style={s.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[s.nextButton, !selectedGoal && s.nextButtonDisabled]}
              onPress={handleNext}
              disabled={!selectedGoal}
              activeOpacity={0.8}
            >
              <Text style={s.nextButtonText}>Continuar</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={s.title}>¿Cuántos días entrenarás?</Text>
            <Text style={s.subtitle}>
              Sé realista, puedes cambiarlo después
            </Text>

            <View style={s.daysContainer}>
              {DAYS_OPTIONS.map((day) => (
                <TouchableOpacity
                  key={day.id}
                  style={[
                    s.dayCard,
                    selectedDays === day.id && s.dayCardSelected,
                  ]}
                  onPress={() => setSelectedDays(day.id)}
                  activeOpacity={0.7}
                >
                  <Text style={s.dayLabel}>{day.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={s.buttonRow}>
              <TouchableOpacity
                style={s.backButton}
                onPress={() => setStep(1)}
                activeOpacity={0.8}
              >
                <Text style={s.backButtonText}>Atrás</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.nextButton, !selectedDays && s.nextButtonDisabled]}
                onPress={handleFinish}
                disabled={!selectedDays || loading}
                activeOpacity={0.8}
              >
                <Text style={s.nextButtonText}>
                  {loading ? 'Guardando...' : 'Comenzar'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </Animated.View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  progressContainer: {
    height: 4,
    backgroundColor: SURFACE2,
    marginTop: 20,
  },
  progressBar: {
    height: '100%',
    backgroundColor: ACCENT,
  },
  content: {
    flex: 1,
    padding: 24,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: T1,
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: T2,
    marginBottom: 32,
  },
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SURFACE,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: BORDER,
  },
  optionCardSelected: {
    borderColor: ACCENT,
    backgroundColor: SURFACE2,
  },
  optionIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: T1,
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: T3,
  },
  checkmark: {
    fontSize: 24,
    color: ACCENT,
    fontWeight: '800',
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  dayCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: SURFACE,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: BORDER,
    alignItems: 'center',
  },
  dayCardSelected: {
    borderColor: ACCENT,
    backgroundColor: SURFACE2,
  },
  dayLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: T1,
  },
  nextButton: {
    backgroundColor: ACCENT,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 40,
  },
  nextButtonDisabled: {
    opacity: 0.4,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 40,
  },
  backButton: {
    flex: 1,
    backgroundColor: SURFACE2,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER2,
  },
  backButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: T2,
  },
});