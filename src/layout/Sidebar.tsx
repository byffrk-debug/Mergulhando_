import React from 'react';
import { Home, BookOpen, Users, User, Settings, X, ChevronRight } from 'lucide-react';
import type { AppView, UserRole } from '../types';

interface SidebarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  role: UserRole;
  open: boolean;
  onClose: () => void;
}

const navItems = [
  { icon: Home, label: 'Início', view: { name: 'home' } as AppView },
  { icon: BookOpen, label: 'Trilha de Estudos', view: { name: 'trilha', trackId: '' } as AppView },
  { icon: Users, label: 'Comunidade', view: { name: 'comunidade' } as AppView },
  { icon: User, label: 'Meu Perfil', view: { name: 'perfil' } as AppView },
];

export function Sidebar({ currentView, onNavigate, role, open, onClose }: SidebarProps) {
  const isActive = (item: typeof navItems[0]) => {
    if (item.view.name === 'trilha') return currentView.name === 'trilha' || currentView.name === 'modulo' || currentView.name === 'aula';
    return currentView.name === item.view.name;
  };

  const handleNav = (view: AppView) => {
    onNavigate(view);
    onClose();
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-gray-900 border-r border-gray-800 z-50 flex flex-col
        transition-transform duration-300 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <img
              src="https://lh3.googleusercontent.com/d/1pJASlSKVV2jccAQOE1X4UYVgQd1m6k1q"
              alt="Logo"
              className="h-8 object-contain"
              referrerPolicy="no-referrer"
            />
            <span className="font-bold text-sm text-white leading-tight">
              Mergulhando<br />
              <span className="text-cyan-400">na Palavra</span>
            </span>
          </div>
          <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const active = isActive(item);
              const Icon = item.icon;
              return (
                <li key={item.label}>
                  <button
                    onClick={() => handleNav(item.view)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                      active
                        ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-cyan-400' : ''}`} />
                    <span className="flex-1 text-left">{item.label}</span>
                    {active && <ChevronRight className="w-4 h-4 opacity-60" />}
                  </button>
                </li>
              );
            })}
          </ul>

          {(role === 'admin' || role === 'moderator') && (
            <div className="mt-6 pt-4 border-t border-gray-800">
              <p className="text-xs text-gray-600 uppercase tracking-wider px-3 mb-2">Gestão</p>
              <button
                onClick={() => handleNav({ name: 'admin' })}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  currentView.name === 'admin'
                    ? 'bg-pink-500/15 text-pink-400 border border-pink-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Settings className="w-5 h-5 flex-shrink-0" />
                <span>Painel Admin</span>
              </button>
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 flex-shrink-0">
          <p className="text-xs text-gray-600 text-center">© 2025 Mergulhando na Palavra</p>
        </div>
      </aside>
    </>
  );
}
