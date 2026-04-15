'use client';

import { AuthProvider } from '@/lib/auth';
import SidebarWrapper from './SidebarWrapper';

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SidebarWrapper>{children}</SidebarWrapper>
    </AuthProvider>
  );
}
