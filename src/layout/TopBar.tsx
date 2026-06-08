import React, { useState } from 'react';
import { Menu, Search, LogOut, User as UserIcon, X } from 'lucide-react';
import type { User, UserRole, AppView } from '../types';

interface TopBarProps {
  user: User;
  role: UserRole;
  onLogout: () => void;
  onOpenSidebar: () => void;
  onNavigate: (view: AppView) => void;
  videos: { id: string; title: string; module: string }[];
}

export function TopBar({ user, role, onLogout, onOpenSidebar, onNavigate, videos }: TopBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  const searchResults = searchQuery.trim().length > 1
    ? videos.filter(v => v.title.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 6)
    : [];

  return (
    <header className="h-16 bg-gray-900/95 border-b border-gray-800 backdrop-blur-md flex items-center px-4 gap-4 sticky top-0 z-30 flex-shrink-0">
      {/* Mobile menu button */}
      <button
        onClick={onOpenSidebar}
        className="lg:hidden text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800 transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Search */}
      <div className="flex-1 max-w-md relative">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setSearchOpen(true); }}
            onFocus={() => setSearchOpen(true)}
            onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
            placeholder="Buscar aulas..."
            className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500/50 outline-none"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {searchOpen && searchResults.length > 0 && (
          <div className="absolute top-full mt-2 left-0 right-0 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50">
            {searchResults.map(v => (
              <button
                key={v.id}
                onMouseDown={() => {
                  onNavigate({ name: 'aula', videoId: v.id });
                  setSearchQuery('');
                  setSearchOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800 transition-colors text-left"
              >
                <Search className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <div>
                  <p className="text-sm text-white truncate">{v.title}</p>
                  <p className="text-xs text-gray-500">{v.module}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-3">
        {/* User chip */}
        <div className="hidden sm:flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-full px-3 py-1.5">
          <UserIcon className="w-4 h-4 text-pink-400" />
          <span className="text-sm text-gray-200 max-w-[120px] truncate">{user.name}</span>
          {(role === 'admin' || role === 'moderator') && (
            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${role === 'admin' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-purple-500/20 text-purple-300'}`}>
              {role === 'admin' ? 'ADM' : 'MOD'}
            </span>
          )}
        </div>

        <button
          onClick={onLogout}
          title="Sair"
          className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800 transition-colors"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
