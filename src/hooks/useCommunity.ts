import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { CommunityChannel, CommunityPost, CommunityComment } from '../types';

// ─── Channels ────────────────────────────────────────────────────────────────

export function useChannels() {
  const [channels, setChannels] = useState<CommunityChannel[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChannels = async () => {
    const { data } = await supabase
      .from('community_channels')
      .select('*')
      .order('order_index');
    if (data) setChannels(data);
    setLoading(false);
  };

  useEffect(() => { fetchChannels(); }, []);

  const addChannel = async (channel: Omit<CommunityChannel, 'id' | 'post_count'>) => {
    const { data } = await supabase.from('community_channels').insert([channel]).select().single();
    if (data) setChannels(prev => [...prev, data]);
    return data;
  };

  const deleteChannel = async (id: string) => {
    await supabase.from('community_channels').delete().eq('id', id);
    setChannels(prev => prev.filter(c => c.id !== id));
  };

  return { channels, loading, addChannel, deleteChannel, refetch: fetchChannels };
}

// ─── Posts ───────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function enrichPost(post: any, userId: string): Promise<CommunityPost> {
  const [reactRes, commentRes, myReactRes, profileRes] = await Promise.all([
    supabase.from('community_reactions').select('*', { count: 'exact', head: true }).eq('post_id', post.id),
    supabase.from('community_comments').select('*', { count: 'exact', head: true }).eq('post_id', post.id),
    supabase.from('community_reactions').select('post_id').eq('post_id', post.id).eq('user_id', userId).maybeSingle(),
    supabase.from('user_profiles').select('name, avatar_url').eq('user_id', post.user_id).maybeSingle(),
  ]);
  return {
    ...post,
    reaction_count: reactRes.count ?? 0,
    comment_count: commentRes.count ?? 0,
    user_reacted: !!myReactRes.data,
    author_name: profileRes.data?.name ?? undefined,
    author_avatar_url: profileRes.data?.avatar_url ?? undefined,
  };
}

export function usePosts(channelId: string, userId: string) {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    const { data } = await supabase
      .from('community_posts')
      .select('*')
      .eq('channel_id', channelId)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (!data) { setLoading(false); return; }
    const enriched = await Promise.all(data.map(p => enrichPost(p, userId)));
    setPosts(enriched);
    setLoading(false);
  }, [channelId, userId]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  useEffect(() => {
    const ch = supabase
      .channel(`posts:${channelId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'community_posts',
        filter: `channel_id=eq.${channelId}`,
      }, () => fetchPosts())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [channelId, fetchPosts]);

  const createPost = async (title: string, content: string, uid: string) => {
    const { data } = await supabase
      .from('community_posts')
      .insert([{ channel_id: channelId, user_id: uid, title, content }])
      .select().single();
    if (data) fetchPosts();
    return data;
  };

  const updatePost = async (postId: string, title: string, content: string) => {
    const { error } = await supabase
      .from('community_posts')
      .update({ title, content, updated_at: new Date().toISOString() })
      .eq('id', postId);
    if (!error) setPosts(prev => prev.map(p => p.id === postId ? { ...p, title, content } : p));
    return error;
  };

  const deletePost = async (postId: string) => {
    await supabase.from('community_posts').delete().eq('id', postId);
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  const togglePin = async (postId: string, currentPin: boolean) => {
    await supabase.from('community_posts').update({ is_pinned: !currentPin }).eq('id', postId);
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, is_pinned: !currentPin } : p));
  };

  const toggleReaction = async (postId: string, uid: string, hasReacted: boolean) => {
    if (hasReacted) {
      await supabase.from('community_reactions').delete().eq('post_id', postId).eq('user_id', uid);
    } else {
      await supabase.from('community_reactions').insert([{ post_id: postId, user_id: uid }]);
    }
    setPosts(prev => prev.map(p =>
      p.id === postId
        ? { ...p, user_reacted: !hasReacted, reaction_count: (p.reaction_count ?? 0) + (hasReacted ? -1 : 1) }
        : p,
    ));
  };

  return { posts, loading, createPost, updatePost, deletePost, togglePin, toggleReaction, refetch: fetchPosts };
}

// ─── Post detail ─────────────────────────────────────────────────────────────

export function usePost(postId: string, userId: string) {
  const [post, setPost] = useState<CommunityPost | null>(null);
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPost = useCallback(async () => {
    const [postRes, commentsRes, reactRes, myReactRes] = await Promise.all([
      supabase.from('community_posts').select('*').eq('id', postId).single(),
      supabase.from('community_comments').select('*').eq('post_id', postId).order('created_at'),
      supabase.from('community_reactions').select('*', { count: 'exact', head: true }).eq('post_id', postId),
      supabase.from('community_reactions').select('post_id').eq('post_id', postId).eq('user_id', userId).maybeSingle(),
    ]);

    if (postRes.data) {
      const profileRes = await supabase
        .from('user_profiles').select('name, avatar_url').eq('user_id', postRes.data.user_id).maybeSingle();
      setPost({
        ...postRes.data,
        reaction_count: reactRes.count ?? 0,
        comment_count: commentsRes.data?.length ?? 0,
        user_reacted: !!myReactRes.data,
        author_name: profileRes.data?.name ?? undefined,
        author_avatar_url: profileRes.data?.avatar_url ?? undefined,
      });
    }

    if (commentsRes.data) {
      const enrichedComments = await Promise.all(
        commentsRes.data.map(async (c) => {
          const pr = await supabase.from('user_profiles').select('name, avatar_url').eq('user_id', c.user_id).maybeSingle();
          return { ...c, author_name: pr.data?.name ?? undefined, author_avatar_url: pr.data?.avatar_url ?? undefined };
        }),
      );
      setComments(enrichedComments);
    }

    setLoading(false);
  }, [postId, userId]);

  useEffect(() => { fetchPost(); }, [fetchPost]);

  const addComment = async (content: string, uid: string) => {
    const { data } = await supabase
      .from('community_comments')
      .insert([{ post_id: postId, user_id: uid, content }])
      .select().single();
    if (data) fetchPost();
    return data;
  };

  const updateComment = async (commentId: string, content: string) => {
    const { error } = await supabase.from('community_comments').update({ content }).eq('id', commentId);
    if (!error) setComments(prev => prev.map(c => c.id === commentId ? { ...c, content } : c));
    return error;
  };

  const deleteComment = async (commentId: string) => {
    await supabase.from('community_comments').delete().eq('id', commentId);
    setComments(prev => prev.filter(c => c.id !== commentId));
  };

  const toggleReaction = async (hasReacted: boolean) => {
    if (hasReacted) {
      await supabase.from('community_reactions').delete().eq('post_id', postId).eq('user_id', userId);
    } else {
      await supabase.from('community_reactions').insert([{ post_id: postId, user_id: userId }]);
    }
    setPost(prev => prev ? {
      ...prev, user_reacted: !hasReacted,
      reaction_count: (prev.reaction_count ?? 0) + (hasReacted ? -1 : 1),
    } : prev);
  };

  return { post, comments, loading, addComment, updateComment, deleteComment, toggleReaction };
}
