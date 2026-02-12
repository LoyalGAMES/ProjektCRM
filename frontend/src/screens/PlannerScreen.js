import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions,
} from 'react-native';
import { colors, shadows } from '../theme/colors';
import { useGoalStore } from '../store/goalStore';
import {
  getCountdown, formatDate, formatShortDate, getPriorityColor, getStatusColor,
  getCategoryIcon, getStatusLabel,
} from '../utils/helpers';
import { format, parseISO, differenceInDays, addDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { pl } from 'date-fns/locale';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

export default function PlannerScreen({ navigation }) {
  const { goals, fetchGoals } = useGoalStore();
  const [viewMode, setViewMode] = useState('timeline'); // timeline, calendar, kanban
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => { fetchGoals(); }, []);

  const activeGoals = goals.filter(g => g.status === 'active' || g.status === 'draft');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* View Mode Switcher */}
      <View style={styles.viewSwitch}>
        {[
          { key: 'timeline', label: 'Oś czasu' },
          { key: 'calendar', label: 'Kalendarz' },
          { key: 'kanban', label: 'Kanban' },
        ].map(mode => (
          <TouchableOpacity
            key={mode.key}
            style={[styles.viewTab, viewMode === mode.key && styles.viewTabActive]}
            onPress={() => setViewMode(mode.key)}
          >
            <Text style={[styles.viewTabText, viewMode === mode.key && styles.viewTabTextActive]}>
              {mode.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {viewMode === 'timeline' && <TimelineView goals={activeGoals} navigation={navigation} />}
      {viewMode === 'calendar' && (
        <CalendarView
          goals={activeGoals}
          currentMonth={currentMonth}
          onChangeMonth={setCurrentMonth}
          navigation={navigation}
        />
      )}
      {viewMode === 'kanban' && <KanbanView goals={goals} navigation={navigation} />}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function TimelineView({ goals, navigation }) {
  const sortedGoals = [...goals].sort((a, b) => {
    const dateA = a.target_date ? new Date(a.target_date) : new Date('2099-01-01');
    const dateB = b.target_date ? new Date(b.target_date) : new Date('2099-01-01');
    return dateA - dateB;
  });

  const now = new Date();

  return (
    <View style={styles.timelineContainer}>
      {/* Today marker */}
      <View style={styles.todayMarker}>
        <View style={styles.todayDot} />
        <Text style={styles.todayText}>Dzisiaj - {format(now, 'dd MMMM yyyy', { locale: pl })}</Text>
        <View style={styles.todayLine} />
      </View>

      {sortedGoals.map((goal, index) => {
        const countdown = getCountdown(goal.target_date);
        const totalDays = goal.start_date
          ? differenceInDays(parseISO(goal.target_date), parseISO(goal.start_date))
          : 90;
        const elapsedDays = goal.start_date
          ? differenceInDays(now, parseISO(goal.start_date))
          : 0;
        const timeProgress = totalDays > 0 ? Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100)) : 0;

        return (
          <TouchableOpacity
            key={goal.id}
            style={styles.timelineCard}
            onPress={() => navigation.navigate('Cele', {
              screen: 'GoalDetail',
              params: { goalId: goal.id },
            })}
            activeOpacity={0.7}
          >
            <View style={styles.timelineLeft}>
              <View style={[styles.timelineDot, { backgroundColor: goal.color || colors.primary }]} />
              {index < sortedGoals.length - 1 && <View style={styles.timelineLine} />}
            </View>

            <View style={styles.timelineContent}>
              <View style={styles.timelineHeader}>
                <Text style={styles.timelineIcon}>{getCategoryIcon(goal.category)}</Text>
                <View style={styles.timelineGoalInfo}>
                  <Text style={styles.timelineTitle} numberOfLines={1}>{goal.title}</Text>
                  <Text style={styles.timelineDate}>
                    {goal.start_date ? formatShortDate(goal.start_date) : '...'} → {formatDate(goal.target_date)}
                  </Text>
                </View>
                <Text style={[styles.timelineCountdown, countdown.isOverdue && styles.overdue]}>
                  {countdown.text}
                </Text>
              </View>

              {/* Dual Progress Bars */}
              <View style={styles.dualProgress}>
                <View style={styles.progressRow}>
                  <Text style={styles.progressLabel}>Postęp</Text>
                  <View style={styles.progressBarSmall}>
                    <View style={[styles.progressBarFill, {
                      width: `${goal.progress || 0}%`,
                      backgroundColor: getStatusColor(goal.status),
                    }]} />
                  </View>
                  <Text style={styles.progressPercent}>{Math.round(goal.progress || 0)}%</Text>
                </View>
                <View style={styles.progressRow}>
                  <Text style={styles.progressLabel}>Czas</Text>
                  <View style={styles.progressBarSmall}>
                    <View style={[styles.progressBarFill, {
                      width: `${timeProgress}%`,
                      backgroundColor: timeProgress > (goal.progress || 0) + 20 ? colors.warning : colors.textMuted,
                    }]} />
                  </View>
                  <Text style={styles.progressPercent}>{Math.round(timeProgress)}%</Text>
                </View>
              </View>

              {/* Alert if behind schedule */}
              {timeProgress > (goal.progress || 0) + 20 && (
                <View style={styles.alertBanner}>
                  <Text style={styles.alertText}>Cel może być opóźniony - upłynęło więcej czasu niż postępu</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        );
      })}

      {sortedGoals.length === 0 && (
        <Text style={styles.emptyText}>Brak aktywnych celów do wyświetlenia</Text>
      )}
    </View>
  );
}

function CalendarView({ goals, currentMonth, onChangeMonth, navigation }) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const firstDayOfWeek = monthStart.getDay();

  const goalsWithDeadlines = goals.filter(g => g.target_date);

  const prevMonth = () => onChangeMonth(addDays(monthStart, -1));
  const nextMonth = () => onChangeMonth(addDays(monthEnd, 1));

  return (
    <View>
      {/* Month Navigation */}
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={prevMonth}>
          <Text style={styles.monthNavBtn}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.monthTitle}>
          {format(currentMonth, 'LLLL yyyy', { locale: pl })}
        </Text>
        <TouchableOpacity onPress={nextMonth}>
          <Text style={styles.monthNavBtn}>{'>'}</Text>
        </TouchableOpacity>
      </View>

      {/* Day Headers */}
      <View style={styles.dayHeaders}>
        {['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd'].map(d => (
          <Text key={d} style={styles.dayHeader}>{d}</Text>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendarGrid}>
        {/* Empty cells for alignment */}
        {Array.from({ length: (firstDayOfWeek + 6) % 7 }).map((_, i) => (
          <View key={`empty-${i}`} style={styles.calendarCell} />
        ))}

        {days.map(day => {
          const dayStr = format(day, 'yyyy-MM-dd');
          const isToday = dayStr === format(new Date(), 'yyyy-MM-dd');
          const dayGoals = goalsWithDeadlines.filter(g =>
            g.target_date && g.target_date.split('T')[0] === dayStr
          );

          return (
            <View key={dayStr} style={[styles.calendarCell, isToday && styles.calendarCellToday]}>
              <Text style={[styles.calendarDay, isToday && styles.calendarDayToday]}>
                {format(day, 'd')}
              </Text>
              {dayGoals.map(g => (
                <View key={g.id} style={[styles.calendarGoalDot, { backgroundColor: g.color || colors.primary }]} />
              ))}
            </View>
          );
        })}
      </View>

      {/* Upcoming this month */}
      <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Terminy w tym miesiącu</Text>
      {goalsWithDeadlines
        .filter(g => {
          const d = parseISO(g.target_date);
          return d >= monthStart && d <= monthEnd;
        })
        .sort((a, b) => new Date(a.target_date) - new Date(b.target_date))
        .map(goal => (
          <TouchableOpacity
            key={goal.id}
            style={styles.calendarGoalItem}
            onPress={() => navigation.navigate('Cele', {
              screen: 'GoalDetail',
              params: { goalId: goal.id },
            })}
          >
            <View style={[styles.calendarGoalBar, { backgroundColor: goal.color || colors.primary }]} />
            <Text style={styles.calendarGoalDate}>{formatShortDate(goal.target_date)}</Text>
            <Text style={styles.calendarGoalName} numberOfLines={1}>{goal.title}</Text>
          </TouchableOpacity>
        ))
      }
    </View>
  );
}

function KanbanView({ goals, navigation }) {
  const columns = [
    { key: 'draft', label: 'Szkice', color: colors.textMuted },
    { key: 'active', label: 'Aktywne', color: colors.primary },
    { key: 'paused', label: 'Wstrzymane', color: colors.warning },
    { key: 'completed', label: 'Ukończone', color: colors.success },
  ];

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.kanbanContainer}>
        {columns.map(col => {
          const colGoals = goals.filter(g => g.status === col.key);
          return (
            <View key={col.key} style={styles.kanbanColumn}>
              <View style={[styles.kanbanHeader, { borderBottomColor: col.color }]}>
                <Text style={[styles.kanbanHeaderText, { color: col.color }]}>{col.label}</Text>
                <Text style={styles.kanbanCount}>{colGoals.length}</Text>
              </View>
              {colGoals.map(goal => (
                <TouchableOpacity
                  key={goal.id}
                  style={styles.kanbanCard}
                  onPress={() => navigation.navigate('Cele', {
                    screen: 'GoalDetail',
                    params: { goalId: goal.id },
                  })}
                >
                  <Text style={styles.kanbanIcon}>{getCategoryIcon(goal.category)}</Text>
                  <Text style={styles.kanbanTitle} numberOfLines={2}>{goal.title}</Text>
                  <View style={styles.kanbanMeta}>
                    <View style={[styles.kanbanPriority, { backgroundColor: getPriorityColor(goal.priority) }]} />
                    <Text style={styles.kanbanProgress}>{Math.round(goal.progress || 0)}%</Text>
                  </View>
                  <View style={styles.kanbanProgressBar}>
                    <View style={[styles.kanbanProgressFill, { width: `${goal.progress || 0}%`, backgroundColor: col.color }]} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16 },
  viewSwitch: {
    flexDirection: 'row', backgroundColor: colors.card, borderRadius: 14,
    padding: 4, marginBottom: 20,
  },
  viewTab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  viewTabActive: { backgroundColor: colors.primary },
  viewTabText: { fontSize: 14, color: colors.textMuted, fontWeight: '500' },
  viewTabTextActive: { color: '#fff', fontWeight: '700' },
  // Timeline
  timelineContainer: {},
  todayMarker: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  todayDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.success, marginRight: 8 },
  todayText: { fontSize: 13, fontWeight: '600', color: colors.success },
  todayLine: { flex: 1, height: 1, backgroundColor: colors.success + '40', marginLeft: 8 },
  timelineCard: { flexDirection: 'row', marginBottom: 4 },
  timelineLeft: { width: 30, alignItems: 'center' },
  timelineDot: { width: 14, height: 14, borderRadius: 7 },
  timelineLine: { width: 2, flex: 1, backgroundColor: colors.border, marginVertical: 4 },
  timelineContent: {
    flex: 1, backgroundColor: colors.card, borderRadius: 14, padding: 14,
    marginLeft: 8, marginBottom: 8, ...shadows.card,
  },
  timelineHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  timelineIcon: { fontSize: 24, marginRight: 8 },
  timelineGoalInfo: { flex: 1 },
  timelineTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  timelineDate: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  timelineCountdown: { fontSize: 14, fontWeight: '700', color: colors.primary },
  overdue: { color: colors.danger },
  dualProgress: { gap: 4 },
  progressRow: { flexDirection: 'row', alignItems: 'center' },
  progressLabel: { fontSize: 10, color: colors.textMuted, width: 45 },
  progressBarSmall: { flex: 1, height: 4, backgroundColor: colors.surfaceHighlight, borderRadius: 2, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 2 },
  progressPercent: { fontSize: 10, color: colors.textSecondary, width: 30, textAlign: 'right' },
  alertBanner: {
    backgroundColor: colors.warning + '15', borderRadius: 8, paddingHorizontal: 10,
    paddingVertical: 6, marginTop: 8, borderWidth: 1, borderColor: colors.warning + '30',
  },
  alertText: { fontSize: 11, color: colors.warning },
  emptyText: { fontSize: 14, color: colors.textMuted, textAlign: 'center', padding: 40 },
  // Calendar
  monthNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  monthNavBtn: { fontSize: 24, color: colors.primary, paddingHorizontal: 16 },
  monthTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, textTransform: 'capitalize' },
  dayHeaders: { flexDirection: 'row', marginBottom: 8 },
  dayHeader: {
    flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '600',
    color: colors.textMuted, paddingVertical: 4,
  },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarCell: {
    width: `${100 / 7}%`, aspectRatio: 1, padding: 4,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 8,
  },
  calendarCellToday: { backgroundColor: colors.primary + '20' },
  calendarDay: { fontSize: 14, color: colors.textSecondary },
  calendarDayToday: { color: colors.primary, fontWeight: '700' },
  calendarGoalDot: { width: 6, height: 6, borderRadius: 3, marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 10 },
  calendarGoalItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card,
    borderRadius: 10, padding: 12, marginBottom: 6,
  },
  calendarGoalBar: { width: 4, height: 24, borderRadius: 2, marginRight: 10 },
  calendarGoalDate: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, width: 40 },
  calendarGoalName: { fontSize: 14, color: colors.textPrimary, flex: 1 },
  // Kanban
  kanbanContainer: { flexDirection: 'row', gap: 12, paddingBottom: 20 },
  kanbanColumn: { width: isTablet ? 240 : 200 },
  kanbanHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingBottom: 10, borderBottomWidth: 3, marginBottom: 10,
  },
  kanbanHeaderText: { fontSize: 15, fontWeight: '700' },
  kanbanCount: { fontSize: 13, color: colors.textMuted },
  kanbanCard: {
    backgroundColor: colors.card, borderRadius: 12, padding: 12,
    marginBottom: 8, ...shadows.card,
  },
  kanbanIcon: { fontSize: 20, marginBottom: 4 },
  kanbanTitle: { fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginBottom: 8 },
  kanbanMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  kanbanPriority: { width: 8, height: 8, borderRadius: 4 },
  kanbanProgress: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  kanbanProgressBar: { height: 3, backgroundColor: colors.surfaceHighlight, borderRadius: 2, overflow: 'hidden' },
  kanbanProgressFill: { height: '100%', borderRadius: 2 },
});
