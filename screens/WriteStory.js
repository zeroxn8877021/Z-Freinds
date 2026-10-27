import React, { useState } from 'react';
import { View, Text, Alert, ScrollView, Image, Pressable } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Screen, TopBar, Input, Chip, Btn, ProgressBar } from '../components/ui';
import { supabase } from '../lib/supabase';
import { uploadFile, extFor } from '../lib/upload';
import { checkText } from '../lib/api';
import { TOPICS } from '../lib/countries';
import { useApp } from '../lib/AppContext';
import { C } from '../lib/theme';

export default function WriteStory({ navigation }) {
  const { profile } = useApp();
  const [body, setBody] = useState('');
  const [topic, setTopic] = useState(null);
  const [asset, setAsset] = useState(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);

  const pick = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images', 'videos'], quality: 0.8, videoMaxDuration: 60 });
    if (!r.canceled) setAsset(r.assets[0]);
  };

  const post = async () => {
    if (!body.trim() && !asset) return Alert.alert('Nothing to post', 'Write something or add a photo or video.');
    setBusy(true); setProgress(0);
    try {
      const mod = await checkText(body, 'story');
      if (!mod.allowed) {
        setBusy(false);
        return Alert.alert('Story blocked', mod.suspended ? 'Your account was suspended for repeated abusive language.' : 'Abusive language is not allowed. Your account may be restricted if this continues.');
      }
      let media = {};
      if (asset) {
        const isVideo = asset.type === 'video';
        const path = `${profile.id}/${Date.now()}.${extFor(asset)}`;
        const { key } = await uploadFile({ bucket: 'story-media', path, uri: asset.uri, contentType: asset.mimeType || (isVideo ? 'video/mp4' : 'image/jpeg'), onProgress: setProgress });
        media = { media_key: key, media_url: key, media_type: isVideo ? 'video' : 'image' };
      }
      const { error } = await supabase.from('stories').insert({ user_id: profile.id, body: body.trim() || null, topic, language: (profile.languages || [])[0] || null, ...media });
      if (error) throw error;
      navigation.goBack();
    } catch (e) { Alert.alert('Could not post', e.message || String(e)); }
    setBusy(false);
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <TopBar title="Write a story" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
        <Input placeholder="Write your story" multiline value={body} onChangeText={setBody} maxLength={1000} style={{ minHeight: 160, textAlignVertical: 'top' }} />
        <Text style={{ color: C.sub, marginTop: 12 }}>Stories disappear after 24 hours. Abusive or offensive posts can get your account restricted or suspended.</Text>
        <Text style={{ color: C.text, fontSize: 18, fontWeight: '700', marginTop: 24, marginBottom: 10 }}>Topics</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {TOPICS.map((t) => <Chip key={t} label={`#${t}`} active={topic === t} onPress={() => setTopic(topic === t ? null : t)} />)}
        </View>
        <Text style={{ color: C.text, fontSize: 18, fontWeight: '700', marginTop: 16, marginBottom: 10 }}>Attachments</Text>
        {asset ? (
          <View>
            {asset.type === 'video'
              ? <View style={{ height: 120, borderRadius: 16, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="videocam" size={36} color={C.accent} /><Text style={{ color: C.sub, marginTop: 4 }}>Video ready to upload</Text></View>
              : <Image source={{ uri: asset.uri }} style={{ width: '100%', height: 220, borderRadius: 16 }} />}
            <Pressable onPress={() => setAsset(null)} style={{ marginTop: 8 }}><Text style={{ color: C.danger }}>Remove</Text></Pressable>
          </View>
        ) : <Btn soft icon="images-outline" title="Add photo or video" onPress={pick} />}
        {busy && asset ? <ProgressBar value={progress} label="Uploading" /> : null}
        <Btn title="Post story" onPress={post} loading={busy} style={{ marginTop: 24 }} />
      </ScrollView>
    </Screen>
  );
}
