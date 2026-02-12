import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, TextInput, Dimensions,
} from 'react-native';
import { colors, shadows } from '../theme/colors';
import { useGoalStore } from '../store/goalStore';
import {
  getCountdown, formatDate, getPriorityColor, getStatusColor, getStatusLabel,
  getCategoryLabel, getCategoryIcon,
} from '../utils/helpers';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

const FILTERS = [
  { key: null, label: 'Wszystkie' },
  { key: 'active', label: 'Aktywne' },
  { key: 'draft', label: 'Szkice' },
  { key: 'completed', label: 'Ukończone' },
  { key: 'paused', label: 'Wstrzymane' },
];

const SORT_OPTIONS = [
  { key: 'deadline', label: 'Termin' },
  { key: 'priority', label: 'Priorytet' },
  { key: 'progress', label: 'Postęp' },
  { key: 'created', label: 'Data dodania' },
];

export default function GoalsListScreen({ navigation }) {
  const { goals, fetchGoals, loading } = useGoalStore();
  const [filter, setFilter] = useState(null);
  const [sort, setSort] = useState('deadline');
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadGoals = useCallback(async () => {
    await fetchGoals({ status: filter, sort });
  }, [filter, sort]);

  useEffect(() => { loadGoals(); }, [filter, sort]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadGoals);
    return unsubscribe;
  }, [navigation, loadGoals]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadGoals();
    setRefreshing(false);
  }, [loadGoals]);

  const filteredGoals = search
    ? goals.filter(g => g.title.toLowerCase().includes(search.toLowerCase()))
    : goals;

  const renderGoalCard = ({ item: goal }) => {
    const countdown = getCountdown(goal.target_date);
    const smartScore = goal.smart_score || 0;

    return (
      <TouchableOpacity
        style={styles.goalCard}
        onPress={() => navigation.navigate('GoalDetail', { goalId: goal.id })}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text style={styles.categoryIcon}>{getCategoryIcon(goal.category)}</Text>
            <View>
              <Text style={styles.goalTitle} numberOfLines={1}>{goal.title}</Text>
              <Text style={styles.goalCategory}>{getCategoryLabel(goal.category)}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(goal.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(goal.status) }]}>
              {getStatusLabel(goal.status)}
            </Text>
          </View>
        </View>

        {goal.description ? (
          <Text style={styles.goalDesc} numberOfLines={2}>{goal.description}</Text>
        ) : null}

        {/* Progress Bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, {
              width: `${goal.progress || 0}%`,
              backgroundColor: getStatusColor(goal.status),
            }]} />
          </View>
          <Text style={styles.progressText}>{Math.round(goal.progress || 0)}%</Text>
        </View>

        {/* Meta Row */}
        <View style={styles.metaRow}>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(goal.priority) + '20' }]}>
            <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(goal.priority) }]} />
            <Text style={[styles.priorityText, { color: getPriorityColor(goal.priority) }]}>
              {goal.priority}
            </Text>
          </View>

          <Text style={[styles.countdown, countdown.isOverdue && styles.countdownOverdue]}>
            {countdown.text}
          </Text>

          {/* SMART Score Mini */}
          <View style={styles.smartMini}>
            {['S', 'M', 'A', 'R', 'T'].map((letter, i) => (
              <View key={letter} style={[
                styles.smartDot,
                { backgroundColor: i < smartScore * 5 ? colors.primary : colors.surfaceHighlight },
              ]}>
                <Text style={styles.smartDotText}>{letter}</Text>
              </View>
            ))}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Szukaj celów..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Filter Chips */}
      <ScrollRow>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.key || 'all'}
            style={[styles.chip, filter === f.key && styles.chipActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.chipText, filter === f.key && styles.chipTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollRow>

      {/* Sort Row */}
      <ScrollRow>
        {SORT_OPTIONS.map(s => (
          <TouchableOpacity
            key={s.key}
            style={[styles.sortChip, sort === s.key && styles.sortChipActive]}
            onPress={() => setSort(s.key)}
          >
            <Text style={[styles.sortText, sort === s.key && styles.sortTextActive]}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollRow>

      {/* Goals List */}
      <FlatList
        data={filteredGoals}
        renderItem={renderGoalCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        numColumns={isTablet ? 2 : 1}
        key={isTablet ? 'tablet' : 'phone'}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🎯</Text>
            <Text style={styles.emptyTitle}>Brak celów</Text>
            <Text style={styles.emptySubtitle}>Dodaj swój pierwszy cel SMART</Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('GoalForm')}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

function ScrollRow({ children }) {
  const { ScrollView } = require('react-native');
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollRow}>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchBar: { paddingHorizontal: 16, paddingTop: 8 },
  searchInput: {
    backgroundColor: colors.card, borderRadius: 12, paddingHorizontal: 16,
    paddingVertical: 12, color: colors.textPrimary, fontSize: 15,
    borderWidth: 1, borderColor: colors.border,
  },
  scrollRow: { paddingHorizontal: 12, paddingVertical: 8 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: colors.card, marginHorizontal: 4, borderWidth: 1, borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, color: colors.textSecondary },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  sortChip: { paddingHorizontal: 12, paddingVertical: 6, marginHorizontal: 4 },
  sortChipActive: { borderBottomWidth: 2, borderBottomColor: colors.primary },
  sortText: { fontSize: 12, color: colors.textMuted },
  sortTextActive: { color: colors.primary, fontWeight: '600' },
  list: { padding: 12 },
  goalCard: {
    flex: 1, backgroundColor: colors.card, borderRadius: 16, padding: 16,
    margin: 4, ...shadows.card, maxWidth: isTablet ? '48%' : '100%',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  categoryIcon: { fontSize: 28, marginRight: 10 },
  goalTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, maxWidth: '80%' },
  goalCategory: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '600' },
  goalDesc: { fontSize: 13, color: colors.textSecondary, marginBottom: 10, lineHeight: 18 },
  progressSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  progressBarBg: { flex: 1, height: 6, backgroundColor: colors.surfaceHighlight, borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },
  progressText: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, marginLeft: 10, width: 40, textAlign: 'right' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priorityBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  priorityDot: { width: 6, height: 6, borderRadius: 3, marginRight: 4 },
  priorityText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  countdown: { fontSize: 14, fontWeight: '700', color: colors.primary },
  countdownOverdue: { color: colors.danger },
  smartMini: { flexDirection: 'row', gap: 2 },
  smartDot: { width: 18, height: 18, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  smartDotText: { fontSize: 9, fontWeight: '700', color: colors.textPrimary },
  empty: { alignItems: 'center', padding: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  emptySubtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    ...shadows.button,
  },
  fabText: { fontSize: 28, fontWeight: '300', color: '#fff', lineHeight: 30 },
});
