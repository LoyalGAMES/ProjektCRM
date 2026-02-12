import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Dimensions,
} from 'react-native';
import { colors, shadows } from '../theme/colors';
import { useGoalStore } from '../store/goalStore';
import {
  getCountdown, formatDate, getPriorityColor, getStatusColor, getStatusLabel,
  getCategoryLabel, getCategoryIcon, getSmartLabel, getRiskColor,
} from '../utils/helpers';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

export default function GoalDetailScreen({ route, navigation }) {
  const { goalId } = route.params;
  const { currentGoal, fetchGoalDetails, updateGoal, updateMilestone, updateTask, loading } = useGoalStore();
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => { fetchGoalDetails(goalId); }, [goalId]);

  const goal = currentGoal;
  if (!goal) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Wczytywanie...</Text>
      </View>
    );
  }

  const countdown = getCountdown(goal.target_date);
  const TABS = [
    { key: 'overview', label: 'Przegląd' },
    { key: 'smart', label: 'SMART' },
    { key: 'milestones', label: 'Kamienie milowe' },
    { key: 'tasks', label: 'Zadania' },
    { key: 'risks', label: 'Ryzyka' },
    { key: 'progress', label: 'Postęp' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Hero */}
      <View style={[styles.heroCard, { borderLeftColor: goal.color || colors.primary }]}>
        <View style={styles.heroHeader}>
          <Text style={styles.heroIcon}>{getCategoryIcon(goal.category)}</Text>
          <View style={styles.heroInfo}>
            <Text style={styles.heroTitle}>{goal.title}</Text>
            <Text style={styles.heroCategory}>{getCategoryLabel(goal.category)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(goal.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(goal.status) }]}>
              {getStatusLabel(goal.status)}
            </Text>
          </View>
        </View>

        {goal.description ? <Text style={styles.heroDesc}>{goal.description}</Text> : null}

        {/* Countdown */}
        <View style={styles.countdownSection}>
          <Text style={[styles.countdownBig, countdown.isOverdue && { color: colors.danger }]}>
            {countdown.text}
          </Text>
          <Text style={styles.countdownLabel}>do terminu ({formatDate(goal.target_date)})</Text>
        </View>

        {/* Progress */}
        <View style={styles.progressSection}>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, {
              width: `${goal.progress || 0}%`,
              backgroundColor: getStatusColor(goal.status),
            }]} />
          </View>
          <Text style={styles.progressValue}>{Math.round(goal.progress || 0)}%</Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          {goal.status === 'draft' && (
            <ActionButton label="Aktywuj" color={colors.primary}
              onPress={() => updateGoal(goal.id, { status: 'active' })} />
          )}
          {goal.status === 'active' && (
            <>
              <ActionButton label="Wstrzymaj" color={colors.warning}
                onPress={() => updateGoal(goal.id, { status: 'paused' })} />
              <ActionButton label="Ukończ" color={colors.success}
                onPress={() => updateGoal(goal.id, { status: 'completed', progress: 100, completed_date: new Date().toISOString().split('T')[0] })} />
            </>
          )}
          {goal.status === 'paused' && (
            <ActionButton label="Wznów" color={colors.primary}
              onPress={() => updateGoal(goal.id, { status: 'active' })} />
          )}
          <ActionButton label="Edytuj" color={colors.textSecondary}
            onPress={() => navigation.navigate('GoalForm', { goalId: goal.id })} />
        </View>
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Tab Content */}
      {activeTab === 'overview' && <OverviewTab goal={goal} />}
      {activeTab === 'smart' && <SmartTab goal={goal} />}
      {activeTab === 'milestones' && <MilestonesTab goal={goal} updateMilestone={updateMilestone} />}
      {activeTab === 'tasks' && <TasksTab goal={goal} updateTask={updateTask} />}
      {activeTab === 'risks' && <RisksTab goal={goal} navigation={navigation} />}
      {activeTab === 'progress' && <ProgressTab goal={goal} />}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function ActionButton({ label, color, onPress }) {
  return (
    <TouchableOpacity style={[styles.actionBtn, { borderColor: color }]} onPress={onPress}>
      <Text style={[styles.actionBtnText, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function OverviewTab({ goal }) {
  const smartScore = goal.smart_score || 0;
  const milestonesDone = (goal.milestones || []).filter(m => m.is_completed).length;
  const tasksDone = (goal.tasks || []).filter(t => t.status === 'done').length;
  const highRisks = (goal.risks || []).filter(r => r.risk_score >= 0.6).length;

  return (
    <View style={styles.tabContent}>
      <View style={isTablet ? styles.overviewGrid : null}>
        <InfoCard title="SMART Score" value={`${Math.round(smartScore * 100)}%`} color={smartScore >= 0.8 ? colors.success : smartScore >= 0.6 ? colors.warning : colors.danger} />
        <InfoCard title="Kamienie milowe" value={`${milestonesDone}/${(goal.milestones || []).length}`} color={colors.primary} />
        <InfoCard title="Zadania" value={`${tasksDone}/${(goal.tasks || []).length}`} color={colors.secondary} />
        <InfoCard title="Wysokie ryzyka" value={highRisks} color={highRisks > 0 ? colors.danger : colors.success} />
      </View>
      {(goal.subGoals || []).length > 0 && (
        <>
          <Text style={styles.subTitle}>Podcele</Text>
          {goal.subGoals.map(sub => (
            <View key={sub.id} style={styles.subGoalCard}>
              <Text style={styles.subGoalTitle}>{sub.title}</Text>
              <View style={styles.miniProgress}>
                <View style={[styles.miniProgressFill, { width: `${sub.progress || 0}%` }]} />
              </View>
            </View>
          ))}
        </>
      )}
    </View>
  );
}

function SmartTab({ goal }) {
  const fields = ['smart_specific', 'smart_measurable', 'smart_achievable', 'smart_relevant', 'smart_time_bound'];

  return (
    <View style={styles.tabContent}>
      {fields.map(field => {
        const info = getSmartLabel(field);
        const value = goal[field];
        const isFilled = value && value.trim().length > 10;

        return (
          <View key={field} style={[styles.smartCard, isFilled && styles.smartCardFilled]}>
            <View style={styles.smartCardHeader}>
              <View style={[styles.smartLetter, { backgroundColor: isFilled ? colors.primary : colors.surfaceHighlight }]}>
                <Text style={styles.smartLetterText}>{info.letter}</Text>
              </View>
              <View>
                <Text style={styles.smartFieldTitle}>{info.label}</Text>
                <Text style={styles.smartFieldSubtitle}>{info.pl}</Text>
              </View>
            </View>
            <Text style={styles.smartValue}>
              {value || 'Nie zdefiniowano - uzupełnij, aby poprawić jakość celu'}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function MilestonesTab({ goal, updateMilestone }) {
  const milestones = goal.milestones || [];

  return (
    <View style={styles.tabContent}>
      {milestones.length === 0 ? (
        <Text style={styles.emptyTabText}>Brak kamieni milowych. Dodaj pierwszy!</Text>
      ) : null}
      {milestones.map((m, idx) => (
        <TouchableOpacity
          key={m.id}
          style={[styles.milestoneCard, m.is_completed && styles.milestoneCompleted]}
          onPress={() => updateMilestone(m.id, { is_completed: !m.is_completed })}
        >
          <View style={[styles.milestoneCheck, m.is_completed && styles.milestoneCheckDone]}>
            {m.is_completed && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <View style={styles.milestoneInfo}>
            <Text style={[styles.milestoneName, m.is_completed && styles.milestoneNameDone]}>
              {m.title}
            </Text>
            {m.target_date && (
              <Text style={styles.milestoneDate}>{formatDate(m.target_date)}</Text>
            )}
          </View>
          <View style={styles.milestoneTimeline}>
            <View style={[styles.timelineDot, m.is_completed && styles.timelineDotDone]} />
            {idx < milestones.length - 1 && <View style={styles.timelineLine} />}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function TasksTab({ goal, updateTask }) {
  const tasks = goal.tasks || [];
  const grouped = {
    todo: tasks.filter(t => t.status === 'todo'),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    done: tasks.filter(t => t.status === 'done'),
  };

  return (
    <View style={styles.tabContent}>
      {['todo', 'in_progress', 'done'].map(status => (
        <View key={status}>
          <Text style={styles.taskGroupTitle}>
            {getStatusLabel(status)} ({grouped[status].length})
          </Text>
          {grouped[status].map(task => (
            <TouchableOpacity
              key={task.id}
              style={styles.taskCard}
              onPress={() => {
                const nextStatus = task.status === 'todo' ? 'in_progress' : task.status === 'in_progress' ? 'done' : 'todo';
                updateTask(task.id, { status: nextStatus });
              }}
            >
              <View style={[styles.taskStatus, { backgroundColor: getStatusColor(task.status) }]} />
              <View style={styles.taskInfo}>
                <Text style={[styles.taskTitle, task.status === 'done' && styles.taskDone]}>
                  {task.title}
                </Text>
                {task.due_date && <Text style={styles.taskDate}>{formatDate(task.due_date)}</Text>}
              </View>
              <View style={[styles.taskPriority, { backgroundColor: getPriorityColor(task.priority) + '20' }]}>
                <Text style={[styles.taskPriorityText, { color: getPriorityColor(task.priority) }]}>
                  {task.priority}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </View>
  );
}

function RisksTab({ goal, navigation }) {
  const risks = goal.risks || [];

  return (
    <View style={styles.tabContent}>
      {risks.length === 0 ? (
        <Text style={styles.emptyTabText}>Brak zidentyfikowanych ryzyk.</Text>
      ) : null}
      {risks.map(risk => (
        <View key={risk.id} style={[styles.riskCard, { borderLeftColor: getRiskColor(risk.risk_score) }]}>
          <View style={styles.riskHeader}>
            <Text style={styles.riskTitle}>{risk.title}</Text>
            <View style={[styles.riskScoreBadge, { backgroundColor: getRiskColor(risk.risk_score) + '20' }]}>
              <Text style={[styles.riskScoreText, { color: getRiskColor(risk.risk_score) }]}>
                {Math.round(risk.risk_score * 100)}%
              </Text>
            </View>
          </View>
          {risk.description && <Text style={styles.riskDesc}>{risk.description}</Text>}
          <View style={styles.riskMeta}>
            <Text style={styles.riskMetaText}>P: {risk.probability} | I: {risk.impact}</Text>
            <Text style={[styles.riskStatus, { color: getStatusColor(risk.status) }]}>
              {risk.status}
            </Text>
          </View>
          {risk.mitigation_plan && (
            <View style={styles.riskMitigation}>
              <Text style={styles.riskMitigationLabel}>Plan mitygacji:</Text>
              <Text style={styles.riskMitigationText}>{risk.mitigation_plan}</Text>
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

function ProgressTab({ goal }) {
  const logs = goal.progressLogs || [];

  return (
    <View style={styles.tabContent}>
      {logs.length === 0 ? (
        <Text style={styles.emptyTabText}>Brak wpisów postępu. Zacznij rejestrować!</Text>
      ) : null}
      {logs.map(log => (
        <View key={log.id} style={styles.progressCard}>
          <View style={styles.progressCardHeader}>
            <Text style={styles.progressDate}>{formatDate(log.date)}</Text>
            <Text style={styles.progressPercent}>{Math.round(log.progress_value)}%</Text>
          </View>
          {log.notes && <Text style={styles.progressNotes}>{log.notes}</Text>}
          {log.achievements && (
            <Text style={styles.progressAchievement}>Osiągnięcia: {log.achievements}</Text>
          )}
          {log.obstacles && (
            <Text style={styles.progressObstacle}>Przeszkody: {log.obstacles}</Text>
          )}
        </View>
      ))}
    </View>
  );
}

function InfoCard({ title, value, color }) {
  return (
    <View style={styles.infoCard}>
      <Text style={[styles.infoValue, { color }]}>{value}</Text>
      <Text style={styles.infoTitle}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  loadingText: { color: colors.textSecondary },
  // Hero
  heroCard: {
    backgroundColor: colors.card, borderRadius: 20, padding: 20,
    borderLeftWidth: 5, ...shadows.card, marginBottom: 16,
  },
  heroHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  heroIcon: { fontSize: 36, marginRight: 12 },
  heroInfo: { flex: 1 },
  heroTitle: { fontSize: 22, fontWeight: '800', color: colors.textPrimary },
  heroCategory: { fontSize: 13, color: colors.textSecondary },
  heroDesc: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginBottom: 16 },
  countdownSection: { alignItems: 'center', marginBottom: 16 },
  countdownBig: { fontSize: 36, fontWeight: '900', color: colors.primary },
  countdownLabel: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  progressSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  progressBarBg: { flex: 1, height: 10, backgroundColor: colors.surfaceHighlight, borderRadius: 5, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 5 },
  progressValue: { fontSize: 18, fontWeight: '800', color: colors.textPrimary, marginLeft: 12 },
  quickActions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  actionBtn: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8 },
  actionBtnText: { fontWeight: '600', fontSize: 13 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '600' },
  // Tabs
  tabsScroll: { marginBottom: 16 },
  tab: { paddingHorizontal: 16, paddingVertical: 10, marginRight: 4 },
  tabActive: { borderBottomWidth: 3, borderBottomColor: colors.primary },
  tabText: { fontSize: 14, color: colors.textMuted, fontWeight: '500' },
  tabTextActive: { color: colors.primary, fontWeight: '700' },
  tabContent: {},
  // Overview
  overviewGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  infoCard: {
    flex: 1, minWidth: 140, backgroundColor: colors.card, borderRadius: 16,
    padding: 16, ...shadows.card, marginBottom: 12,
  },
  infoValue: { fontSize: 24, fontWeight: '800' },
  infoTitle: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  subTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginTop: 16, marginBottom: 8 },
  subGoalCard: { backgroundColor: colors.card, borderRadius: 12, padding: 12, marginBottom: 6 },
  subGoalTitle: { fontSize: 14, color: colors.textPrimary, marginBottom: 6 },
  miniProgress: { height: 4, backgroundColor: colors.surfaceHighlight, borderRadius: 2, overflow: 'hidden' },
  miniProgressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 2 },
  // SMART
  smartCard: {
    backgroundColor: colors.card, borderRadius: 16, padding: 16,
    marginBottom: 10, borderWidth: 1, borderColor: colors.border,
  },
  smartCardFilled: { borderColor: colors.primary + '40' },
  smartCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  smartLetter: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  smartLetterText: { fontSize: 18, fontWeight: '900', color: '#fff' },
  smartFieldTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  smartFieldSubtitle: { fontSize: 12, color: colors.textSecondary },
  smartValue: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  // Milestones
  milestoneCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card,
    borderRadius: 12, padding: 14, marginBottom: 6,
  },
  milestoneCompleted: { opacity: 0.7 },
  milestoneCheck: {
    width: 28, height: 28, borderRadius: 14, borderWidth: 2,
    borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  milestoneCheckDone: { backgroundColor: colors.success, borderColor: colors.success },
  checkmark: { color: '#fff', fontWeight: '700', fontSize: 14 },
  milestoneInfo: { flex: 1 },
  milestoneName: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  milestoneNameDone: { textDecorationLine: 'line-through', color: colors.textMuted },
  milestoneDate: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  milestoneTimeline: { alignItems: 'center', width: 20 },
  timelineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.border },
  timelineDotDone: { backgroundColor: colors.success },
  timelineLine: { width: 2, height: 30, backgroundColor: colors.border, marginTop: 2 },
  // Tasks
  taskGroupTitle: { fontSize: 14, fontWeight: '700', color: colors.textSecondary, marginTop: 12, marginBottom: 6 },
  taskCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card,
    borderRadius: 10, padding: 12, marginBottom: 4,
  },
  taskStatus: { width: 4, height: '100%', borderRadius: 2, marginRight: 12, minHeight: 30 },
  taskInfo: { flex: 1 },
  taskTitle: { fontSize: 14, color: colors.textPrimary },
  taskDone: { textDecorationLine: 'line-through', color: colors.textMuted },
  taskDate: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  taskPriority: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  taskPriorityText: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase' },
  // Risks
  riskCard: {
    backgroundColor: colors.card, borderRadius: 12, padding: 14, marginBottom: 8,
    borderLeftWidth: 4, ...shadows.card,
  },
  riskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  riskTitle: { fontSize: 15, fontWeight: '600', color: colors.textPrimary, flex: 1 },
  riskScoreBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  riskScoreText: { fontSize: 13, fontWeight: '700' },
  riskDesc: { fontSize: 13, color: colors.textSecondary, marginBottom: 8 },
  riskMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  riskMetaText: { fontSize: 11, color: colors.textMuted },
  riskStatus: { fontSize: 11, fontWeight: '600' },
  riskMitigation: { marginTop: 8, padding: 10, backgroundColor: colors.surfaceHighlight, borderRadius: 8 },
  riskMitigationLabel: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, marginBottom: 4 },
  riskMitigationText: { fontSize: 13, color: colors.textPrimary, lineHeight: 18 },
  // Progress
  progressCard: { backgroundColor: colors.card, borderRadius: 12, padding: 14, marginBottom: 8 },
  progressCardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressDate: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  progressPercent: { fontSize: 15, fontWeight: '700', color: colors.primary },
  progressNotes: { fontSize: 14, color: colors.textPrimary, lineHeight: 20 },
  progressAchievement: { fontSize: 12, color: colors.success, marginTop: 4 },
  progressObstacle: { fontSize: 12, color: colors.warning, marginTop: 2 },
  emptyTabText: { fontSize: 14, color: colors.textMuted, textAlign: 'center', padding: 30 },
});
