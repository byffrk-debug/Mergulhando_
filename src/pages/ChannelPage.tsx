import React, { useState } from 'react';
import { Hash, Plus, Heart, MessageSquare, Pin, Trash2, ChevronLeft, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useChannels, usePosts } from '../hooks/useCommunity';
import type { AppView, User, UserRole } from '../types';

interface ChannelPageProps {
  channelId: string;
  user: User;
  role: UserRole;
  onNavigate: (view: AppView) => void;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function getInitials(name: string) {
  return name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
}

export function ChannelPage({ channelId, user, role, onNavigate }: ChannelPageProps) {
  const { channels } = useChannels();
  const channel = channels.find(c => c.id === channelId);
  const { posts, loading, createPost, deletePost, togglePin, toggleReaction } = usePosts(channelId, user.id);
  const [showCompose, setShowCompose] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    await createPost(title, content, user.id);
    setTitle(''); setContent(''); setShowCompose(false);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Back */}
      <button
        onClick={() => onNavigate({ name: 'comunidade' })}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-6"
      >
        <ChevronLeft className="w-4 h-4" /> Comunidade
      </button>

      {/* Channel header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center text-xl">
            {channel?.icon || '💬'}
          </div>
          <div>
            <div className="flex items-center gap-1">
              <Hash className="w-4 h-4 text-gray-500" />
              <h1 className="text-xl font-bold text-white">{channel?.name ?? 'Canal'}</h1>
            </div>
            {channel?.description && <p className="text-sm text-gray-400">{channel.description}</p>}
          </div>
        </div>
        <button
          onClick={() => setShowCompose(v => !v)}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-gray-950 rounded-xl font-medium hover:bg-cyan-400 transition-colors"
        >
          <Plus className="w-4 h-4" /> Publicar
        </button>
      </div>

      {/* Compose */}
      <AnimatePresence>
        {showCompose && (
          <motion.form
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={handleSubmit}
            className="mb-6 p-5 bg-gray-900 border border-cyan-500/20 rounded-2xl space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-white">Nova publicação</h3>
              <button type="button" onClick={() => setShowCompose(false)}><X className="w-5 h-5 text-gray-400 hover:text-white" /></button>
            </div>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-white outline-none focus:border-cyan-500"
              placeholder="Título (opcional)"
            />
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-cyan-500 min-h-[100px] resize-y text-sm"
              placeholder="Escreva sua mensagem..."
              required
            />
            <div className="flex gap-3">
              <button type="submit" className="px-5 py-2 bg-cyan-500 text-gray-950 font-medium rounded-xl hover:bg-cyan-400 transition-colors">
                Publicar
              </button>
              <button type="button" onClick={() => setShowCompose(false)} className="px-5 py-2 text-gray-400 hover:text-white transition-colors">
                Cancelar
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Posts */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-cyan-500" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p>Ainda não há publicações. Seja o primeiro!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post, i) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`p-5 bg-gray-900 rounded-2xl border transition-all ${post.is_pinned ? 'border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.08)]' : 'border-gray-800'}`}
            >
              {post.is_pinned && (
                <div className="flex items-center gap-1 text-xs text-cyan-400 mb-2">
                  <Pin className="w-3 h-3" /> Fixado
                </div>
              )}

              {/* Author */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                  {getInitials(post.user_id === user.id ? user.name : 'Aluno')}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">
                    {post.user_id === user.id ? user.name : 'Membro da comunidade'}
                  </p>
                  <p className="text-xs text-gray-500">{formatDate(post.created_at)}</p>
                </div>
              </div>

              {post.title && <h3 className="font-semibold text-white mb-1">{post.title}</h3>}
              <p className="text-sm text-gray-300 whitespace-pre-wrap line-clamp-4">{post.content}</p>

              {/* Actions */}
              <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-800">
                <button
                  onClick={() => toggleReaction(post.id, user.id, post.user_reacted ?? false)}
                  className={`flex items-center gap-1.5 text-sm transition-colors ${post.user_reacted ? 'text-pink-400' : 'text-gray-500 hover:text-pink-400'}`}
                >
                  <Heart className={`w-4 h-4 ${post.user_reacted ? 'fill-current' : ''}`} />
                  {post.reaction_count ?? 0}
                </button>
                <button
                  onClick={() => onNavigate({ name: 'post', postId: post.id, channelId })}
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-cyan-400 transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  {post.comment_count ?? 0} comentário{(post.comment_count ?? 0) !== 1 ? 's' : ''}
                </button>
                <div className="ml-auto flex items-center gap-2">
                  {(role === 'admin' || role === 'moderator') && (
                    <button
                      onClick={() => togglePin(post.id, post.is_pinned)}
                      className={`text-xs px-2 py-1 rounded-lg transition-colors ${post.is_pinned ? 'text-cyan-400 bg-cyan-500/10' : 'text-gray-500 hover:text-cyan-400 hover:bg-cyan-500/10'}`}
                    >
                      <Pin className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {(role === 'admin' || role === 'moderator' || post.user_id === user.id) && (
                    <button
                      onClick={() => deletePost(post.id)}
                      className="text-gray-600 hover:text-red-400 hover:bg-red-400/10 p-1.5 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
