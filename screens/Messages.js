import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, TopBar, Avatar, Empty, Btn } from '../components/ui';
import { supabase } from '../lib/supabase';
import { timeAgo } from '../lib/api';
import { useApp } from '../lib/AppContext';
import { C } from '../lib/theme';

async function loadConvs(me) {
  const { data } = await supabase.from('conversations').select('*').or(`user_a.eq.${me},user_b.eq.${me}`).neq('status', 'declined').order('last_message_at', { ascending: false });
  const list = data || [];
  const otherIds = list.map((c) => (c.user_a === me ? c.user_b : c.user_a));
  const { data: ps } = otherIds.length ? await supabase.from('profiles').select('id,username,avatar_url,country').in('id', otherIds) : { data: [] };
  const map = Object.fromEntries((ps || []).map((p) => [p.id, p]));
  return list.map((c) => ({ ...c, other: map[c.user_a === me ? c.user_b : c.user_a] })).filter((c) => c.other);
}

export function Messages({ navigation }) {
  const { profile } = useApp();
  const [convs, setConvs] = useState([]);
  useFocusEffect(useCallback(() => { loadConvs(profile.id).then(setConvs); }, [profile.id]));
  const incoming = convs.filter((c) => c.status === 'request' && c.initiator_id !== profile.id);
  const open = convs.filter((c) => !(c.status === 'request' && c.initiator_id !== profile.id));
  return (
    <Screen>
      <TopBar title="Chatting" big />
      <Pressable onPress={() => navigation.navigate('Requests')} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14 }}>
        <View><Ionicons name="chatbox-outline" size={30} color={C.text} />{incoming.length > 0 ? <View style={{ position: 'absolute', right: -2, top: -2, width: 12, height: 12, borderRadius: 6, backgroundColor: C.danger }} /> : null}</View>
        <Text style={{ color: C.text, fontSize: 18, fontWeight: '700', flex: 1, marginLeft: 18 }}>Conversation requests{incoming.length ? ` (${incoming.length})` : ''}</Text>
        <Ionicons name="chevron-forward" size={22} color={C.text} />
      </Pressable>
      <Text style={{ color: C.sub, paddingHorizontal: 20, paddingVertical: 10 }}>Open chats: <Text style={{ color: C.accent }}>{open.length}</Text></Text>
      <FlatList data={open} keyExtractor={(c) => c.id}
        ListEmptyComponent={<Empty text="No chats yet. Send a wave from Home to start one." />}
        renderItem={({ item }) => (
          <Pressable onPress={() => navigation.navigate('Chat', { conv: item, other: item.other })} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14 }}>
            <Avatar uri={item.other.avatar_url} name={item.other.username} country={item.other.country} size={64} />
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text style={{ color: C.text, fontSize: 18, fontWeight: '700' }}>{item.other.username}</Text>
              <Text style={{ color: C.sub, marginTop: 4 }} numberOfLines={1}>{item.last_message || (item.status === 'request' ? 'Request sent' : 'Say hello')}</Text>
            </View>
            <Text style={{ color: C.sub, fontSize: 12 }}>{timeAgo(item.last_message_at)}</Text>
          </Pressable>
        )} />
    </Screen>
  );
}

export function Requests({ navigation }) {
  const { profile } = useApp();
  const [list, setList] = useState([]);
  const load = useCallback(() => loadConvs(profile.id).then((l) => setList(l.filter((c) => c.status === 'request' && c.initiator_id !== profile.id))), [profile.id]);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  const answer = async (c, status) => {
    await supabase.from('conversations').update({ status }).eq('id', c.id);
    if (status === 'open') navigation.replace('Chat', { conv: { ...c, status }, other: c.other });
    else load();
  };
  return (
    <Screen>
      <TopBar title="Conversation requests" onBack={() => navigation.goBack()} />
      <FlatList data={list} keyExtractor={(c) => c.id} ListEmptyComponent={<Empty text="No pending requests." />}
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: 20, paddingVertical: 14 }}>
            <Pressable onPress={() => navigation.navigate('UserProfile', { id: item.other.id })} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Avatar uri={item.other.avatar_url} name={item.other.username} country={item.other.country} size={58} />
              <View style={{ marginLeft: 14, flex: 1 }}>
                <Text style={{ color: C.text, fontSize: 17, fontWeight: '700' }}>{item.other.username}</Text>
                <Text style={{ color: C.sub }} numberOfLines={1}>{item.last_message}</Text>
              </View>
            </Pressable>
            <View style={{ flexDirection: 'row', marginTop: 12 }}>
              <Btn title="Accept" onPress={() => answer(item, 'open')} style={{ flex: 1, paddingVertical: 12, marginRight: 8 }} />
              <Btn title="Decline" soft onPress={() => answer(item, 'declined')} style={{ flex: 1, paddingVertical: 12 }} />
            </View>
          </View>
        )} />
    </Screen>
  );
}
