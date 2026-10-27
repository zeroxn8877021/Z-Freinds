import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, Alert, ScrollView } from 'react-native';
import { Screen, TopBar, Segmented, Avatar, Btn, Input, Empty } from '../components/ui';
import { supabase } from '../lib/supabase';
import { timeAgo } from '../lib/api';
import { useApp } from '../lib/AppContext';
import { C } from '../lib/theme';

const cnt = (q) => q.then(({ count }) => count || 0);

function Stats() {
  const [s, setS] = useState(null);
  useEffect(() => {
    (async () => {
      const h = { count: 'exact', head: true };
      const [users, premium, blocked, stories, reports, flagged] = await Promise.all([
        cnt(supabase.from('profiles').select('id', h)),
        cnt(supabase.from('profiles').select('id', h).eq('is_premium', true)),
        cnt(supabase.from('profiles').select('id', h).neq('status', 'active')),
        cnt(supabase.from('stories').select('id', h).gt('expires_at', new Date().toISOString())),
        cnt(supabase.from('reports').select('id', h).eq('status', 'open')),
        cnt(supabase.from('profiles').select('id', h).in('photo_flag', ['anime_cartoon', 'fake_suspected'])),
      ]);
      setS({ users, premium, blocked, stories, reports, flagged });
    })();
  }, []);
  if (!s) return null;
  const items = [['Users', s.users], ['Premium', s.premium], ['Blocked / suspended', s.blocked], ['Live stories', s.stories], ['Open reports', s.reports], ['Flagged photos', s.flagged]];
  return (
    <ScrollView contentContainerStyle={{ padding: 20, flexDirection: 'row', flexWrap: 'wrap' }}>
      {items.map(([l, n]) => (
        <View key={l} style={{ width: '50%', padding: 6 }}><View style={{ backgroundColor: C.card, borderRadius: 20, padding: 18 }}>
          <Text style={{ color: C.text, fontSize: 28, fontWeight: '800' }}>{n}</Text><Text style={{ color: C.sub, marginTop: 4 }}>{l}</Text>
        </View></View>
      ))}
    </ScrollView>
  );
}

