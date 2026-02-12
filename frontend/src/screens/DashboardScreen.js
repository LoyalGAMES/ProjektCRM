import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Dimensions,
} from 'react-native';
import { colors, shadows } from '../theme/colors';
import { useGoalStore } from '../store/goalStore';
import { getCountdown, formatDate, getPriorityColor, getStatusColor, getCategoryIcon, getStatusLabel } from '../utils/helpers';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

export default function DashboardScreen({ navigation }) {
  const { goals, stats, fetchGoals, fetchStats, loading } = useGoalStore();
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    await Promise.all([fetchGoals({ status: 'active' }), fetchStats()]);
  }, []);

  useEffect(() => { loadData(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  const activeGoals = goals.filter(g => g.status === 'active');

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Stats Overview */}
      <View style={styles.statsRow}>
        <StatCard title="Aktywne" value={stats?.active || 0} color={colors.primary} />
        <StatCard title="Ukończone" value={stats?.completed || 0} color={colors.success} />
        <StatCard title="Średni postęp" value={`${Math.round(stats?.averageProgress || 0)}%`} color={colors.secondary} />
        <StatCard title="Łącznie" value={stats?.total || 0} color={colors.textSecondary} />
      </View>

      {/* Countdown Widgets */}
      <Text style={styles.sectionTitle}>Odliczanie do celów</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.widgetsScroll}>
        {activeGoals.map(goal => (
          <CountdownWidget
            key={goal.id}
            goal={goal}
            onPress={() => navigation.navigate('Cele', {
              screen: 'GoalDetail',
              params: { goalId: goal.id },
            })}
          />
        ))}
        {activeGoals.length === 0 && (
          <View style={styles.emptyWidget}>
            <Text style={styles.emptyText}>Brak aktywnych celów</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('Cele', { screen: 'GoalForm' })}
            >
              <Text style={styles.addButtonText}>+ Dodaj cel</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Upcoming Deadlines */}
      <Text style={styles.sectionTitle}>Zbliżające się terminy</Text>
      {(stats?.upcomingDeadlines || []).map(goal => (
        <DeadlineCard
          key={goal.id}
          goal={goal}
          onPress={() => navigation.navigate('Cele', {
            screen: 'GoalDetail',
            params: { goalId: goal.id },
          })}
        />
      ))}

      {/* High Risks */}
      {stats?.highRisks?.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Wysokie ryzyka</Text>
          {stats.highRisks.map(risk => (
            <RiskCard key={risk.id} risk={risk} />
          ))}
        </>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function StatCard({ title, value, color }) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );
}

function CountdownWidget({ goal, onPress }) {
  const countdown = getCountdown(goal.target_date);
  const progress = goal.progress || 0;

  return (
    <TouchableOpacity style={styles.countdownWidget} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.widgetHeader}>
        <Text style={styles.widgetCategory}>{getCategoryIcon(goal.category)}</Text>
        <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(goal.priority) }]} />
      </View>
      <Text style={styles.widgetTitle} numberOfLines={2}>{goal.title}</Text>
      <Text style={[styles.countdownText, countdown.isOverdue && styles.countdownOverdue]}>
        {countdown.text}
      </Text>
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: getStatusColor(goal.status) }]} />
      </View>
      <Text style={styles.progressText}>{Math.round(progress)}%</Text>
    </TouchableOpacity>
  );
}

function DeadlineCard({ goal, onPress }) {
  const countdown = getCountdown(goal.target_date);
  return (
    <TouchableOpacity style={styles.deadlineCard} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.deadlineLeft}>
        <Text style={styles.deadlineIcon}>{getCategoryIcon(goal.category)}</Text>
        <View style={styles.deadlineInfo}>
          <Text style={styles.deadlineName} numberOfLines={1}>{goal.title}</Text>
          <Text style={styles.deadlineDate}>{formatDate(goal.target_date)}</Text>
        </View>
      </View>
      <View style={styles.deadlineRight}>
        <Text style={[styles.deadlineCountdown, countdown.isOverdue && styles.countdownOverdue]}>
          {countdown.text}
        </Text>
        <View style={[styles.miniProgress]}>
          <View style={[styles.miniProgressFill, { width: `${goal.progress || 0}%` }]} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

function RiskCard({ risk }) {
  return (
    <View style={[styles.riskCard, { borderLeftColor: colors.danger }]}>
      <Text style={styles.riskTitle}>{risk.title}</Text>
      <Text style={styles.riskGoal}>{risk.goal_title}</Text>
      <View style={styles.riskMeta}>
        <Text style={[styles.riskScore, { color: colors.danger }]}>
          Ryzyko: {Math.round(risk.risk_score * 100)}%
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16 },
  statsRow: {
    flexDirection: 'row', flexWrap: 'wrap',
    marginBottom: 24, gap: 12,
  },
  statCard: {
    flex: 1, minWidth: isTablet ? 160 : 140,
    backgroundColor: colors.card, borderRadius: 16,
    padding: 16, borderLeftWidth: 4,
    ...shadows.card,
  },
  statValue: { fontSize: 28, fontWeight: '800' },
  statTitle: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  sectionTitle: {
    fontSize: 20, fontWeight: '700', color: colors.textPrimary,
    marginBottom: 12, marginTop: 8,
  },
  widgetsScroll: { marginBottom: 24 },
  countdownWidget: {
    width: isTablet ? 220 : 180, backgroundColor: colors.card,
    borderRadius: 20, padding: 16, marginRight: 12,
    ...shadows.card,
  },
  widgetHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  widgetCategory: { fontSize: 24 },
  priorityDot: { width: 10, height: 10, borderRadius: 5 },
  widgetTitle: { fontSize: 15, fontWeight: '600', color: colors.textPrimary, marginBottom: 8, height: 40 },
  countdownText: { fontSize: 24, fontWeight: '800', color: colors.primary, marginBottom: 8 },
  countdownOverdue: { color: colors.danger },
  progressBarBg: { height: 6, backgroundColor: colors.surfaceHighlight, borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },
  progressText: { fontSize: 12, color: colors.textSecondary, marginTop: 4, textAlign: 'right' },
  emptyWidget: {
    width: 200, backgroundColor: colors.card, borderRadius: 20,
    padding: 20, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed',
  },
  emptyText: { fontSize: 14, color: colors.textMuted, marginBottom: 12 },
  addButton: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  addButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  deadlineCard: {
    backgroundColor: colors.card, borderRadius: 16, padding: 16,
    marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', ...shadows.card,
  },
  deadlineLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  deadlineIcon: { fontSize: 28, marginRight: 12 },
  deadlineInfo: { flex: 1 },
  deadlineName: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  deadlineDate: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  deadlineRight: { alignItems: 'flex-end', marginLeft: 12 },
  deadlineCountdown: { fontSize: 16, fontWeight: '700', color: colors.primary },
  miniProgress: { width: 60, height: 4, backgroundColor: colors.surfaceHighlight, borderRadius: 2, marginTop: 4, overflow: 'hidden' },
  miniProgressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 2 },
  riskCard: {
    backgroundColor: colors.card, borderRadius: 12, padding: 14,
    marginBottom: 8, borderLeftWidth: 4, ...shadows.card,
  },
  riskTitle: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  riskGoal: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  riskMeta: { flexDirection: 'row', marginTop: 6 },
  riskScore: { fontSize: 13, fontWeight: '700' },
});
