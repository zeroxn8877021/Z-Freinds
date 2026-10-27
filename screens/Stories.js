import React, { useState, useCallback } from 'react';
import { FlatList, RefreshControl, Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, TopBar, Segmented, Empty } from '../components/ui';
import StoryCard from '../components/StoryCard';
import { supabase } from '../lib/supabase';
import { getBlockedIds } from '../lib/api';
import { useApp } from '../lib/AppContext';
import { C } from '../lib/theme';

export default function Stories({ navigation }) {
  const { profile } = useApp();
  const [tab, setTab] = useState('all');
  const [items, setItems] = useState([]);
  const [likedIds, setLikedIds] = useState(new Set());
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const blocked = await getBlockedIds(profile.id);
    let qy = supabase.from('stories').select('*, profiles(username,avatar_url,country)').gt('expires_at', new Date().toISOString()).eq('moderation_status', 'ok').order('created_at', { ascending: false }).limit(40);
    if (tab === 'follow') {
      const { data: f } = await supabase.from('follows').select('following_id').eq('follower_id', profile.id);
      const ids = (f || []).map((x) => x.following_id);
      if (!ids.length) { setItems([]); setLoading(false); return; }
      qy = qy.in('user_id', ids);
    }
    const { data } = await qy;
    const list = (data || []).filter((s) => !blocked.has(s.user_id));
    setItems(list);
    if (list.length) {
      const { data: l } = await supabase.from('story_likes').select('story_id').eq('user_id', profile.id).in('story_id', list.map((s) => s.id));
      setLikedIds(new Set((l || []).map((x) => x.story_id)));
    }
    setLoading(false);
  }, [tab, profile.id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <Screen>
      <TopBar title="Stories" big right={<Pressable onPress={() => navigation.navigate('WriteStory')} hitSlop={10}><Ionicons name="create-outline" size={28} color={C.text} /></Pressable>} />
      <Segmented items={[['all', 'All'], ['follow', 'Follow']]} value={tab} onChange={setTab} />
      <FlatList style={{ marginTop: 10 }} data={items} keyExtractor={(s) => s.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={C.accent} />}
        renderItem={({ item }) => <StoryCard story={item} liked={likedIds.has(item.id)} onOpenUser={(id) => id === profile.id ? navigation.navigate('MY') : navigation.navigate('UserProfile', { id })} onDeleted={(id) => setItems((l) => l.filter((x) => x.id !== id))} />}
        ListEmptyComponent={loading ? null : <Empty text={tab === 'follow' ? 'Follow people to see their stories here.' : 'No stories yet. Tap the pencil to post the first one.'} />} />
    </Screen>
  );
}
