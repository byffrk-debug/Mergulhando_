import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { UserRole } from '../types';

export function useUserRole(userId: string | undefined, email: string | undefined): UserRole {
  const [role, setRole] = useState<UserRole>('student');

  useEffect(() => {
    if (!userId) { setRole('student'); return; }
    if (email === 'byffrk@gmail.com') { setRole('admin'); return; }

    supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.role === 'admin' || data?.role === 'moderator') {
          setRole(data.role);
        } else {
          setRole('student');
        }
      });
  }, [userId, email]);

  return role;
}
