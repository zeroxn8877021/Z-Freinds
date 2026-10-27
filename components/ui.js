import React, { useRef } from 'react';
import { View, Text, TextInput, Pressable, Animated, Image, ActivityIndicator, Modal, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../lib/theme';
import { flag } from '../lib/countries';

export function Screen({ children, style, edges = ['top'] }) {
  return <SafeAreaView edges={edges} style={[{ flex: 1, backgroundColor: C.bg }, style]}>{children}</SafeAreaView>;
}

export function Press({ children, style, onPress, disabled, ...rest }) {
  const s = useRef(new Animated.Value(1)).current;
  const to = (v) => Animated.spring(s, { toValue: v, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
  return (
    <Pressable disabled={disabled} onPressIn={() => to(0.96)} onPressOut={() => to(1)} onPress={onPress} {...rest}>
      <Animated.View style={[style, { transform: [{ scale: s }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

export function Btn({ title, onPress, loading, soft, danger, style, icon, disabled }) {
  const bg = danger ? C.danger : soft ? C.card : C.accentDeep;
  return (
    <Press onPress={onPress} disabled={loading || disabled}
      style={[{ backgroundColor: bg, borderRadius: 18, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', opacity: disabled ? 0.5 : 1 }, style]}>
      {loading ? <ActivityIndicator color="#fff" /> : (
        <>
          {icon ? <Ionicons name={icon} size={18} color={soft ? C.accent : '#fff'} style={{ marginRight: 8 }} /> : null}
          <Text style={{ color: soft ? C.accent : '#fff', fontSize: 16, fontWeight: '600' }}>{title}</Text>
        </>
      )}
    </Press>
  );
}

export function Input(props) {
  return (
    <TextInput placeholderTextColor={C.sub} {...props}
      style={[{ backgroundColor: C.card, color: C.text, borderRadius: 16, paddingHorizontal: 18, paddingVertical: 14, fontSize: 16 }, props.style]} />
  );
}

export function Avatar({ uri, name = '?', size = 56, country, style }) {
  return (
    <View style={[{ width: size, height: size }, style]}>
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: C.card }} />
      ) : (
        <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: C.accent, fontSize: size * 0.4, fontWeight: '700' }}>{(name[0] || '?').toUpperCase()}</Text>
        </View>
      )}
      {country ? (
        <View style={{ position: 'absolute', right: -2, top: -2, backgroundColor: C.bg, borderRadius: 12, padding: 1 }}>
          <Text style={{ fontSize: Math.max(12, size * 0.28) }}>{flag(country)}</Text>
        </View>
      ) : null}
    </View>
  );
}

export function TopBar({ title, onBack, right, big }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, minHeight: 64 }}>
      {onBack ? (
        <Pressable onPress={onBack} hitSlop={12} style={{ marginRight: 14 }}><Ionicons name="chevron-back" size={28} color={C.text} /></Pressable>
      ) : null}
      <Text style={{ color: C.text, fontSize: big ? 30 : 22, fontWeight: '700', flex: 1 }} numberOfLines={1}>{title}</Text>
      {right}
    </View>
  );
}

export function Chip({ label, active, onPress }) {
  return (
    <Press onPress={onPress} style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: active ? C.accentDeep : C.card, marginRight: 8, marginBottom: 8 }}>
      <Text style={{ color: active ? '#fff' : C.sub, fontWeight: '600' }}>{label}</Text>
    </Press>
  );
}

export function Segmented({ items, value, onChange }) {
  return (
    <View style={{ flexDirection: 'row', backgroundColor: C.card, borderRadius: 20, padding: 5, marginHorizontal: 20 }}>
      {items.map(([k, label]) => (
        <Pressable key={k} onPress={() => onChange(k)} style={{ flex: 1, paddingVertical: 12, borderRadius: 16, alignItems: 'center', backgroundColor: value === k ? C.cardDeep : 'transparent' }}>
          <Text style={{ color: value === k ? C.accent : C.sub, fontWeight: '600' }}>{label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function ProgressBar({ value, label }) {
  return (
    <View style={{ marginVertical: 10 }}>
      {label ? <Text style={{ color: C.sub, marginBottom: 6 }}>{label} {Math.round(value * 100)}%</Text> : null}
      <View style={{ height: 8, borderRadius: 4, backgroundColor: C.card, overflow: 'hidden' }}>
        <View style={{ height: 8, width: `${Math.max(2, value * 100)}%`, backgroundColor: C.accent, borderRadius: 4 }} />
      </View>
    </View>
  );
}

export function Empty({ text }) {
  return <Text style={{ color: C.sub, textAlign: 'center', marginTop: 60, paddingHorizontal: 30, fontSize: 15 }}>{text}</Text>;
}

export function SelectModal({ visible, title, options, selected, multi, onClose, onChange }) {
  const isSel = (v) => (multi ? (selected || []).includes(v) : selected === v);
  const press = (v) => {
    if (multi) { const cur = selected || []; onChange(cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]); }
    else { onChange(v); onClose(); }
  };
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#000A', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: C.cardDeep, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '75%', paddingBottom: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 20 }}>
            <Text style={{ color: C.text, fontSize: 20, fontWeight: '700', flex: 1 }}>{title}</Text>
            <Pressable onPress={onClose}><Text style={{ color: C.accent, fontWeight: '700', fontSize: 16 }}>Done</Text></Pressable>
          </View>
          <FlatList data={options} keyExtractor={(o) => o.value}
            renderItem={({ item }) => (
              <Pressable onPress={() => press(item.value)} style={{ flexDirection: 'row', paddingHorizontal: 22, paddingVertical: 15, alignItems: 'center' }}>
                <Text style={{ color: C.text, fontSize: 16, flex: 1 }}>{item.label}</Text>
                {isSel(item.value) ? <Ionicons name="checkmark-circle" size={22} color={C.accent} /> : null}
              </Pressable>
            )} />
        </View>
      </View>
    </Modal>
  );
}

export const S = StyleSheet.create({
  pad: { paddingHorizontal: 20 },
  h2: { color: C.text, fontSize: 20, fontWeight: '700' },
  sub: { color: C.sub, fontSize: 14 },
});
