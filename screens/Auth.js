import React, { useState } from 'react';
import { View, Text, Alert, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import { Screen, Btn, Input, TopBar } from '../components/ui';
import ZLogo from '../components/ZLogo';
import { supabase } from '../lib/supabase';
import { C } from '../lib/theme';

function Shell({ title, subtitle, navigation, children }) {
  return (
    <Screen edges={['top', 'bottom']}>
      <TopBar title="" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">
          <ZLogo size={72} />
          <Text style={{ color: C.text, fontSize: 30, fontWeight: '800', marginTop: 18 }}>{title}</Text>
          <Text style={{ color: C.sub, marginTop: 6, marginBottom: 26 }}>{subtitle}</Text>
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

export function Login({ navigation }) {
  const [email, setEmail] = useState(''); const [pw, setPw] = useState(''); const [busy, setBusy] = useState(false);
  const go = async () => {
    if (!email.trim() || !pw) return Alert.alert('Missing details', 'Enter your email and password.');
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pw });
    setBusy(false);
    if (error) Alert.alert('Could not log in', error.message);
  };
  return (
    <Shell title="Welcome back" subtitle="Log in to keep talking with your friends." navigation={navigation}>
      <Input placeholder="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
      <Input placeholder="Password" secureTextEntry value={pw} onChangeText={setPw} style={{ marginTop: 12 }} />
      <Btn title="Log in" onPress={go} loading={busy} style={{ marginTop: 22 }} />
      <Pressable onPress={() => navigation.replace('Signup')} style={{ alignItems: 'center', marginTop: 22 }}>
        <Text style={{ color: C.accent }}>New here? Create an account</Text>
      </Pressable>
    </Shell>
  );
}

export function Signup({ navigation }) {
  const [username, setUsername] = useState(''); const [email, setEmail] = useState(''); const [pw, setPw] = useState(''); const [busy, setBusy] = useState(false);
  const go = async () => {
    if (username.trim().length < 3) return Alert.alert('Username too short', 'Use at least 3 characters.');
    if (pw.length < 8) return Alert.alert('Weak password', 'Use at least 8 characters.');
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password: pw, options: { data: { username: username.trim() } } });
    setBusy(false);
    if (error) return Alert.alert('Could not sign up', error.message);
    if (!data.session) Alert.alert('Check your email', 'We sent a confirmation link. Confirm it, then log in.');
  };
  return (
    <Shell title="Create your account" subtitle="You must be 18 or older to use Z Friends." navigation={navigation}>
      <Input placeholder="Username" autoCapitalize="none" value={username} onChangeText={setUsername} />
      <Input placeholder="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} style={{ marginTop: 12 }} />
      <Input placeholder="Password (8+ characters)" secureTextEntry value={pw} onChangeText={setPw} style={{ marginTop: 12 }} />
      <Btn title="Sign up" onPress={go} loading={busy} style={{ marginTop: 22 }} />
      <Pressable onPress={() => navigation.replace('Login')} style={{ alignItems: 'center', marginTop: 22 }}>
        <Text style={{ color: C.accent }}>Already have an account? Log in</Text>
      </Pressable>
    </Shell>
  );
}

export function AdminLogin({ navigation }) {
  const [email, setEmail] = useState(''); const [pw, setPw] = useState(''); const [busy, setBusy] = useState(false);
  const go = async () => {
    setBusy(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pw });
    if (error) { setBusy(false); return Alert.alert('Could not log in', error.message); }
    const { data: p } = await supabase.from('profiles').select('role').eq('id', data.user.id).maybeSingle();
    if (p?.role !== 'admin') {
      await supabase.auth.signOut();
      Alert.alert('Not an admin', 'This account does not have admin access.');
    }
    setBusy(false);
  };
  return (
    <Shell title="Admin login" subtitle="For Z Friends developers and moderators." navigation={navigation}>
      <Input placeholder="Admin email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
      <Input placeholder="Password" secureTextEntry value={pw} onChangeText={setPw} style={{ marginTop: 12 }} />
      <Btn title="Log in as admin" onPress={go} loading={busy} style={{ marginTop: 22 }} />
    </Shell>
  );
}
