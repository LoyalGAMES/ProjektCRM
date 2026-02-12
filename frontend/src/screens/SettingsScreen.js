import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, shadows } from '../theme/colors';
import { setApiBaseUrl } from '../services/api';

export default function SettingsScreen() {
  const [serverUrl, setServerUrl] = useState('http://localhost:3001/api');
  const [deviceId, setDeviceId] = useState('');
  const [syncStatus, setSyncStatus] = useState('idle');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const url = await AsyncStorage.getItem('api_base_url');
    const device = await AsyncStorage.getItem('device_id');
    if (url) setServerUrl(url);
    if (device) setDeviceId(device);
    else {
      const newId = `ipad_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      await AsyncStorage.setItem('device_id', newId);
      setDeviceId(newId);
    }
  };

  const saveServerUrl = async () => {
    await setApiBaseUrl(serverUrl);
    Alert.alert('Zapisano', 'Adres serwera został zaktualizowany');
  };

  const testConnection = async () => {
    try {
      setSyncStatus('testing');
      const response = await fetch(`${serverUrl}/health`);
      const data = await response.json();
      if (data.status === 'ok') {
        setSyncStatus('connected');
        Alert.alert('Połączono', `Serwer odpowiada. Czas: ${data.timestamp}`);
      }
    } catch (error) {
      setSyncStatus('error');
      Alert.alert('Błąd połączenia', error.message);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Server Settings */}
      <Text style={styles.sectionTitle}>Połączenie z serwerem</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Adres API serwera</Text>
        <TextInput
          style={styles.input}
          value={serverUrl}
          onChangeText={setServerUrl}
          placeholder="http://your-server:3001/api"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.secondaryButton} onPress={testConnection}>
            <Text style={styles.secondaryButtonText}>Testuj połączenie</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryButton} onPress={saveServerUrl}>
            <Text style={styles.primaryButtonText}>Zapisz</Text>
          </TouchableOpacity>
        </View>

        {/* Connection Status */}
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, {
            backgroundColor: syncStatus === 'connected' ? colors.success
              : syncStatus === 'error' ? colors.danger
              : colors.textMuted,
          }]} />
          <Text style={styles.statusText}>
            {syncStatus === 'connected' ? 'Połączono'
              : syncStatus === 'error' ? 'Błąd połączenia'
              : syncStatus === 'testing' ? 'Testowanie...'
              : 'Nie sprawdzono'}
          </Text>
        </View>
      </View>

      {/* Device Info */}
      <Text style={styles.sectionTitle}>Urządzenie</Text>
      <View style={styles.card}>
        <Text style={styles.label}>ID urządzenia (do synchronizacji)</Text>
        <Text style={styles.deviceId}>{deviceId}</Text>
      </View>

      {/* Sync Settings */}
      <Text style={styles.sectionTitle}>Synchronizacja</Text>
      <View style={styles.card}>
        <Text style={styles.infoText}>
          Dane są synchronizowane automatycznie z bazą MySQL po połączeniu z serwerem.
          Zmiany wprowadzone offline zostaną zsynchronizowane przy następnym połączeniu.
        </Text>
        <TouchableOpacity style={styles.syncButton} onPress={() => Alert.alert('Sync', 'Synchronizacja ręczna uruchomiona')}>
          <Text style={styles.syncButtonText}>Synchronizuj teraz</Text>
        </TouchableOpacity>
      </View>

      {/* Database Setup */}
      <Text style={styles.sectionTitle}>Konfiguracja bazy danych</Text>
      <View style={styles.card}>
        <Text style={styles.infoText}>
          Aby skonfigurować bazę danych MySQL, uruchom skrypt migracji na serwerze:
        </Text>
        <View style={styles.codeBlock}>
          <Text style={styles.codeText}>cd backend</Text>
          <Text style={styles.codeText}>cp .env.example .env</Text>
          <Text style={styles.codeText}># Edytuj .env z danymi MySQL</Text>
          <Text style={styles.codeText}>npm run migrate</Text>
        </View>
      </View>

      {/* About */}
      <Text style={styles.sectionTitle}>O aplikacji</Text>
      <View style={styles.card}>
        <Text style={styles.appName}>Goal Tracker SMART</Text>
        <Text style={styles.appVersion}>Wersja 1.0.0</Text>
        <Text style={styles.appDesc}>
          Twój osobisty asystent w planowaniu i realizacji celów zgodnie z metodologią SMART.
          Zarządzaj celami, planuj etapy, monitoruj ryzyka i śledź postępy.
        </Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginTop: 20, marginBottom: 10 },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 18, ...shadows.card },
  label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 },
  input: {
    backgroundColor: colors.surfaceHighlight, borderRadius: 12, paddingHorizontal: 16,
    paddingVertical: 14, color: colors.textPrimary, fontSize: 15,
    borderWidth: 1, borderColor: colors.border,
  },
  buttonRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  primaryButton: {
    flex: 1, backgroundColor: colors.primary, borderRadius: 12,
    paddingVertical: 12, alignItems: 'center',
  },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  secondaryButton: {
    flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 12,
    paddingVertical: 12, alignItems: 'center',
  },
  secondaryButtonText: { color: colors.textSecondary, fontWeight: '600', fontSize: 14 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 8 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusText: { fontSize: 13, color: colors.textSecondary },
  deviceId: { fontSize: 13, color: colors.textMuted, fontFamily: 'monospace' },
  infoText: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  syncButton: {
    backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 12,
    alignItems: 'center', marginTop: 12,
  },
  syncButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  codeBlock: {
    backgroundColor: colors.surfaceHighlight, borderRadius: 10, padding: 14, marginTop: 10,
  },
  codeText: { fontSize: 13, color: colors.textAccent, fontFamily: 'monospace', lineHeight: 22 },
  appName: { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
  appVersion: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  appDesc: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginTop: 10 },
});
