// src/screens/CoachChatScreen.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { sendMessageToCoach } from '../../services/coachChatService';
import { runFullAnalysis, buildUserContextForChat } from '../../services/coachAnalysis';

const ACCENT  = '#C0FF3E';
const BG      = '#0D0D0D';
const SURFACE = '#161616';
const SRF2    = '#1E1E1E';
const BORDER  = '#FFFFFF0D';
const BORDER2 = '#FFFFFF18';
const T1      = '#FFFFFF';
const T2      = '#A0A0A0';
const T3      = '#555555';

// Sugerencias rápidas
const QUICK_PROMPTS = [
  '¿Cómo puedo mejorar mi pecho?',
  '¿Estoy comiendo suficiente proteína?',
  '¿Por qué mi peso no baja?',
  '¿Cómo mejorar mi rutina?',
  '¿Debo hacer semana de descarga?',
];

export default function CoachChatScreen() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '¡Hola! 👋 Soy tu Coach IA. He analizado tus datos y estoy listo para ayudarte. ¿Qué quieres mejorar hoy?' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [userContext, setUserContext] = useState('');
  const flatListRef = useRef(null);

  // Cargar contexto del usuario al montar
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const analysis = await runFullAnalysis(user.id);
      if (analysis) {
        setUserContext(buildUserContextForChat(analysis));
      }
    })();
  }, []);

  const sendMessage = useCallback(async (text) => {
    const message = text || input.trim();
    if (!message || loading) return;

    const userMsg = { role: 'user', content: message };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }));
      const reply = await sendMessageToCoach(apiMessages, userContext);
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Hubo un error procesando tu mensaje. Intenta de nuevo.' }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, userContext]);

  const renderItem = ({ item }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[c.msgRow, isUser && c.msgRowUser]}>
        {!isUser && <Text style={c.avatar}>🧠</Text>}
        <View style={[c.bubble, isUser ? c.bubbleUser : c.bubbleAssistant]}>
          <Text style={[c.msgText, isUser && c.msgTextUser]}>{item.content}</Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={c.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      {/* Header */}
      <View style={c.header}>
        <TouchableOpacity onPress={() => router.back()} style={c.backBtn}>
          <Text style={c.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={c.headerInfo}>
          <Text style={c.title}>Coach IA</Text>
          <Text style={c.status}>
            {loading ? 'Escribiendo...' : 'En línea'}
          </Text>
        </View>
        <View style={c.aiBadge}>
          <Text style={c.aiBadgeText}>🧠</Text>
        </View>
      </View>

      {/* Mensajes */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={c.listContent}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListFooterComponent={loading ? (
          <View style={c.typingRow}>
            <Text style={c.avatar}>🧠</Text>
            <View style={[c.bubble, c.bubbleAssistant]}>
              <ActivityIndicator color={ACCENT} />
            </View>
          </View>
        ) : null}
      />

      {/* Sugerencias rápidas (solo si es el primer mensaje) */}
      {messages.length === 1 && (
        <View style={c.quickRow}>
          {QUICK_PROMPTS.slice(0, 3).map((p, i) => (
            <TouchableOpacity
              key={i}
              style={c.quickChip}
              onPress={() => sendMessage(p)}
            >
              <Text style={c.quickChipText} numberOfLines={1}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Input */}
      <View style={c.inputRow}>
        <TextInput
          style={c.input}
          value={input}
          onChangeText={setInput}
          placeholder="Pregúntale al Coach..."
          placeholderTextColor={T3}
          multiline
          returnKeyType="send"
          onSubmitEditing={() => sendMessage()}
          editable={!loading}
        />
        <TouchableOpacity
          style={[c.sendBtn, (!input.trim() || loading) && c.sendBtnDisabled]}
          onPress={() => sendMessage()}
          disabled={!input.trim() || loading}
        >
          <Text style={c.sendBtnText}>↑</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const c = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingTop: 52, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 11, backgroundColor: SURFACE,
    borderWidth: 1, borderColor: BORDER2, alignItems: 'center', justifyContent: 'center',
  },
  backBtnText: { fontSize: 18, color: T1, fontWeight: '700' },
  headerInfo: { flex: 1 },
  title: { fontSize: 17, fontWeight: '800', color: T1 },
  status: { fontSize: 11, color: ACCENT, marginTop: 2, fontWeight: '600' },
  aiBadge: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: ACCENT,
    alignItems: 'center', justifyContent: 'center',
  },
  aiBadgeText: { fontSize: 20 },

  listContent: { padding: 16, paddingBottom: 8 },
  msgRow: { flexDirection: 'row', marginBottom: 14, gap: 8, alignItems: 'flex-end' },
  msgRowUser: { justifyContent: 'flex-end' },
  avatar: { fontSize: 22, marginBottom: 4 },
  bubble: { maxWidth: '75%', padding: 12, borderRadius: 16 },
  bubbleAssistant: { backgroundColor: SURFACE, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: BORDER },
  bubbleUser: { backgroundColor: ACCENT, borderBottomRightRadius: 4 },
  msgText: { fontSize: 13, color: T1, lineHeight: 20, fontWeight: '500' },
  msgTextUser: { color: BG, fontWeight: '600' },
  typingRow: { flexDirection: 'row', gap: 8, marginBottom: 14, alignItems: 'flex-end' },

  quickRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, paddingBottom: 8, flexWrap: 'wrap' },
  quickChip: {
    backgroundColor: SURFACE, paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 16, borderWidth: 1, borderColor: BORDER2,
  },
  quickChipText: { fontSize: 11, color: T2, fontWeight: '600' },

  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: BORDER, backgroundColor: BG,
  },
  input: {
    flex: 1, backgroundColor: SURFACE, borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: T1,
    borderWidth: 1, borderColor: BORDER2, maxHeight: 100,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: ACCENT,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { fontSize: 20, fontWeight: '800', color: BG },
});