import { supabase } from './supabase';

export async function fetchIsAdmin() {
  const { data, error } = await supabase.rpc('assert_admin');
  if (error) throw error;
  return data === true;
}

export async function requireAdminSession() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!user) {
    const err = new Error('Sesión requerida');
    err.code = '401';
    throw err;
  }
  const isAdmin = await fetchIsAdmin();
  if (!isAdmin) {
    const err = new Error('No autorizado');
    err.code = '403';
    throw err;
  }
  return user;
}

export async function signOutAdmin() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
