import React from 'react';
import { View, Text } from 'react-native';
import { Screen, Btn } from '../components/ui';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../lib/AppContext';
import { supabase } from '../lib/supabase';
import { C } from '../lib/theme';

export default function Blocked() {
  const { profile } = useApp();
  return (
    <Screen edges={['top', 'bottom']}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 }}>
        <Ionicons name="ban" size={72} color={C.danger} />
        <Text style={{ color: C.text, fontSize: 24, fontWeight: '800', marginTop: 16 }}>Account {profile.status}</Text>
        <Text style={{ color: C.sub, textAlign: 'center', marginTop: 10 }}>
          {profile.blocked_reason || 'Your account was restricted for breaking the community rules.'}
        </Text>
        <Text style={{ color: C.sub, textAlign: 'center', marginTop: 10 }}>If you think this is a mistake, contact support.</Text>
        <Btn title="Log out" soft style={{ marginTop: 30, alignSelf: 'stretch' }} onPress={() => supabase.auth.signOut()} />
      </View>
    </Screen>
  );
}
