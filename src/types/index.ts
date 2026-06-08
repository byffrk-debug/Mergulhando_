export type User = {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
};

export type Video = {
  id: string;
  title: string;
  url: string;
  module: string;
  content?: string;
  thumbnail_url?: string;
  short_description?: string;
  order_in_module?: number;
  created_at?: string;
};

export type Track = {
  id: string;
  name: string;
  description?: string;
  thumbnail_url?: string;
  order_index: number;
};

export type TrackModule = {
  track_id: string;
  module_name: string;
  order_index: number;
};

export type CommunityChannel = {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  order_index: number;
  post_count?: number;
};

export type CommunityPost = {
  id: string;
  channel_id: string;
  user_id: string;
  title?: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  author_name?: string;
  reaction_count?: number;
  comment_count?: number;
  user_reacted?: boolean;
};

export type CommunityComment = {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  author_name?: string;
};

export type Announcement = {
  id: string;
  content: string;
  icon?: string;
  link_url?: string;
  link_label?: string;
  order_index: number;
  active: boolean;
};

export type UserRole = 'admin' | 'moderator' | 'student';

export type AppView =
  | { name: 'home' }
  | { name: 'trilha'; trackId: string }
  | { name: 'modulo'; moduleName: string }
  | { name: 'aula'; videoId: string }
  | { name: 'comunidade' }
  | { name: 'canal'; channelId: string }
  | { name: 'post'; postId: string; channelId: string }
  | { name: 'perfil' }
  | { name: 'admin' };
