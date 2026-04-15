'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface AuthState {
  signedIn: boolean;
  memberTier: 'paid' | 'free';
  isAdmin: boolean;
  setSignedIn: (v: boolean) => void;
  setMemberTier: (v: 'paid' | 'free') => void;
  setIsAdmin: (v: boolean) => void;
  isPaid: boolean;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [signedIn, setSignedIn] = useState(false);
  const [memberTier, setMemberTier] = useState<'paid' | 'free'>('paid');
  const [isAdmin, setIsAdmin] = useState(false);

  return (
    <AuthContext.Provider value={{
      signedIn, memberTier, isAdmin,
      setSignedIn, setMemberTier, setIsAdmin,
      isPaid: memberTier === 'paid',
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
