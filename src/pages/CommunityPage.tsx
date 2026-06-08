import React, { useState } from 'react';
import { Users, Hash, Plus, Trash2, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { useChannels } from '../hooks/useCommunity';
import type { AppView, UserRole } from '../types';

interface CommunityPageProps {
  role: UserRole;
  onNavigate: (view: AppView) => void;
}

export function CommunityPage({ role, onNavigate }: CommunityPageProps) {
  const { channels, loading, addChannel, deleteChannel } = useChannels();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('💬');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await addChannel({ name: name.trim().toLowerCase().replace(/\s+/g, '-'), description, icon, order_index: channels.length });
    setName(''); setDescription(''); setIcon('💬'); setShowForm(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Users className="w-7 h-7 text-cyan-400" />
            Comunidade
          </h1>
          <p className="text-gray-400 mt-1">Conecte-se, tire dúvidas e compartilhe experiências</p>
        </div>
        {(role === 'admin' || role === 'moderator') && (
          <button
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-gray-950 rounded-xl font-medium hover:bg-cyan-400 transition-colors"
          >
            <Plus className="w-4 h-4" /> Novo Canal
          </button>
        )}
      </div>

      {/* Add channel form */}
      {showForm && (
        <motion.form
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleAdd}
          className="mb-6 p-5 bg-gray-900 border border-cyan-500/20 rounded-2xl space-y-3"
        >
          <h3 className="font-medium text-white">Criar canal</h3>
          <div className="flex gap-3">
            <input
              value={icon}
              onChange={e => setIcon(e.target.value)}
              className="w-16 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-center text-xl outline-none focus:border-cyan-500"
              placeholder="💬"
              maxLength={2}
            />
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-white outline-none focus:border-cyan-500"
              placeholder="nome-do-canal"
              required
            />
          </div>
          <input
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-white outline-none focus:border-cyan-500"
            placeholder="Descrição do canal (opcional)"
          />
          <div className="flex gap-3">
            <button type="submit" className="px-5 py-2 bg-cyan-500 text-gray-950 font-medium rounded-xl hover:bg-cyan-400 transition-colors">
              Criar
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2 text-gray-400 hover:text-white transition-colors">
              Cancelar
            </button>
          </div>
        </motion.form>
      )}

      {/* Channels list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-cyan-500" />
        </div>
      ) : channels.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <Users className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p className="text-lg">Nenhum canal criado ainda.</p>
          {(role === 'admin' || role === 'moderator') && (
            <p className="text-sm mt-2">Clique em "Novo Canal" para começar.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {channels.map((channel, i) => (
            <motion.div
              key={channel.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="group relative"
            >
              <button
                onClick={() => onNavigate({ name: 'canal', channelId: channel.id })}
                className="w-full flex items-center gap-4 p-5 bg-gray-900 border border-gray-800 hover:border-cyan-500/30 rounded-2xl transition-all hover:shadow-[0_0_20px_rgba(34,211,238,0.08)] text-left"
              >
                <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                  {channel.icon || '💬'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Hash className="w-3.5 h-3.5 text-gray-500" />
                    <h3 className="font-medium text-white group-hover:text-cyan-400 transition-colors">{channel.name}</h3>
                  </div>
                  {channel.description && (
                    <p className="text-sm text-gray-500 mt-0.5 truncate">{channel.description}</p>
                  )}
                </div>
                <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-cyan-400 transition-colors flex-shrink-0" />
              </button>

              {(role === 'admin' || role === 'moderator') && (
                <button
                  onClick={() => deleteChannel(channel.id)}
                  className="absolute top-3 right-3 p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
