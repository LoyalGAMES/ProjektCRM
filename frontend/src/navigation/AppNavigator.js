import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

// Screens
import DashboardScreen from '../screens/DashboardScreen';
import GoalsListScreen from '../screens/GoalsListScreen';
import GoalDetailScreen from '../screens/GoalDetailScreen';
import GoalFormScreen from '../screens/GoalFormScreen';
import RiskManagementScreen from '../screens/RiskManagementScreen';
import PlannerScreen from '../screens/PlannerScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function TabIcon({ label, focused }) {
  const icons = {
    'Dashboard': '📊',
    'Cele': '🎯',
    'Planer': '📅',
    'Ryzyka': '⚠️',
    'Ustawienia': '⚙️',
  };
  return (
    <View style={styles.tabIcon}>
      <Text style={[styles.tabEmoji, focused && styles.tabEmojiActive]}>
        {icons[label] || '📋'}
      </Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
    </View>
  );
}

function GoalsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface, shadowColor: 'transparent' },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: { fontWeight: '700' },
        cardStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="GoalsList" component={GoalsListScreen} options={{ title: 'Moje Cele' }} />
      <Stack.Screen name="GoalDetail" component={GoalDetailScreen} options={{ title: 'Szczegóły Celu' }} />
      <Stack.Screen name="GoalForm" component={GoalFormScreen} options={{ title: 'Nowy Cel' }} />
      <Stack.Screen name="RiskDetail" component={RiskManagementScreen} options={{ title: 'Zarządzanie Ryzykiem' }} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface, shadowColor: 'transparent' },
          headerTintColor: colors.textPrimary,
          headerTitleStyle: { fontWeight: '700' },
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            paddingTop: 8,
            paddingBottom: 8,
            height: 80,
          },
          tabBarShowLabel: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
        }}
      >
        <Tab.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{
            title: 'Goal Tracker SMART',
            tabBarIcon: ({ focused }) => <TabIcon label="Dashboard" focused={focused} />,
          }}
        />
        <Tab.Screen
          name="Cele"
          component={GoalsStack}
          options={{
            headerShown: false,
            tabBarIcon: ({ focused }) => <TabIcon label="Cele" focused={focused} />,
          }}
        />
        <Tab.Screen
          name="Planer"
          component={PlannerScreen}
          options={{
            title: 'Planer Celów',
            tabBarIcon: ({ focused }) => <TabIcon label="Planer" focused={focused} />,
          }}
        />
        <Tab.Screen
          name="Ryzyka"
          component={RiskManagementScreen}
          options={{
            title: 'Mapa Ryzyk',
            tabBarIcon: ({ focused }) => <TabIcon label="Ryzyka" focused={focused} />,
          }}
        />
        <Tab.Screen
          name="Ustawienia"
          component={SettingsScreen}
          options={{
            title: 'Ustawienia',
            tabBarIcon: ({ focused }) => <TabIcon label="Ustawienia" focused={focused} />,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabIcon: { alignItems: 'center', justifyContent: 'center' },
  tabEmoji: { fontSize: 22, opacity: 0.5 },
  tabEmojiActive: { opacity: 1 },
  tabLabel: { fontSize: 10, color: colors.textMuted, marginTop: 2 },
  tabLabelActive: { color: colors.primary, fontWeight: '600' },
});
