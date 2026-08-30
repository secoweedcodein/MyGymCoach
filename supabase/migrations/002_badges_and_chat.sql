-- Tabla de insignias disponibles
CREATE TABLE IF NOT EXISTS badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT, -- emoji or icon name
  category TEXT CHECK (category IN ('training', 'nutrition', 'consistency', 'challenge', 'special')),
  requirement_type TEXT, -- e.g. 'total_sessions', 'streak_days', 'total_volume'
  requirement_value NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insignias desbloqueadas por usuario
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Historial de mensajes del coach
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user', 'assistant')) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Policies for badges (everyone can read)
CREATE POLICY "Badges are viewable by everyone."
  ON badges FOR SELECT
  USING (true);

-- Policies for user_badges
CREATE POLICY "Users can view their own badges."
  ON user_badges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own badges."
  ON user_badges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own badges."
  ON user_badges FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own badges."
  ON user_badges FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for chat_messages
CREATE POLICY "Users can view their own chat messages."
  ON chat_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat messages."
  ON chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat messages."
  ON chat_messages FOR DELETE
  USING (auth.uid() = user_id);

-- Insert default badges
INSERT INTO badges (name, description, icon, category, requirement_type, requirement_value) VALUES
('Primera Sesión', 'Completaste tu primer entrenamiento', '🏋️', 'training', 'total_sessions', 1),
('Racha 7 Días', 'Entrenaste 7 días seguidos', '🔥', 'consistency', 'streak_days', 7),
('100 Series', 'Alcanzaste 100 series totales', '💪', 'training', 'total_sets', 100),
('1 Tonelada', 'Levantaste 1000kg en total', '🏆', 'training', 'total_volume', 1000),
('Racha 30 Días', 'Entrenaste 30 días seguidos', '⭐', 'consistency', 'streak_days', 30),
('500 Series', 'Alcanzaste 500 series totales', '🥇', 'training', 'total_sets', 500),
('10 Toneladas', 'Levantaste 10000kg en total', '💎', 'training', 'total_volume', 10000),
('Reto Completado', 'Completaste un reto de la comunidad', '🎯', 'challenge', 'challenges_completed', 1);
