import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, Image, Pressable, RefreshControl, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, TopBar, Segmented, Press, Empty, Input, Btn, SelectModal } from '../components/ui';
import { supabase } from '../lib/supabase';
import { getBlockedIds, notify, openConversation, sendMessage } from '../lib/api';
import { COUNTRIES, countryName, flag } from '../lib/countries';
import { useApp } from '../lib/AppContext';
import { C } from '../lib/theme';

export default function Home({ navigation }) {
  const { profile } = useApp();
  const [tab, setTab] = useState('for');
  const [people, setPeople] = useState([]);
  const [following, setFollowing] = useState(new Set());
  const [txt, setTxt] = useState('');
  const [q, setQ] = useState('');
  const [country, setCountry] = useState(null);
  const [pickC, setPickC] = useState(false);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const blocked = await getBlockedIds(profile.id);
    let qy = supabase.from('profiles').select('id,username,avatar_url,country,languages,age')
      .neq('id', profile.id).eq('status', 'active').eq('onboarded', true).in('photo_flag', ['ok', 'pending']).limit(40);
    if (tab === 'find') {
      if (q) qy = qy.ilike('username', `%${q}%`);
      if (country) qy = qy.eq('country', country);
    }
    const { data } = await qy.order('last_seen', { ascending: false });
    let list = (data || []).filter((p) => !blocked.has(p.id));
    if (tab === 'for') list = list.sort(() => Math.random() - 0.5).slice(0, 12);
    setPeople(list);
    const { data: f } = await supabase.from('follows').select('following_id').eq('follower_id', profile.id);
    setFollowing(new Set((f || []).map((x) => x.following_id)));
    const { count } = await supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', profile.id).eq('is_read', false);
    setUnread(count || 0);
    setLoading(false);
  }, [tab, q, country, profile.id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const toggleFollow = async (p) => {
    const next = new Set(following);
    if (following.has(p.id)) {
      next.delete(p.id); setFollowing(next);
      await supabase.from('follows').delete().eq('follower_id', profile.id).eq('following_id', p.id);
    } else {
      next.add(p.id); setFollowing(next);
      await supabase.from('follows').insert({ follower_id: profile.id, following_id: p.id });
      notify(p.id, profile.id, 'follow');
    }
  };

  const wave = async (p) => {
    try {
      const { conv, created } = await openConversation(profile.id, p.id);
      if (created) await sendMessage(conv.id, profile.id, { body: '👋' });
      navigation.navigate('Chat', { conv, other: p });
    } catch (e) { Alert.alert('Could not say hello', e.message); }
  };

  const Card = ({ item }) => (
    <Pressable onPress={() => navigation.navigate('UserProfile', { id: item.id })} style={{ flex: 1, margin: 6, height: 250, borderRadius: 26, overflow: 'hidden', backgroundColor: C.card }}>
      {item.avatar_url ? <Image source={{ uri: item.avatar_url }} style={{ position: 'absolute', width: '100%', height: '100%' }} /> : null}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 120, backgroundColor: '#0A111CCC' }} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 10 }}>
        <Press onPress={() => toggleFollow(item)} style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: '#0A111CCC', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={following.has(item.id) ? 'checkmark' : 'add'} size={24} color={C.accent} />
        </Press>
        <Press onPress={() => wave(item)} style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: '#0A111CCC', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 22 }}>👋</Text>
        </Press>
      </View>
      <View style={{ position: 'absolute', bottom: 12, left: 14, right: 10 }}>
        <Text style={{ color: C.text, fontSize: 18, fontWeight: '700' }} numberOfLines={1}>{item.username}</Text>
        <Text style={{ color: C.sub, marginTop: 2 }} numberOfLines={1}>{flag(item.country)} {countryName(item.country)}</Text>
        <Text style={{ color: C.sub }} numberOfLines={1}>{(item.languages || []).join(' · ')}</Text>
      </View>
    </Pressable>
  );

  return (
    <Screen>
      <TopBar title="Z Friends" big right={
        <Pressable onPress={() => navigation.navigate('Notifications')} hitSlop={10}>
          <Ionicons name="notifications-outline" size={28} color={C.text} />
          {unread > 0 ? <View style={{ position: 'absolute', right: 0, top: 0, width: 10, height: 10, borderRadius: 5, backgroundColor: C.danger }} /> : null}
        </Pressable>} />
      <Segmented items={[['for', 'For you'], ['find', 'Find friends']]} value={tab} onChange={setTab} />
      {tab === 'find' ? (
        <View style={{ paddingHorizontal: 20, marginTop: 14, flexDirection: 'row' }}>
          <Input placeholder="Search by username" value={txt} onChangeText={setTxt} onSubmitEditing={() => setQ(txt.trim())} returnKeyType="search" style={{ flex: 1 }} />
          <Press onPress={() => setPickC(true)} style={{ marginLeft: 8, paddingHorizontal: 14, height: 50, borderRadius: 16, backgroundColor: C.card, justifyContent: 'center' }}>
            <Text style={{ color: C.accent, fontWeight: '700' }}>{country ? flag(country) : 'Country'}</Text>
          </Press>
        </View>
      ) : null}
      <FlatList data={people} keyExtractor={(p) => p.id} numColumns={2} renderItem={Card}
        contentContainerStyle={{ padding: 14, paddingBottom: 30 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={C.accent} />}
        ListHeaderComponent={tab === 'for' ? <View style={{ paddingHorizontal: 6, paddingVertical: 10 }}><Text style={{ color: C.text, fontSize: 20, fontWeight: '700' }}>Recommended for you</Text><Text style={{ color: C.sub, marginTop: 4 }}>Say hello. Start a new story.</Text></View> : null}
        ListEmptyComponent={loading ? null : <Empty text={tab === 'find' ? 'No one matches your search yet.' : 'No recommendations right now. Pull down to refresh.'} />} />
      <SelectModal visible={pickC} title="Filter by country" options={[{ value: '', label: 'All countries' }, ...COUNTRIES.map(([v, l]) => ({ value: v, label: `${flag(v)}  ${l}` }))]}
        selected={country || ''} onClose={() => setPickC(false)} onChange={(v) => setCountry(v || null)} />
    </Screen>
  );
}
