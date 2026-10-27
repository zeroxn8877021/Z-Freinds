import { supabase } from './supabase';

export async function checkText(text, ref) {
  if (!text || !text.trim()) return { allowed: true };
  const { data, error } = await supabase.functions.invoke('moderate-text', { body: { text, content_ref: ref || null } });
  if (error || !data) return { allowed: true }; // fail open on network errors
  return data;
}

export async function notify(userId, actorId, type, storyId = null) {
  if (userId === actorId) return;
  await supabase.from('notifications').insert({ user_id: userId, actor_id: actorId, type, story_id: storyId });
}

export async function getBlockedIds(me) {
  const { data } = await supabase.from('blocks').select('blocked_id').eq('blocker_id', me);
  return new Set((data || []).map((b) => b.blocked_id));
}

export async function openConversation(me, other) {
  const [a, b] = me < other ? [me, other] : [other, me];
  const { data: found } = await supabase.from('conversations').select('*').eq('user_a', a).eq('user_b', b).maybeSingle();
  if (found) return { conv: found, created: false };
  const { data, error } = await supabase.from('conversations')
    .insert({ user_a: a, user_b: b, initiator_id: me, status: 'request' }).select().single();
  if (error) throw error;
  await notify(other, me, 'message_request');
  return { conv: data, created: true };
}

export async function sendMessage(convId, me, fields) {
  const { error } = await supabase.from('messages').insert({ conversation_id: convId, sender_id: me, ...fields });
  if (error) throw error;
}

export const timeAgo = (iso) => {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return 'a moment ago';
  if (s < 3600) return `${Math.floor(s / 60)} minutes ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} hours ago`;
  return `${Math.floor(s / 86400)} days ago`;
};
