import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { storyMediaUrl } from './StoryCard';
import { C } from '../lib/theme';

export default function StoryGrid({ stories, onPress }) {
  if (!stories.length) return <Text style={{ color: C.sub, textAlign: 'center', marginTop: 24 }}>No live stories. Stories last 24 hours.</Text>;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5 }}>
      {stories.map((s) => {
        const uri = storyMediaUrl(s);
        return (
          <Pressable key={s.id} onPress={() => onPress && onPress(s)} style={{ width: '33.33%', padding: 5 }}>
            <View style={{ aspectRatio: 1, backgroundColor: C.card, borderRadius: 16, overflow: 'hidden', padding: 10 }}>
              {uri && s.media_type === 'image' ? <Image source={{ uri }} style={{ position: 'absolute', width: '100%', height: '100%' }} /> : <Text style={{ color: C.text, fontSize: 13 }} numberOfLines={5}>{s.body || (s.media_type === 'video' ? 'Video' : '')}</Text>}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
