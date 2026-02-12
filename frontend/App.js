import React, { useEffect } from 'react';
import { StatusBar, LogBox } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { loadApiBaseUrl } from './src/services/api';

LogBox.ignoreLogs(['Non-serializable values']);

export default function App() {
  useEffect(() => {
    loadApiBaseUrl();
  }, []);

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#0A0E1A" />
      <AppNavigator />
    </>
  );
}