function Users() {
  const { profile: me } = useApp();
  const [q, setQ] = useState(''); const [list, setList] = useState([]);
  const load = useCallback(async () => {
    let qy = supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(50);
    if (q.trim()) qy = qy.ilike('username', `%${q.trim()}%`);
    const { data } = await qy; setList(data || []);
  }, [q]);
  useEffect(() => { load(); }, [load]);
  const setStatus = async (u, status) => { await supabase.from('profiles').update({ status, blocked_reason: status === 'active' ? null : 'Blocked by admin' }).eq('id', u.id); load(); };
  const premium = async (u, on) => {
    const until = on ? new Date(Date.now() + 30 * 86400000).toISOString() : null;
    await supabase.from('profiles').update({ is_premium: on, premium_until: until }).eq('id', u.id);
    if (on) await supabase.from('subscriptions').insert({ user_id: u.id, plan: 'premium_30d', status: 'active', ends_at: until, created_by: me.id });
    else await supabase.from('subscriptions').update({ status: 'cancelled' }).eq('user_id', u.id).eq('status', 'active');
    load();
  };
  return (
    <View style={{ flex: 1 }}>
      <View style={{ padding: 20, paddingBottom: 8 }}><Input placeholder="Search username" value={q} onChangeText={setQ} autoCapitalize="none" /></View>
      <FlatList data={list} keyExtractor={(u) => u.id} ListEmptyComponent={<Empty text="No users found." />}
        renderItem={({ item: u }) => (
          <View style={{ paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.line }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Avatar uri={u.avatar_url} name={u.username} country={u.country} size={48} />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={{ color: C.text, fontWeight: '700', fontSize: 16 }}>{u.username}{u.role === 'admin' ? '  (admin)' : ''}</Text>
                <Text style={{ color: u.status === 'active' ? C.ok : C.danger }}>{u.status}{u.is_premium ? '  ·  premium' : ''}{u.photo_flag && u.photo_flag !== 'ok' && u.photo_flag !== 'pending' ? `  ·  ${u.photo_flag}` : ''}</Text>
              </View>
            </View>
            {u.id !== me.id ? (
              <View style={{ flexDirection: 'row', marginTop: 10 }}>
                <Btn soft={u.status === 'active'} danger={u.status === 'active'} title={u.status === 'active' ? 'Block' : 'Unblock'} onPress={() => setStatus(u, u.status === 'active' ? 'blocked' : 'active')} style={{ flex: 1, paddingVertical: 10, marginRight: 8 }} />
                <Btn soft title={u.is_premium ? 'Remove premium' : 'Give premium 30d'} onPress={() => premium(u, !u.is_premium)} style={{ flex: 1, paddingVertical: 10 }} />
              </View>
            ) : null}
          </View>
        )} />
    </View>
  );
}

function Reports() {
  const [list, setList] = useState([]);
  const load = async () => {
    const { data } = await supabase.from('reports').select('*, target:profiles!reports_target_user_id_fkey(id,username,status)').eq('status', 'open').order('created_at', { ascending: false }).limit(50);
    setList(data || []);
  };
  useEffect(() => { load(); }, []);
  const resolve = async (r, status, block) => {
    if (block && r.target) await supabase.from('profiles').update({ status: 'blocked', blocked_reason: 'Blocked after report review' }).eq('id', r.target.id);
    await supabase.from('reports').update({ status }).eq('id', r.id); load();
  };
  return (
    <FlatList data={list} keyExtractor={(r) => r.id} ListEmptyComponent={<Empty text="No open reports." />}
      renderItem={({ item: r }) => (
        <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: C.line }}>
          <Text style={{ color: C.text, fontWeight: '700' }}>{r.target?.username || 'Unknown user'}</Text>
          <Text style={{ color: C.sub, marginTop: 4 }}>{r.reason} · {timeAgo(r.created_at)}</Text>
          <View style={{ flexDirection: 'row', marginTop: 10 }}>
            <Btn danger title="Block user" onPress={() => resolve(r, 'resolved', true)} style={{ flex: 1, paddingVertical: 10, marginRight: 8 }} />
            <Btn soft title="Dismiss" onPress={() => resolve(r, 'dismissed', false)} style={{ flex: 1, paddingVertical: 10 }} />
          </View>
        </View>
      )} />
  );
}

function Logs() {
  const [list, setList] = useState([]);
  useEffect(() => { supabase.from('moderation_logs').select('*, profiles(username)').order('created_at', { ascending: false }).limit(80).then(({ data }) => setList(data || [])); }, []);
  return (
    <FlatList data={list} keyExtractor={(l) => l.id} ListEmptyComponent={<Empty text="No moderation events yet." />}
      renderItem={({ item: l }) => (
        <View style={{ padding: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: C.line }}>
          <Text style={{ color: C.text, fontWeight: '700' }}>{l.profiles?.username || 'Deleted user'} · {l.kind}</Text>
          <Text style={{ color: C.sub, marginTop: 2 }}>{l.action}{l.detail ? ` · ${l.detail}` : ''} · {timeAgo(l.created_at)}</Text>
        </View>
      )} />
  );
}

export default function AdminPanel({ navigation }) {
  const { profile } = useApp();
  const [tab, setTab] = useState('stats');
  if (profile.role !== 'admin') return <Screen><TopBar title="Admin" onBack={() => navigation.goBack()} /><Empty text="Admins only." /></Screen>;
  return (
    <Screen>
      <TopBar title="Zerox admin" onBack={() => navigation.goBack()} />
      <Segmented items={[['stats', 'Stats'], ['users', 'Users'], ['reports', 'Reports'], ['logs', 'Logs']]} value={tab} onChange={setTab} />
      <View style={{ flex: 1, marginTop: 10 }}>
        {tab === 'stats' ? <Stats /> : tab === 'users' ? <Users /> : tab === 'reports' ? <Reports /> : <Logs />}
      </View>
    </Screen>
  );
}
