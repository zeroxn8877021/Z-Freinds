import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, FlatList, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, TopBar, Avatar, Btn, Empty } from '../components/ui';
import { supabase } from '../lib/supabase';
import { useApp } from '../lib/AppContext';
import { C } from '../lib/theme';

const Row = ({ icon, label, value, onPress }) => (
  <Pressable onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: C.line }}>
    <Ionicons name={icon} size={24} color={C.text} />
    <Text style={{ color: C.text, fontSize: 17, flex: 1, marginLeft: 18 }}>{label}</Text>
    {value ? <Text style={{ color: C.sub, marginRight: 8 }}>{value}</Text> : null}
    {onPress ? <Ionicons name="chevron-forward" size={20} color={C.text} /> : null}
  </Pressable>
);

export function Settings({ navigation }) {
  const { profile, session } = useApp();
  const until = profile.premium_until ? new Date(profile.premium_until).toLocaleDateString() : null;
  return (
    <Screen>
      <TopBar title="Settings" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        <Text style={{ color: C.text, fontSize: 20, fontWeight: '700', marginVertical: 12 }}>Account settings</Text>
        <Row icon="person-circle-outline" label="Account" value={session?.user?.email} />
        <Text style={{ color: C.text, fontSize: 20, fontWeight: '700', marginTop: 26, marginBottom: 4 }}>Preferences</Text>
        <Row icon="create-outline" label="Edit profile" onPress={() => navigation.navigate('EditProfile')} />
        <Row icon="remove-circle-outline" label="Blocked users" onPress={() => navigation.navigate('BlockedUsers')} />
        <Row icon="diamond-outline" label="My Premium" value={profile.is_premium ? (until ? `Until ${until}` : 'Active') : 'Not active'} />
        {profile.role === 'admin' ? <Row icon="shield-checkmark-outline" label="Admin panel" onPress={() => navigation.navigate('AdminPanel')} /> : null}
        <Text style={{ color: C.text, fontSize: 20, fontWeight: '700', marginTop: 26, marginBottom: 4 }}>Service</Text>
        <Row icon="help-circle-outline" label="Support" value="support@zfriends.app" />
        <Btn danger title="Log out" style={{ marginTop: 32 }} onPress={() => Alert.alert('Log out', 'Do you want to log out?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Log out', style: 'destructive', onPress: () => supabase.auth.signOut() }])} />
      </ScrollView>
    </Screen>
  );
}

export function BlockedUsers({ navigation }) {
  const { profile } = useApp();
  const [list, setList] = useState([]);
  const load = async () => {
    const { data: b } = await supabase.from('blocks').select('blocked_id').eq('blocker_id', profile.id);
    const ids = (b || []).map((x) => x.blocked_id);
    if (!ids.length) return setList([]);
    const { data } = await supabase.from('profiles').select('id,username,avatar_url,country').in('id', ids);
    setList(data || []);
  };
  useEffect(() => { load(); }, []);
  const unblock = async (id) => { await supabase.from('blocks').delete().eq('blocker_id', profile.id).eq('blocked_id', id); load(); };
  return (
    <Screen>
      <TopBar title="Blocked users" onBack={() => navigation.goBack()} />
      <FlatList data={list} keyExtractor={(u) => u.id} ListEmptyComponent={<Empty text="You have not blocked anyone." />}
        renderItem={({ item }) => (
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 }}>
            <Avatar uri={item.avatar_url} name={item.username} country={item.country} size={50} />
            <Text style={{ color: C.text, fontSize: 17, flex: 1, marginLeft: 14 }}>{item.username}</Text>
            <Btn soft title="Unblock" onPress={() => unblock(item.id)} style={{ paddingVertical: 10, paddingHorizontal: 16 }} />
          </View>
        )} />
    </Screen>
  );
}
