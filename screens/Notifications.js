import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Screen, TopBar, Avatar, Empty, Segmented } from '../components/ui';
import { supabase } from '../lib/supabase';
import { timeAgo } from '../lib/api';
import { useApp } from '../lib/AppContext';
import { C } from '../lib/theme';

const TEXT = { follow: 'started following you.', like: 'liked your story.', comment: 'commented on your story.', visit: 'visited your profile.', message_request: 'sent you a conversation request.' };
const FILTER = { all: null, follow: ['follow'], social: ['like', 'comment'], visit: ['visit'] };

export default function Notifications({ navigation }) {
  const { profile } = useApp();
  const [tab, setTab] = useState('all');
  const [list, setList] = useState([]);
  const load = useCallback(async () => {
    const { data } = await supabase.from('notifications').select('*, actor:profiles!notifications_actor_id_fkey(username,avatar_url,country)').eq('user_id', profile.id).order('created_at', { ascending: false }).limit(100);
    setList(data || []);
  }, [profile.id]);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  const markAll = async () => { await supabase.from('notifications').update({ is_read: true }).eq('user_id', profile.id).eq('is_read', false); load(); };
  const shown = list.filter((n) => !FILTER[tab] || FILTER[tab].includes(n.type));
  return (
    <Screen>
      <TopBar title="Alarm" onBack={() => navigation.goBack()} right={<Pressable onPress={markAll}><Text style={{ color: C.accent, fontWeight: '600' }}>Mark all read</Text></Pressable>} />
      <Segmented items={[['all', 'All'], ['follow', 'Follow'], ['social', 'Like'], ['visit', 'Visits']]} value={tab} onChange={setTab} />
      <FlatList style={{ marginTop: 10 }} data={shown} keyExtractor={(n) => n.id} ListEmptyComponent={<Empty text="Nothing here yet." />}
        renderItem={({ item }) => (
          <Pressable onPress={() => navigation.navigate('UserProfile', { id: item.actor_id })}
            style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginVertical: 6, padding: 14, borderRadius: 20, backgroundColor: item.is_read ? 'transparent' : C.card }}>
            <Avatar uri={item.actor?.avatar_url} name={item.actor?.username} country={item.actor?.country} size={56} />
            <View style={{ marginLeft: 14, flex: 1 }}>
              <Text style={{ color: C.text, fontSize: 16 }}><Text style={{ fontWeight: '700' }}>{item.actor?.username}</Text> {TEXT[item.type]}</Text>
              <Text style={{ color: C.sub, marginTop: 4 }}>{timeAgo(item.created_at)}</Text>
            </View>
          </Pressable>
        )} />
    </Screen>
  );
}
