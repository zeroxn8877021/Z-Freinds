import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, Pressable, Image, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Screen, TopBar, Input, Avatar, Btn, ProgressBar } from '../components/ui';
import { supabase } from '../lib/supabase';
import { uploadFile, extFor } from '../lib/upload';
import { checkText, sendMessage } from '../lib/api';
import { useApp } from '../lib/AppContext';
import { C } from '../lib/theme';

function ChatImage({ mediaKey }) {
  const [uri, setUri] = useState(null);
  useEffect(() => {
    const i = mediaKey.indexOf('/');
    supabase.storage.from(mediaKey.slice(0, i)).createSignedUrl(mediaKey.slice(i + 1), 3600).then(({ data }) => setUri(data?.signedUrl));
  }, [mediaKey]);
  return uri ? <Image source={{ uri }} style={{ width: 220, height: 220, borderRadius: 14 }} /> : <View style={{ width: 220, height: 220, borderRadius: 14, backgroundColor: C.card }} />;
}

export default function Chat({ route, navigation }) {
  const { profile } = useApp();
  const { other } = route.params;
  const [conv, setConv] = useState(route.params.conv);
  const [msgs, setMsgs] = useState([]);
  const [txt, setTxt] = useState('');
  const [progress, setProgress] = useState(null);
  const listRef = useRef(null);
  const incomingRequest = conv.status === 'request' && conv.initiator_id !== profile.id;
  const waiting = conv.status === 'request' && conv.initiator_id === profile.id;

  useEffect(() => {
    let alive = true;
    supabase.from('messages').select('*').eq('conversation_id', conv.id).order('created_at', { ascending: false }).limit(100)
      .then(({ data }) => { if (alive) setMsgs(data || []); });
    const ch = supabase.channel(`chat:${conv.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conv.id}` },
        (p) => setMsgs((m) => (m.some((x) => x.id === p.new.id) ? m : [p.new, ...m])))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'conversations', filter: `id=eq.${conv.id}` }, (p) => setConv((c) => ({ ...c, ...p.new })))
      .subscribe();
    return () => { alive = false; supabase.removeChannel(ch); };
  }, [conv.id]);

  const send = async () => {
    const body = txt.trim(); if (!body) return;
    setTxt('');
    const mod = await checkText(body, `chat:${conv.id}`);
    if (!mod.allowed) return Alert.alert('Message blocked', mod.suspended ? 'Your account was suspended for repeated abusive language.' : 'Abusive language is not allowed.');
    try { await sendMessage(conv.id, profile.id, { body }); } catch (e) { Alert.alert('Not sent', e.message); setTxt(body); }
  };

  const sendImage = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (r.canceled) return;
    const a = r.assets[0];
    try {
      setProgress(0);
      const path = `${conv.id}/${Date.now()}.${extFor(a)}`;
      const { key } = await uploadFile({ bucket: 'chat-media', path, uri: a.uri, contentType: a.mimeType || 'image/jpeg', onProgress: setProgress });
      await sendMessage(conv.id, profile.id, { media_url: key, media_key: key, media_type: 'image' });
    } catch (e) { Alert.alert('Image not sent', e.message); }
    setProgress(null);
  };

  const answer = async (status) => {
    await supabase.from('conversations').update({ status }).eq('id', conv.id);
    if (status === 'declined') navigation.goBack(); else setConv({ ...conv, status });
  };

  const menu = () => Alert.alert(other.username, undefined, [
    { text: 'View profile', onPress: () => navigation.navigate('UserProfile', { id: other.id }) },
    { text: 'Report', onPress: async () => { await supabase.from('reports').insert({ reporter_id: profile.id, target_user_id: other.id, reason: 'Reported from chat' }); Alert.alert('Thanks', 'We will review this report.'); } },
    { text: 'Block', style: 'destructive', onPress: async () => { await supabase.from('blocks').insert({ blocker_id: profile.id, blocked_id: other.id }); navigation.goBack(); } },
    { text: 'Cancel', style: 'cancel' },
  ]);

  return (
    <Screen edges={['top', 'bottom']}>
      <TopBar title={other.username} onBack={() => navigation.goBack()} right={<Pressable onPress={menu} hitSlop={10}><Ionicons name="ellipsis-horizontal" size={24} color={C.text} /></Pressable>} />
      {incomingRequest ? (
        <View style={{ marginHorizontal: 20, padding: 14, backgroundColor: C.card, borderRadius: 18 }}>
          <Text style={{ color: C.text, marginBottom: 10 }}>{other.username} wants to chat with you.</Text>
          <View style={{ flexDirection: 'row' }}>
            <Btn title="Accept" onPress={() => answer('open')} style={{ flex: 1, paddingVertical: 10, marginRight: 8 }} />
            <Btn title="Decline" soft onPress={() => answer('declined')} style={{ flex: 1, paddingVertical: 10 }} />
          </View>
        </View>
      ) : null}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList ref={listRef} inverted data={msgs} keyExtractor={(m) => m.id} contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => {
            const mine = item.sender_id === profile.id;
            return (
              <View style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '78%', marginVertical: 4 }}>
                <View style={{ backgroundColor: mine ? C.accentDeep : C.card, borderRadius: 20, padding: item.media_type ? 6 : 12, paddingHorizontal: item.media_type ? 6 : 16 }}>
                  {item.media_key ? <ChatImage mediaKey={item.media_key} /> : <Text style={{ color: C.text, fontSize: 16 }}>{item.body}</Text>}
                </View>
              </View>
            );
          }} />
        {waiting ? <Text style={{ color: C.sub, textAlign: 'center', paddingBottom: 6 }}>Waiting for {other.username} to accept your request.</Text> : null}
        {progress !== null ? <View style={{ paddingHorizontal: 16 }}><ProgressBar value={progress} label="Sending image" /></View> : null}
        {!incomingRequest ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12 }}>
            <Pressable onPress={sendImage} style={{ marginRight: 10 }}><Ionicons name="image-outline" size={28} color={C.accent} /></Pressable>
            <Input placeholder="Message" value={txt} onChangeText={setTxt} style={{ flex: 1 }} onSubmitEditing={send} maxLength={1000} />
            <Pressable onPress={send} style={{ marginLeft: 10 }}><Ionicons name="send" size={26} color={C.accent} /></Pressable>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </Screen>
  );
}
