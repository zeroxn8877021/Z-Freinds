import React from 'react';
import { Image } from 'react-native';
export default function ZLogo({ size = 96 }) {
  return <Image source={require('../assets/icon.png')} style={{ width: size, height: size, borderRadius: size / 2 }} />;
}
