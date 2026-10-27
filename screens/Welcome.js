import React, { useRef, useState, useEffect } from 'react';
import { View, Text, ScrollView, Dimensions, Animated, Pressable } from 'react-native';
import { Screen, Btn } from '../components/ui';
import ZLogo from '../components/ZLogo';
import { C } from '../lib/theme';

const { width } = Dimensions.get('window');
const SLIDES = [
  { t: 'Meet people from everywhere', d: 'Find friends across countries who speak your language or want to learn it.' },
  { t: 'Share stories for 24 hours', d: 'Post text, photos and videos. They disappear after a day, so share freely.' },
  { t: 'Chat in real time', d: 'Send a wave, get accepted, and start talking. Block or report anyone, anytime.' },
];

export default function Welcome({ navigation }) {
  const [i, setI] = useState(0);
  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(fade, { toValue: 1, duration: 900, useNativeDriver: true }).start(); }, []);
  return (
    <Screen edges={['top', 'bottom']}>
      <Animated.View style={{ alignItems: 'center', marginTop: 40, opacity: fade }}>
        <ZLogo size={112} />
        <Text style={{ color: C.text, fontSize: 34, fontWeight: '800', marginTop: 16 }}>Z Friends</Text>
      </Animated.View>
      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, marginTop: 40 }}
        onMomentumScrollEnd={(e) => setI(Math.round(e.nativeEvent.contentOffset.x / width))}>
        {SLIDES.map((s) => (
          <View key={s.t} style={{ width, paddingHorizontal: 32 }}>
            <Text style={{ color: C.text, fontSize: 24, fontWeight: '700', textAlign: 'center' }}>{s.t}</Text>
            <Text style={{ color: C.sub, fontSize: 16, textAlign: 'center', marginTop: 10, lineHeight: 23 }}>{s.d}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24 }}>
        {SLIDES.map((_, k) => <View key={k} style={{ width: k === i ? 24 : 8, height: 8, borderRadius: 4, marginHorizontal: 4, backgroundColor: k === i ? C.accent : C.card }} />)}
      </View>
      <View style={{ flex: 1 }} />
      <View style={{ paddingHorizontal: 24, paddingBottom: 12 }}>
        <Btn title="Create account" onPress={() => navigation.navigate('Signup')} />
        <Btn title="Log in" soft style={{ marginTop: 12 }} onPress={() => navigation.navigate('Login')} />
        <Pressable onPress={() => navigation.navigate('AdminLogin')} style={{ alignItems: 'center', marginTop: 20 }}>
          <Text style={{ color: C.sub }}>Admin login</Text>
        </Pressable>
      </View>
    </Screen>
  );
}
