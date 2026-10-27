import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, TopBar, Avatar, Btn, Segmented } from '../components/ui';
import StoryGrid from '../components/StoryGrid';
import { supabase } from '../lib/supabase';
import { countryName } from '../lib/countries';
import { useApp } from '../lib/AppContext';
import { C } from '../lib/theme';

const count = (q) => q.then(({ count }) => count || 0);

export default function Profile({ navigation }) {
  const { profile } = useApp();
  const [tab, setTab] = useState('profile');
  const [stats, setStats] = useState({ following: 0, followers: 0, visitors: 0, stories: 0 });
  const [stories, setStories] = useState([]);

  useFocusEffect(useCallback(() => {
    (async () => {
      const head = { count: 'exact', head: true };
      const [following, followers, visitors] = await Promise.all([
        count(supabase.from('follows').select('follower_id', head).eq('follower_id', profile.id)),
        count(supabase.from('follows').select('follower_id', head).eq('following_id', profile.id)),
        count(supabase.from('profile_visits').select('id', head).eq('profile_id', profile.id)),
      ]);
      const { data } = await supabase.from('stories').select('*').eq('user_id', profile.id).gt('expires_at', new Date().toISOString()).order('created_at', { ascending: false });
      setStories(data || []);
      setStats({ following, followers, visitors, stories: (data || []).length });
    })();
  }, [profile.id]));

  const Stat = ({ n, l }) => <View style={{ alignItems: 'center', flex: 1 }}><Text style={{ color: C.text, fontSize: 22, fontWeight: '700' }}>{n}</Text><Text style={{ color: C.sub, marginTop: 2 }}>{l}</Text></View>;
  return (
    <Screen>
      <TopBar title="My profile" big right={<Pressable onPress={() => navigation.navigate('Settings')} hitSlop={10}><Ionicons name="settings-outline" size={28} color={C.text} /></Pressable>} />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ alignItems: 'center' }}>
          <Avatar uri={profile.avatar_url} name={profile.username} country={profile.country} size={130} />
          <Text style={{ color: C.text, fontSize: 24, fontWeight: '800', marginTop: 14 }}>{profile.username}</Text>
          <Text style={{ color: C.sub, marginTop: 6 }}>{countryName(profile.country)} · {profile.age} years old · {profile.gender}</Text>
          <Text style={{ color: C.accent, marginTop: 10 }}>{(profile.languages || []).join(' · ')}</Text>
          {profile.is_premium ? <Text style={{ color: C.gold, marginTop: 8, fontWeight: '700' }}>Premium member</Text> : null}
        </View>
        <View style={{ paddingHorizontal: 20, marginTop: 20 }}><Btn soft icon="create-outline" title="Edit profile" onPress={() => navigation.navigate('EditProfile')} /></View>
        <View style={{ flexDirection: 'row', marginTop: 26 }}>
          <Stat n={stats.following} l="Following" /><Stat n={stats.followers} l="Followers" /><Stat n={stats.visitors} l="Visitors" /><Stat n={stats.stories} l="Stories" />
        </View>
        <View style={{ marginTop: 26 }}><Segmented items={[['profile', 'Profile'], ['stories', 'Stories']]} value={tab} onChange={setTab} /></View>
        <View style={{ padding: 20 }}>
          {tab === 'profile' ? (
            <>
              <Text style={{ color: C.text, fontSize: 20, fontWeight: '700' }}>About me</Text>
              <Text style={{ color: C.sub, marginTop: 8, lineHeight: 22 }}>{profile.about || 'Tell people about yourself. Tap Edit profile.'}</Text>
            </>
          ) : (
            <>
              <Text style={{ color: C.text, fontSize: 20, fontWeight: '700', marginBottom: 12 }}>My stories</Text>
              <StoryGrid stories={stories} />
              <Btn title="Write a story" icon="create-outline" soft style={{ marginTop: 20 }} onPress={() => navigation.navigate('WriteStory')} />
            </>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}
