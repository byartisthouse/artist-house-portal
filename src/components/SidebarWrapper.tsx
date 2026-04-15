'use client';

import { useAuth } from '@/lib/auth';
import Sidebar from './Sidebar';
import SignIn from './SignIn';

export default function SidebarWrapper({ children }: { children: React.ReactNode }) {
  const { signedIn } = useAuth();

  if (!signedIn) return <SignIn />;

  return (
    <div className="flex min-h-screen" style={{ background: '#FAFAF8' }}>
      <Sidebar />
      <main className="flex-1" style={{ padding: '28px 36px', maxWidth: 800, background: '#FAFAF8' }}>
        {children}
      </main>
    </div>
  );
}
