import { supabase } from '../lib/supabase';

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function signInWithPassword(credentials) {
  const { data, error } = await supabase.auth.signInWithPassword(credentials);
  if (error) throw error;
  return data;
}

export async function signUp(credentials) {
  const { data, error } = await supabase.auth.signUp(credentials);
  if (error) throw error;
  return data;
}
