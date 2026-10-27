import React, { useState } from 'react';
import { View, Text, Alert, ScrollView, Pressable, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { Screen, Btn, Input, Chip, TopBar, ProgressBar, SelectModal } from '../components/ui';
import { supabase } from '../lib/supabase';
import { uploadFile, publicUrl, extFor } from '../lib/upload';
import { COUNTRIES, LANGUAGES, countryName, flag } from '../lib/countries';
import { useApp } from '../lib/AppContext';
import { C } from '../lib/theme';

// Used for first-time onboarding and for "Edit profile" (when reachable via navigation).
export default function ProfileSetup() {
  const nav = useNavigation();
  const editing = nav.canGoBack();
  const { profile, refreshProfile } = useApp();
  const [asset, setAsset] = useState(null);
  const [username, setUsername] = useState(profile.username || '');
  const [age, setAge] = useState(profile.age ? String(profile.age) : '');
  const [gender, setGender] = useState(profile.gender || '');
  const [country, setCountry] = useState(profile.country || '');
  const [langs, setLangs] = useState(profile.languages || []);
  const [bio, setBio] = useState(profile.about || '');
  const [pickC, setPickC] = useState(false);
  const [pickL, setPickL] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);

  const pick = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!r.canceled) setAsset(r.assets[0]);
  };

  const save = async () => {
    const a = parseInt(age, 10);
    if (!editing && !asset && !profile.avatar_url) return Alert.alert('Add a photo', 'Upload a real photo of yourself. Anime, cartoon and fake photos are not allowed.');
    if (username.trim().length < 3) return Alert.alert('Username too short', 'Use at least 3 characters.');
    if (!a || a < 18 || a > 100) return Alert.alert('Age', 'You must be 18 or older to use Z Friends.');
    if (!gender) return Alert.alert('Gender', 'Choose one option.');
    if (!country) return Alert.alert('Country', 'Choose your country.');
    if (langs.length === 0) return Alert.alert('Languages', 'Choose at least one language.');
    setBusy(true);
    try {
      let avatar_url = profile.avatar_url;
      if (asset) {
        const path = `${profile.id}/${Date.now()}.${extFor(asset)}`;
        await uploadFile({ bucket: 'avatars', path, uri: asset.uri, contentType: asset.mimeType || 'image/jpeg', onProgress: setProgress });
        avatar_url = publicUrl('avatars', path);
      }
      const { error } = await supabase.from('profiles').update({
        username: username.trim(), age: a, gender, country, languages: langs, about: bio.trim() || null, avatar_url,
      }).eq('id', profile.id);
      if (error) throw error;

      if (asset) {
        const { data: check, error: ce } = await supabase.functions.invoke('check-profile-photo');
        if (!ce && check && check.allowed === false) {
          setBusy(false);
          await refreshProfile();
          return Alert.alert('Photo not accepted',
            check.category === 'anime_cartoon' ? 'Anime and cartoon photos are not allowed. Upload a real photo of yourself.'
              : 'We could not verify this as a real photo of you. Try a clear, recent photo.');
        }
      }
      await supabase.from('profiles').update({ onboarded: true }).eq('id', profile.id);
      await refreshProfile();
      if (editing) nav.goBack();
    } catch (e) {
      Alert.alert('Could not save', e.message || String(e));
    }
    setBusy(false);
  };

  const shown = asset?.uri || profile.avatar_url;
  return (
    <Screen edges={['top', 'bottom']}>
      <TopBar title={editing ? 'Edit profile' : 'Set up your profile'} onBack={editing ? () => nav.goBack() : undefined} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        <Pressable onPress={pick} style={{ alignSelf: 'center', marginBottom: 22 }}>
          {shown ? <Image source={{ uri: shown }} style={{ width: 120, height: 120, borderRadius: 60 }} />
            : <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: C.accent, fontWeight: '700' }}>Add photo</Text></View>}
        </Pressable>
        <Text style={{ color: C.sub, textAlign: 'center', marginBottom: 22 }}>Use a real photo of yourself.</Text>
        <Input placeholder="Username" autoCapitalize="none" value={username} onChangeText={setUsername} />
        <Input placeholder="Age" keyboardType="number-pad" value={age} onChangeText={setAge} style={{ marginTop: 12 }} maxLength={3} />
        <Text style={{ color: C.sub, marginTop: 18, marginBottom: 8 }}>Gender</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {['Male', 'Female', 'Other'].map((g) => <Chip key={g} label={g} active={gender === g} onPress={() => setGender(g)} />)}
        </View>
        <Text style={{ color: C.sub, marginTop: 10, marginBottom: 8 }}>Country</Text>
        <Btn soft title={country ? `${flag(country)}  ${countryName(country)}` : 'Choose country'} onPress={() => setPickC(true)} />
        <Text style={{ color: C.sub, marginTop: 18, marginBottom: 8 }}>Languages you speak</Text>
        <Btn soft title={langs.length ? langs.join(', ') : 'Choose languages'} onPress={() => setPickL(true)} />
        <Input placeholder="About me (optional)" multiline value={bio} onChangeText={setBio} style={{ marginTop: 18, minHeight: 90, textAlignVertical: 'top' }} />
        {busy && progress > 0 && progress < 1 ? <ProgressBar value={progress} label="Uploading photo" /> : null}
        <Btn title={editing ? 'Save changes' : 'Continue'} onPress={save} loading={busy} style={{ marginTop: 22 }} />
      </ScrollView>
      <SelectModal visible={pickC} title="Country" options={COUNTRIES.map(([v, l]) => ({ value: v, label: `${flag(v)}  ${l}` }))} selected={country} onClose={() => setPickC(false)} onChange={setCountry} />
      <SelectModal visible={pickL} title="Languages" multi options={LANGUAGES.map((l) => ({ value: l, label: l }))} selected={langs} onClose={() => setPickL(false)} onChange={setLangs} />
    </Screen>
  );
}
