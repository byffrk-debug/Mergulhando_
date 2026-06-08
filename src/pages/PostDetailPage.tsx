import React, { useState } from 'react';
import { Heart, ChevronLeft, Trash2, Pin, Send } from 'lucide-react';
import { motion } from 'motion/react';
import { usePost } from '../hooks/useCommunity';
import type { AppView, User, UserRole } from '../types';

interface PostDetailPageProps {
  postId: string;
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

function Avatar({ name }: { name: string }) {
  return (
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
      {getInitials(name)}
    </div>
  );
}

export function PostDetailPage({ postId, channelId, user, role, onNavigate }: PostDetailPageProps) {
  const { post, comments, loading, addComment, deleteComment, toggleReaction } = usePost(postId, user.id);
  const [commentText, setCommentText] = useState('');

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    await addComment(commentText, user.id);
    setCommentText('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-cyan-500" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="p-6 text-center text-gray-500">
        <p>Post não encontrado.</p>
        <button onClick={() => onNavigate({ name: 'canal', channelId })} className="mt-4 text-cyan-400 hover:underline">Voltar</button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Back */}
      <button
        onClick={() => onNavigate({ name: 'canal', channelId })}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-6"
      >
        <ChevronLeft className="w-4 h-4" /> Voltar ao canal
      </button>

      {/* Post */}
      <div className="p-6 bg-gray-900 border border-gray-800 rounded-2xl mb-6">
        {post.is_pinned && (
          <div className="flex items-center gap-1 text-xs text-cyan-400 mb-3">
            <Pin className="w-3 h-3" /> Fixado
          </div>
        )}
        <div className="flex items-center gap-3 mb-4">
          <Avatar name={post.user_id === user.id ? user.name : 'Membro'} />
          <div>
            <p className="text-sm font-medium text-white">{post.user_id === user.id ? user.name : 'Membro da comunidade'}</p>
            <p className="text-xs text-gray-500">{formatDate(post.created_at)}</p>
          </div>
        </div>
        {post.title && <h2 className="text-xl font-bold text-white mb-3">{post.title}</h2>}
        <p className="text-gray-300 whitespace-pre-wrap">{post.content}</p>

        <div className="flex items-center gap-4 mt-5 pt-4 border-t border-gray-800">
          <button
            onClick={() => toggleReaction(post.user_reacted ?? false)}
            className={`flex items-center gap-1.5 text-sm transition-colors ${post.user_reacted ? 'text-pink-400' : 'text-gray-500 hover:text-pink-400'}`}
          >
            <Heart className={`w-4 h-4 ${post.user_reacted ? 'fill-current' : ''}`} />
            {post.reaction_count ?? 0} curtida{(post.reaction_count ?? 0) !== 1 ? 's' : ''}
          </button>
          <span className="text-sm text-gray-500">{comments.length} comentário{comments.length !== 1 ? 's' : ''}</span>
          {(role === 'admin' || role === 'moderator' || post.user_id === user.id) && (
            <button
              onClick={() => { /* delete post and go back */ onNavigate({ name: 'canal', channelId }); }}
              className="ml-auto text-gray-600 hover:text-red-400 hover:bg-red-400/10 p-1.5 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Comments */}
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
        Comentários ({comments.length})
      </h3>

      <div className="space-y-3 mb-6">
        {comments.map((comment, i) => (
          <motion.div
            key={comment.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="flex gap-3 group"
          >
            <Avatar name={comment.user_id === user.id ? user.name : 'Membro'} />
            <div className="flex-1 min-w-0 p-4 bg-gray-900 border border-gray-800 rounded-xl">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium text-white">{comment.user_id === user.id ? user.name : 'Membro'}</p>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-gray-500">{formatDate(comment.created_at)}</p>
                  {(role === 'admin' || role === 'moderator' || comment.user_id === user.id) && (
                    <button
                      onClick={() => deleteComment(comment.id)}
                      className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all p-1 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-300 whitespace-pre-wrap">{comment.content}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Comment form */}
      <form onSubmit={handleComment} className="flex gap-3">
        <Avatar name={user.name} />
        <div className="flex-1 flex gap-2">
          <input
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-500 transition-colors"
            placeholder="Escreva um comentário..."
          />
          <button
            type="submit"
            disabled={!commentText.trim()}
            className="px-4 py-2.5 bg-cyan-500 text-gray-950 rounded-xl hover:bg-cyan-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
