import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { CommunityChannel, CommunityPost, CommunityComment } from '../types';

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

    // Enrich with author names, reaction counts, comment counts
    const enriched = await Promise.all(
      data.map(async (post) => {
        const [userRes, reactRes, commentRes, myReactRes] = await Promise.all([
          supabase.auth.admin ? Promise.resolve(null) : Promise.resolve(null),
          supabase.from('community_reactions').select('*', { count: 'exact', head: true }).eq('post_id', post.id),
          supabase.from('community_comments').select('*', { count: 'exact', head: true }).eq('post_id', post.id),
          supabase.from('community_reactions').select('post_id').eq('post_id', post.id).eq('user_id', userId).maybeSingle(),
        ]);
        return {
          ...post,
          reaction_count: reactRes.count ?? 0,
          comment_count: commentRes.count ?? 0,
          user_reacted: !!myReactRes.data,
        };
      })
    );

    setPosts(enriched);
    setLoading(false);
  }, [channelId, userId]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`posts:${channelId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_posts', filter: `channel_id=eq.${channelId}` }, () => fetchPosts())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [channelId, fetchPosts]);

  const createPost = async (title: string, content: string, userId: string) => {
    const { data } = await supabase
      .from('community_posts')
      .insert([{ channel_id: channelId, user_id: userId, title, content }])
      .select()
      .single();
    if (data) fetchPosts();
    return data;
  };

  const deletePost = async (postId: string) => {
    await supabase.from('community_posts').delete().eq('id', postId);
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  const togglePin = async (postId: string, currentPin: boolean) => {
    await supabase.from('community_posts').update({ is_pinned: !currentPin }).eq('id', postId);
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, is_pinned: !currentPin } : p));
  };

  const toggleReaction = async (postId: string, userId: string, hasReacted: boolean) => {
    if (hasReacted) {
      await supabase.from('community_reactions').delete().eq('post_id', postId).eq('user_id', userId);
    } else {
      await supabase.from('community_reactions').insert([{ post_id: postId, user_id: userId }]);
    }
    setPosts(prev => prev.map(p =>
      p.id === postId
        ? { ...p, user_reacted: !hasReacted, reaction_count: (p.reaction_count ?? 0) + (hasReacted ? -1 : 1) }
        : p
    ));
  };

  return { posts, loading, createPost, deletePost, togglePin, toggleReaction, refetch: fetchPosts };
}

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
      setPost({
        ...postRes.data,
        reaction_count: reactRes.count ?? 0,
        comment_count: commentsRes.data?.length ?? 0,
        user_reacted: !!myReactRes.data,
      });
    }
    if (commentsRes.data) setComments(commentsRes.data);
    setLoading(false);
  }, [postId, userId]);

  useEffect(() => { fetchPost(); }, [fetchPost]);

  const addComment = async (content: string, userId: string) => {
    const { data } = await supabase
      .from('community_comments')
      .insert([{ post_id: postId, user_id: userId, content }])
      .select()
      .single();
    if (data) {
      setComments(prev => [...prev, data]);
      setPost(prev => prev ? { ...prev, comment_count: (prev.comment_count ?? 0) + 1 } : prev);
    }
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
      ...prev,
      user_reacted: !hasReacted,
      reaction_count: (prev.reaction_count ?? 0) + (hasReacted ? -1 : 1),
    } : prev);
  };

  return { post, comments, loading, addComment, deleteComment, toggleReaction };
}
