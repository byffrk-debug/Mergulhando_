import React, { useState, useEffect } from 'react';
import { Users, Plus, Trash2, Heart, MessageSquare, Pin, Pencil, Send, X, Check, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useChannels, usePosts } from '../hooks/useCommunity';
import type { AppView, User, UserRole } from '../types';

interface CommunityPageProps {
  user: User;
  role: UserRole;
  onNavigate: (view: AppView) => void;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return 'agora';
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)} h`;
  if (diff < 604800) return `há ${Math.floor(diff / 86400)} d`;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function Avatar({ name, avatarUrl }: { name: string; avatarUrl?: string }) {
  const initials = name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
  if (avatarUrl) {
    return (
      <div className="w-10 h-10 rounded-full flex-shrink-0 overflow-hidden">
        <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
      </div>
    );
  }
  return (
    <div className="w-10 h-10 rounded-full flex-shrink-0 bg-gradient-to-br from-cyan-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white">
      {initials}
    </div>
  );
}

// ─── Feed de um espaço (timeline) ─────────────────────────────────────────────
function ChannelFeed({ channelId, user, role, onNavigate }: {
  channelId: string; user: User; role: UserRole; onNavigate: (v: AppView) => void;
}) {
  const { posts, loading, createPost, updatePost, deletePost, togglePin, toggleReaction } = usePosts(channelId, user.id);
  const canModerate = role === 'admin' || role === 'moderator';

  const [composing, setComposing] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [posting, setPosting] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setPosting(true);
    await createPost(title, content, user.id);
    setPosting(false);
    setTitle(''); setContent(''); setComposing(false);
  };

  const startEdit = (post: { id: string; title?: string; content: string }) => {
    setEditingId(post.id);
    setEditTitle(post.title ?? '');
    setEditContent(post.content);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editContent.trim()) return;
    setSaving(true);
    const err = await updatePost(editingId, editTitle, editContent);
    setSaving(false);
    if (err) { toast.error('Erro ao salvar: ' + err.message); return; }
    toast.success('Post atualizado.');
    setEditingId(null);
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('Excluir esta publicação?')) return;
    await deletePost(postId);
    toast.success('Publicação excluída.');
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Composer */}
      {!composing ? (
        <button
          onClick={() => setComposing(true)}
          className="flex items-center gap-3 p-3 bg-gray-900 border border-gray-800 rounded-2xl hover:border-cyan-500/30 transition-colors text-left"
        >
          <Avatar name={user.name} avatarUrl={user.avatar_url} />
          <span className="flex-1 text-sm text-gray-500">Compartilhe algo com a comunidade…</span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 text-gray-950 text-xs font-semibold">
            <Send className="w-3.5 h-3.5" /> Publicar
          </span>
        </button>
      ) : (
        <motion.form
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handlePublish}
          className="p-4 bg-gray-900 border border-cyan-500/30 rounded-2xl space-y-3"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-white text-sm">Nova publicação</h3>
            <button type="button" onClick={() => setComposing(false)}><X className="w-5 h-5 text-gray-400 hover:text-white" /></button>
          </div>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-white outline-none focus:border-cyan-500 text-sm"
            placeholder="Título (opcional)"
          />
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            autoFocus
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-cyan-500 min-h-[110px] resize-y text-sm"
            placeholder="Escreva sua mensagem..."
            required
          />
          <div className="flex gap-3">
            <button type="submit" disabled={posting || !content.trim()}
              className="flex items-center gap-2 px-5 py-2 bg-cyan-500 text-gray-950 font-semibold rounded-xl hover:bg-cyan-400 transition-colors disabled:opacity-50 text-sm">
              <Send className="w-4 h-4" /> {posting ? 'Publicando...' : 'Publicar'}
            </button>
            <button type="button" onClick={() => setComposing(false)} className="px-5 py-2 text-gray-400 hover:text-white transition-colors text-sm">
              Cancelar
            </button>
          </div>
        </motion.form>
      )}

      {/* Posts */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-cyan-500" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <MessageSquare className="w-14 h-14 mx-auto mb-4 opacity-20" />
          <p>Ainda não há publicações neste espaço. Seja o primeiro!</p>
        </div>
      ) : (
        posts.map((post, i) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className={`p-4 sm:p-5 bg-gray-900 rounded-2xl border transition-all ${post.is_pinned ? 'border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.08)]' : 'border-gray-800'}`}
          >
            {/* Author row */}
            <div className="flex items-center gap-3 mb-3">
              <Avatar
                name={post.author_name ?? (post.user_id === user.id ? user.name : 'Membro')}
                avatarUrl={post.user_id === user.id ? user.avatar_url : post.author_avatar_url}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {post.author_name ?? (post.user_id === user.id ? user.name : 'Membro da comunidade')}
                </p>
                <p className="text-xs text-gray-500">{formatDate(post.created_at)}</p>
              </div>
              {post.is_pinned && (
                <span className="flex items-center gap-1 text-xs text-cyan-400 flex-shrink-0">
                  <Pin className="w-3.5 h-3.5" /> Fixado
                </span>
              )}
            </div>

            {/* Body / inline edit */}
            {editingId === post.id ? (
              <div className="space-y-2 mb-3">
                <input
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm outline-none focus:border-cyan-500"
                  placeholder="Título (opcional)"
                />
                <textarea
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-cyan-500 min-h-[80px] resize-y"
                  required
                />
                <div className="flex gap-2">
                  <button onClick={handleSaveEdit} disabled={saving || !editContent.trim()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500 text-gray-950 text-xs font-bold rounded-lg hover:bg-cyan-400 transition-colors disabled:opacity-50">
                    <Check className="w-3.5 h-3.5" /> Salvar
                  </button>
                  <button onClick={() => setEditingId(null)}
                    className="px-3 py-1.5 bg-gray-700 text-gray-300 text-xs rounded-lg hover:bg-gray-600 transition-colors">
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <>
                {post.title && <h3 className="font-semibold text-white mb-1">{post.title}</h3>}
                <p className="text-sm text-gray-300 whitespace-pre-wrap">{post.content}</p>
              </>
            )}

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

              <div className="ml-auto flex items-center gap-1">
                {/* Fixar — somente admin/moderador */}
                {canModerate && (
                  <button
                    onClick={() => togglePin(post.id, post.is_pinned)}
                    title={post.is_pinned ? 'Desafixar' : 'Fixar publicação'}
                    className={`p-1.5 rounded-lg transition-colors ${post.is_pinned ? 'text-cyan-400 bg-cyan-500/10' : 'text-gray-600 hover:text-cyan-400 hover:bg-cyan-500/10'}`}
                  >
                    <Pin className="w-3.5 h-3.5" />
                  </button>
                )}
                {(role === 'admin' || post.user_id === user.id) && editingId !== post.id && (
                  <button
                    onClick={() => startEdit(post)}
                    title="Editar"
                    className="p-1.5 text-gray-600 hover:text-cyan-400 hover:bg-cyan-400/10 rounded-lg transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}
                {(role === 'admin' || post.user_id === user.id) && (
                  <button
                    onClick={() => handleDelete(post.id)}
                    title="Excluir"
                    className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ))
      )}
    </div>
  );
}

// ─── Página da comunidade (espaços + feed) ────────────────────────────────────
export function CommunityPage({ user, role, onNavigate }: CommunityPageProps) {
  const { channels, loading, addChannel, deleteChannel } = useChannels();
  const [activeId, setActiveId] = useState<string | null>(null);

  // Form de novo canal (admin)
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('💬');

  // Seleciona o primeiro canal automaticamente
  useEffect(() => {
    if (!activeId && channels.length > 0) setActiveId(channels[0].id);
  }, [channels, activeId]);

  const handleAddChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const created = await addChannel({
      name: name.trim().toLowerCase().replace(/\s+/g, '-'),
      description, icon, order_index: channels.length,
    });
    setName(''); setDescription(''); setIcon('💬'); setShowForm(false);
    if (created) setActiveId(created.id);
  };

  const handleDeleteChannel = async (id: string) => {
    if (!confirm('Excluir este espaço e todas as publicações dele?')) return;
    await deleteChannel(id);
    if (activeId === id) setActiveId(null);
  };

  const activeChannel = channels.find(c => c.id === activeId);

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Users className="w-7 h-7 text-cyan-400" /> Comunidade
          </h1>
          <p className="text-gray-400 mt-1 text-sm">Conecte-se, tire dúvidas e compartilhe experiências</p>
        </div>
        {(role === 'admin' || role === 'moderator') && (
          <button
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-gray-950 rounded-xl font-medium hover:bg-cyan-400 transition-colors flex-shrink-0"
          >
            <Plus className="w-4 h-4" /> Novo Espaço
          </button>
        )}
      </div>

      {/* Form novo canal */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            onSubmit={handleAddChannel}
            className="mb-6 p-5 bg-gray-900 border border-cyan-500/20 rounded-2xl space-y-3"
          >
            <h3 className="font-medium text-white">Criar espaço</h3>
            <div className="flex gap-3">
              <input value={icon} onChange={e => setIcon(e.target.value)} maxLength={2}
                className="w-16 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-center text-xl outline-none focus:border-cyan-500" placeholder="💬" />
              <input value={name} onChange={e => setName(e.target.value)} required
                className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-white outline-none focus:border-cyan-500" placeholder="nome-do-espaço" />
            </div>
            <input value={description} onChange={e => setDescription(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-white outline-none focus:border-cyan-500" placeholder="Descrição (opcional)" />
            <div className="flex gap-3">
              <button type="submit" className="px-5 py-2 bg-cyan-500 text-gray-950 font-medium rounded-xl hover:bg-cyan-400 transition-colors">Criar</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2 text-gray-400 hover:text-white transition-colors">Cancelar</button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-cyan-500" />
        </div>
      ) : channels.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <Users className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p className="text-lg">Nenhum espaço criado ainda.</p>
          {(role === 'admin' || role === 'moderator') && <p className="text-sm mt-2">Clique em "Novo Espaço" para começar.</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-5">
          {/* Sidebar de espaços */}
          <aside className="md:sticky md:top-6 self-start">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2 px-1">Espaços</p>
            <div className="flex md:flex-col gap-1.5 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
              {channels.map(channel => {
                const active = channel.id === activeId;
                return (
                  <div key={channel.id} className="group relative flex-shrink-0">
                    <button
                      onClick={() => setActiveId(channel.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-colors text-left ${active ? 'bg-cyan-500/12 border border-cyan-500/30' : 'border border-transparent hover:bg-gray-800/60'}`}
                    >
                      <span className="text-lg flex-shrink-0">{channel.icon || '💬'}</span>
                      <span className={`text-sm truncate ${active ? 'text-white font-medium' : 'text-gray-400'}`}>{channel.name}</span>
                    </button>
                    {role === 'admin' && (
                      <button
                        onClick={() => handleDeleteChannel(channel.id)}
                        title="Excluir espaço"
                        className="hidden md:block absolute top-1/2 -translate-y-1/2 right-2 p-1 text-gray-600 hover:text-red-400 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </aside>

          {/* Feed do espaço ativo */}
          <main>
            {activeChannel && (
              <div className="flex items-center gap-2 mb-4">
                <Hash className="w-4 h-4 text-gray-500" />
                <h2 className="text-lg font-semibold text-white">{activeChannel.name}</h2>
                {activeChannel.description && (
                  <span className="text-sm text-gray-500 truncate">· {activeChannel.description}</span>
                )}
              </div>
            )}
            {activeId && (
              <ChannelFeed
                key={activeId}
                channelId={activeId}
                user={user}
                role={role}
                onNavigate={onNavigate}
              />
            )}
          </main>
        </div>
      )}
    </div>
  );
}
