import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import type { User, UserRole, AppView, Video } from '../types';

interface AppShellProps {
  user: User;
  role: UserRole;
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  onLogout: () => void;
  videos: Video[];
  children: React.ReactNode;
}

export function AppShell({ user, role, currentView, onNavigate, onLogout, videos, children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 overflow-hidden">
      {/* Fixed background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-600/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-pink-600/5 blur-[120px]" />
      </div>

      {/* Sidebar */}
      <Sidebar
        currentView={currentView}
        onNavigate={onNavigate}
        role={role}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <TopBar
          user={user}
          role={role}
          onLogout={onLogout}
          onOpenSidebar={() => setSidebarOpen(true)}
          onNavigate={onNavigate}
          videos={videos}
        />

        {/* Content area */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
