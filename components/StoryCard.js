import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, Pressable, Modal, FlatList, KeyboardAvoidingView, Platform, Animated, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Avatar, Input } from './ui';
import { supabase } from '../lib/supabase';
import { publicUrl } from '../lib/upload';
import { checkText, notify, timeAgo } from '../lib/api';
import { countryName } from '../lib/countries';
import { useApp } from '../lib/AppContext';
import { C } from '../lib/theme';

function StoryVideo({ uri }) {
  const player = useVideoPlayer(uri, (p) => { p.loop = false; });
  return <VideoView player={player} nativeControls contentFit="contain" style={{ width: '100%', height: 280, borderRadius: 18, backgroundColor: '#000' }} />;
}

export function storyMediaUrl(s) {
  if (!s.media_key) return null;
  const i = s.media_key.indexOf('/');
  return publicUrl(s.media_key.slice(0, i), s.media_key.slice(i + 1));
}

function Comments({ story, visible, onClose, onAdded }) {
  const { profile } = useApp();
  const [list, setList] = useState([]);
  const [txt, setTxt] = useState('');
  useEffect(() => {
    if (!visible) return;
    supabase.from('story_comments').select('id,body,created_at,user_id,profiles(username,avatar_url,country)').eq('story_id', story.id).order('created_at').then(({ data }) => setList(data || []));
  }, [visible]);
  const send = async () => {
    const body = txt.trim(); if (!body) return;
    const mod = await checkText(body, `comment:${story.id}`);
    if (!mod.allowed) return Alert.alert('Comment blocked', mod.suspended ? 'Your account was suspended for repeated abusive language.' : 'Abusive language is not allowed.');
    const { data, error } = await supabase.from('story_comments').insert({ story_id: story.id, user_id: profile.id, body })
      .select('id,body,created_at,user_id,profiles(username,avatar_url,country)').single();
    if (error) return Alert.alert('Could not comment', error.message);
    setList([...list, data]); setTxt(''); onAdded(); notify(story.user_id, profile.id, 'comment', story.id);
  };
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: '#000A', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: C.cardDeep, borderTopLeftRadius: 28, borderTopRightRadius: 28, height: '70%' }}>
          <View style={{ flexDirection: 'row', padding: 20, alignItems: 'center' }}>
            <Text style={{ color: C.text, fontSize: 20, fontWeight: '700', flex: 1 }}>Comments</Text>
            <Pressable onPress={onClose}><Ionicons name="close" size={26} color={C.text} /></Pressable>
          </View>
          <FlatList data={list} keyExtractor={(c) => c.id} contentContainerStyle={{ paddingHorizontal: 20 }}
            ListEmptyComponent={<Text style={{ color: C.sub, textAlign: 'center', marginTop: 40 }}>No comments yet. Be the first.</Text>}
            renderItem={({ item }) => (
              <View style={{ flexDirection: 'row', marginBottom: 16 }}>
                <Avatar uri={item.profiles?.avatar_url} name={item.profiles?.username} size={38} />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={{ color: C.text, fontWeight: '700' }}>{item.profiles?.username} <Text style={{ color: C.sub, fontWeight: '400' }}>{timeAgo(item.created_at)}</Text></Text>
                  <Text style={{ color: C.text, marginTop: 2 }}>{item.body}</Text>
                </View>
              </View>
            )} />
          <View style={{ flexDirection: 'row', padding: 14, alignItems: 'center' }}>
            <Input placeholder="Enter a comment" value={txt} onChangeText={setTxt} style={{ flex: 1 }} maxLength={500} />
            <Pressable onPress={send} style={{ marginLeft: 10 }}><Ionicons name="send" size={26} color={C.accent} /></Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function StoryCard({ story, liked, onOpenUser, onDeleted }) {
  const { profile } = useApp();
  const [isLiked, setLiked] = useState(liked);
  const [likes, setLikes] = useState(story.like_count);
  const [comments, setComments] = useState(story.comment_count);
  const [open, setOpen] = useState(false);
  const pop = useRef(new Animated.Value(1)).current;
  const uri = storyMediaUrl(story);
  const u = story.profiles || {};

  const like = async () => {
    Animated.sequence([Animated.spring(pop, { toValue: 1.4, useNativeDriver: true, speed: 50 }), Animated.spring(pop, { toValue: 1, useNativeDriver: true })]).start();
    if (isLiked) {
      setLiked(false); setLikes((n) => Math.max(0, n - 1));
      await supabase.from('story_likes').delete().eq('story_id', story.id).eq('user_id', profile.id);
    } else {
      setLiked(true); setLikes((n) => n + 1);
      await supabase.from('story_likes').insert({ story_id: story.id, user_id: profile.id });
      notify(story.user_id, profile.id, 'like', story.id);
    }
  };

  const more = () => {
    const mine = story.user_id === profile.id;
    Alert.alert('Story', undefined, [
      mine ? { text: 'Delete story', style: 'destructive', onPress: async () => { await supabase.from('stories').delete().eq('id', story.id); onDeleted && onDeleted(story.id); } }
        : { text: 'Report story', onPress: async () => { await supabase.from('reports').insert({ reporter_id: profile.id, target_user_id: story.user_id, story_id: story.id, reason: 'Reported story' }); Alert.alert('Thanks', 'We will review this story.'); } },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <View style={{ paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.line }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Pressable onPress={() => onOpenUser && onOpenUser(story.user_id)}><Avatar uri={u.avatar_url} name={u.username} country={u.country} size={52} /></Pressable>
        <View style={{ marginLeft: 14, flex: 1 }}>
          <Text style={{ color: C.text, fontSize: 17, fontWeight: '700' }} numberOfLines={1}>{u.username}</Text>
          <Text style={{ color: C.sub, fontSize: 13 }} numberOfLines={1}>{countryName(u.country)}{story.language ? ` · ${story.language}` : ''} · {timeAgo(story.created_at)}</Text>
        </View>
        <Pressable onPress={more} hitSlop={10}><Ionicons name="ellipsis-horizontal" size={22} color={C.sub} /></Pressable>
      </View>
      {story.topic ? <Text style={{ color: C.accent, marginTop: 14 }}>#{story.topic}</Text> : null}
      {story.body ? <Text style={{ color: C.text, fontSize: 16, lineHeight: 23, marginTop: 12 }}>{story.body}</Text> : null}
      {uri && story.media_type === 'image' ? <Image source={{ uri }} style={{ width: '100%', height: 300, borderRadius: 18, marginTop: 12, backgroundColor: C.card }} resizeMode="cover" /> : null}
      {uri && story.media_type === 'video' ? <View style={{ marginTop: 12 }}><StoryVideo uri={uri} /></View> : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16 }}>
        <Pressable onPress={like} style={{ flexDirection: 'row', alignItems: 'center', marginRight: 26 }}>
          <Animated.View style={{ transform: [{ scale: pop }] }}><Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={28} color={isLiked ? C.danger : C.text} /></Animated.View>
          <Text style={{ color: C.text, marginLeft: 8, fontSize: 16 }}>{likes}</Text>
        </Pressable>
        <Pressable onPress={() => setOpen(true)} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="chatbubble-outline" size={26} color={C.text} />
          <Text style={{ color: C.text, marginLeft: 8, fontSize: 16 }}>{comments}</Text>
        </Pressable>
      </View>
      <Comments story={story} visible={open} onClose={() => setOpen(false)} onAdded={() => setComments((n) => n + 1)} />
    </View>
  );
}
