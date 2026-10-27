import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, TopBar, Avatar, Btn } from '../components/ui';
import StoryGrid from '../components/StoryGrid';
import { supabase } from '../lib/supabase';
import { notify, openConversation, sendMessage } from '../lib/api';
import { countryName } from '../lib/countries';
import { useApp } from '../lib/AppContext';
import { C } from '../lib/theme';

export default function UserProfile({ route, navigation }) {
  const { profile: me } = useApp();
  const { id } = route.params;
  const [p, setP] = useState(null);
  const [stories, setStories] = useState([]);
  const [following, setFollowing] = useState(false);
  const [followers, setFollowers] = useState(0);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
      setP(data);
      const { data: s } = await supabase.from('stories').select('*').eq('user_id', id).gt('expires_at', new Date().toISOString()).order('created_at', { ascending: false });
      setStories(s || []);
      const { data: f } = await supabase.from('follows').select('follower_id').eq('following_id', id);
      setFollowers((f || []).length); setFollowing((f || []).some((x) => x.follower_id === me.id));
      if (id !== me.id) { await supabase.from('profile_visits').insert({ profile_id: id, visitor_id: me.id }); notify(id, me.id, 'visit'); }
    })();
  }, [id]);

  const toggle = async () => {
    if (following) { setFollowing(false); setFollowers((n) => n - 1); await supabase.from('follows').delete().eq('follower_id', me.id).eq('following_id', id); }
    else { setFollowing(true); setFollowers((n) => n + 1); await supabase.from('follows').insert({ follower_id: me.id, following_id: id }); notify(id, me.id, 'follow'); }
  };
  const message = async () => {
    try {
      const { conv, created } = await openConversation(me.id, id);
      if (created) await sendMessage(conv.id, me.id, { body: '👋' });
      navigation.navigate('Chat', { conv, other: p });
    } catch (e) { Alert.alert('Could not start chat', e.message); }
  };
  const more = () => Alert.alert(p.username, undefined, [
    { text: 'Report user', onPress: async () => { await supabase.from('reports').insert({ reporter_id: me.id, target_user_id: id, reason: 'Reported profile' }); Alert.alert('Thanks', 'We will review this report.'); } },
    { text: 'Block user', style: 'destructive', onPress: async () => { await supabase.from('blocks').insert({ blocker_id: me.id, blocked_id: id }); navigation.goBack(); } },
    { text: 'Cancel', style: 'cancel' },
  ]);

  if (!p) return <Screen><TopBar title="" onBack={() => navigation.goBack()} /></Screen>;
  return (
    <Screen>
      <TopBar title={p.username} onBack={() => navigation.goBack()} right={id !== me.id ? <Pressable onPress={more} hitSlop={10}><Ionicons name="ellipsis-horizontal" size={24} color={C.text} /></Pressable> : null} />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ alignItems: 'center' }}>
          <Avatar uri={p.avatar_url} name={p.username} country={p.country} size={130} />
          <Text style={{ color: C.sub, marginTop: 14 }}>{countryName(p.country)} · {p.age} years old · {p.gender}</Text>
          <Text style={{ color: C.accent, marginTop: 8 }}>{(p.languages || []).join(' · ')}</Text>
          <Text style={{ color: C.sub, marginTop: 8 }}>{followers} followers</Text>
        </View>
        {id !== me.id ? (
          <View style={{ flexDirection: 'row', paddingHorizontal: 20, marginTop: 20 }}>
            <Btn title={following ? 'Following' : 'Follow'} soft={following} onPress={toggle} style={{ flex: 1, marginRight: 8 }} />
            <Btn title="Message" soft icon="chatbubble-outline" onPress={message} style={{ flex: 1 }} />
          </View>
        ) : null}
        <View style={{ padding: 20 }}>
          {p.about ? <><Text style={{ color: C.text, fontSize: 20, fontWeight: '700' }}>About me</Text><Text style={{ color: C.sub, marginTop: 8, marginBottom: 20, lineHeight: 22 }}>{p.about}</Text></> : null}
          <Text style={{ color: C.text, fontSize: 20, fontWeight: '700', marginBottom: 12 }}>Stories</Text>
          <StoryGrid stories={stories} />
        </View>
      </ScrollView>
    </Screen>
  );
}
