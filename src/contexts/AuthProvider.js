// src/contexts/AuthProvider.js
import React, { createContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';

export const AuthContext = createContext({
  user: null,
  session: null,
  isLoading: true,
});

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        setSession(data.session ?? null);
        setUser(data.session?.user ?? null);
      } catch (e) {
        if (!mounted) return;
        setSession(null);
        setUser(null);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    const { data } = supabase.auth.onAuthStateChange((_event, s) => {
      if (!mounted) return;
      setSession(s ?? null);
      setUser(s?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({ user, session, isLoading }),
    [user, session, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
