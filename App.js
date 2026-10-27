import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { ActivityIndicator, View, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from './lib/supabase';
import { AppContext } from './lib/AppContext';
import { C } from './lib/theme';
import ZLogo from './components/ZLogo';

import Welcome from './screens/Welcome';
import { Login, Signup, AdminLogin } from './screens/Auth';
import ProfileSetup from './screens/ProfileSetup';
import Home from './screens/Home';
import Stories from './screens/Stories';
import WriteStory from './screens/WriteStory';
import { Messages, Requests } from './screens/Messages';
import Chat from './screens/Chat';
import Profile from './screens/Profile';
import UserProfile from './screens/UserProfile';
import Notifications from './screens/Notifications';
import { Settings, BlockedUsers } from './screens/Settings';
import AdminPanel from './screens/AdminPanel';
import Blocked from './screens/Blocked';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const theme = { ...DefaultTheme, dark: true, colors: { ...DefaultTheme.colors, background: C.bg, card: C.bg, text: C.text, border: C.line, primary: C.accent } };

function Tabs() {
  const icons = { Home: 'home', Stories: 'star', Voice: 'mic', Messages: 'chatbubble-ellipses', MY: 'person' };
  return (
    <Tab.Navigator screenOptions={({ route }) => ({
      headerShown: false,
      tabBarStyle: { backgroundColor: C.bg, borderTopColor: C.line, height: 72, paddingBottom: 10, paddingTop: 8 },
      tabBarActiveTintColor: C.accent, tabBarInactiveTintColor: C.sub,
      tabBarIcon: ({ color, size, focused }) =>
        route.name === 'Voice'
          ? <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: C.accentDeep, alignItems: 'center', justifyContent: 'center', marginTop: -22 }}><Ionicons name="mic" size={26} color="#fff" /></View>
          : <Ionicons name={focused ? icons[route.name] : icons[route.name] + '-outline'} size={size} color={color} />,
    })}>
      <Tab.Screen name="Home" component={Home} />
      <Tab.Screen name="Stories" component={Stories} />
      <Tab.Screen name="Voice" component={VoiceSoon} />
      <Tab.Screen name="Messages" component={Messages} />
      <Tab.Screen name="MY" component={Profile} />
    </Tab.Navigator>
  );
}

function VoiceSoon() {
  return (
    <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', padding: 30 }}>
      <Ionicons name="mic-circle" size={90} color={C.accent} />
      <Text style={{ color: C.text, fontSize: 22, fontWeight: '700', marginTop: 12 }}>Voice rooms</Text>
      <Text style={{ color: C.sub, textAlign: 'center', marginTop: 8 }}>Voice chat is coming in the next update.</Text>
    </View>
  );
}

const splash = (
  <View style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
    <ZLogo size={110} /><ActivityIndicator color={C.accent} style={{ marginTop: 28 }} />
  </View>
);

export default function App() {
  const [session, setSession] = useState(undefined);
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const loadProfile = useCallback(async (uid) => {
    if (!uid) { setProfile(null); return; }
    setLoadingProfile(true);
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
    setProfile(data || null);
    setLoadingProfile(false);
    if (data) supabase.from('profiles').update({ last_seen: new Date().toISOString() }).eq('id', uid).then(() => {});
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => { if (session !== undefined) loadProfile(session?.user?.id); }, [session?.user?.id]);

  const ctx = useMemo(() => ({ session, profile, refreshProfile: () => loadProfile(session?.user?.id) }), [session, profile, loadProfile]);

  let body;
  if (session === undefined || (session && loadingProfile && !profile)) body = splash;
  else if (!session) {
    body = (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Welcome" component={Welcome} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Signup" component={Signup} />
        <Stack.Screen name="AdminLogin" component={AdminLogin} />
      </Stack.Navigator>
    );
  } else if (!profile) body = splash;
  else if (profile.status !== 'active') body = <Blocked />;
  else if (!profile.onboarded) body = (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileSetup" component={ProfileSetup} />
    </Stack.Navigator>
  );
  else {
    body = (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tabs" component={Tabs} />
        <Stack.Screen name="Chat" component={Chat} />
        <Stack.Screen name="Requests" component={Requests} />
        <Stack.Screen name="UserProfile" component={UserProfile} />
        <Stack.Screen name="WriteStory" component={WriteStory} options={{ presentation: 'modal' }} />
        <Stack.Screen name="Notifications" component={Notifications} />
        <Stack.Screen name="Settings" component={Settings} />
        <Stack.Screen name="BlockedUsers" component={BlockedUsers} />
        <Stack.Screen name="EditProfile" component={ProfileSetup} />
        <Stack.Screen name="AdminPanel" component={AdminPanel} />
      </Stack.Navigator>
    );
  }

  return (
    <SafeAreaProvider>
      <AppContext.Provider value={ctx}>
        <StatusBar style="light" />
        <NavigationContainer theme={theme}>{body}</NavigationContainer>
      </AppContext.Provider>
    </SafeAreaProvider>
  );
}
