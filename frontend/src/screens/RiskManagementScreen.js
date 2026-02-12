import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions,
} from 'react-native';
import { colors, shadows } from '../theme/colors';
import { useGoalStore } from '../store/goalStore';
import { getRiskColor } from '../utils/helpers';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

const PROBABILITIES = ['very_high', 'high', 'medium', 'low', 'very_low'];
const IMPACTS = ['negligible', 'minor', 'moderate', 'major', 'critical'];

const PROB_LABELS = {
  very_low: 'B. niskie', low: 'Niskie', medium: 'Średnie', high: 'Wysokie', very_high: 'B. wysokie',
};
const IMPACT_LABELS = {
  negligible: 'Znikomy', minor: 'Mały', moderate: 'Umiarkowany', major: 'Duży', critical: 'Krytyczny',
};

const PROB_VALUES = { very_low: 0.1, low: 0.3, medium: 0.5, high: 0.7, very_high: 0.9 };
const IMPACT_VALUES = { negligible: 0.1, minor: 0.3, moderate: 0.5, major: 0.7, critical: 0.9 };

function getCellColor(prob, impact) {
  const score = PROB_VALUES[prob] * IMPACT_VALUES[impact];
  if (score >= 0.5) return colors.riskCritical;
  if (score >= 0.3) return colors.riskHigh;
  if (score >= 0.15) return colors.riskMedium;
  return colors.riskLow;
}

export default function RiskManagementScreen({ route }) {
  const goalId = route?.params?.goalId;
  const { goals, fetchGoals, currentGoal } = useGoalStore();
  const [selectedGoalId, setSelectedGoalId] = useState(goalId || null);
  const [allRisks, setAllRisks] = useState([]);

  useEffect(() => {
    if (!goalId) fetchGoals();
  }, []);

  useEffect(() => {
    // Collect risks from all goals or current goal
    if (currentGoal && selectedGoalId) {
      setAllRisks(currentGoal.risks || []);
    } else {
      // Show risks from all goals (aggregate view)
      const risks = goals.reduce((acc, g) => {
        // We'd need to fetch each goal's risks - for now show what we have
        return acc;
      }, []);
      setAllRisks(risks);
    }
  }, [currentGoal, selectedGoalId, goals]);

  // Build risk matrix
  const matrixRisks = {};
  allRisks.forEach(r => {
    const key = `${r.probability}_${r.impact}`;
    if (!matrixRisks[key]) matrixRisks[key] = [];
    matrixRisks[key].push(r);
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Goal Selector (if no specific goal) */}
      {!goalId && goals.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.goalSelector}>
          <TouchableOpacity
            style={[styles.goalChip, !selectedGoalId && styles.goalChipActive]}
            onPress={() => setSelectedGoalId(null)}
          >
            <Text style={[styles.goalChipText, !selectedGoalId && styles.goalChipTextActive]}>
              Wszystkie cele
            </Text>
          </TouchableOpacity>
          {goals.map(g => (
            <TouchableOpacity
              key={g.id}
              style={[styles.goalChip, selectedGoalId === g.id && styles.goalChipActive]}
              onPress={() => setSelectedGoalId(g.id)}
            >
              <Text style={[styles.goalChipText, selectedGoalId === g.id && styles.goalChipTextActive]}>
                {g.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Risk Matrix Header */}
      <Text style={styles.sectionTitle}>Macierz Ryzyk</Text>
      <Text style={styles.sectionSubtitle}>
        Prawdopodobieństwo vs Wpływ
      </Text>

      {/* Risk Matrix */}
      <View style={styles.matrixContainer}>
        {/* Y-axis label */}
        <View style={styles.yAxisLabel}>
          <Text style={styles.axisLabelText}>PRAWDOPODOBIEŃSTWO</Text>
        </View>

        <View style={styles.matrixGrid}>
          {/* Column Headers */}
          <View style={styles.matrixRow}>
            <View style={styles.matrixLabelCell} />
            {IMPACTS.map(impact => (
              <View key={impact} style={styles.matrixHeaderCell}>
                <Text style={styles.matrixHeaderText}>{IMPACT_LABELS[impact]}</Text>
              </View>
            ))}
          </View>

          {/* Matrix Rows */}
          {PROBABILITIES.map(prob => (
            <View key={prob} style={styles.matrixRow}>
              <View style={styles.matrixLabelCell}>
                <Text style={styles.matrixLabelText}>{PROB_LABELS[prob]}</Text>
              </View>
              {IMPACTS.map(impact => {
                const key = `${prob}_${impact}`;
                const cellRisks = matrixRisks[key] || [];
                const cellColor = getCellColor(prob, impact);

                return (
                  <View
                    key={key}
                    style={[styles.matrixCell, { backgroundColor: cellColor + '30', borderColor: cellColor + '60' }]}
                  >
                    {cellRisks.length > 0 ? (
                      <View style={[styles.riskDot, { backgroundColor: cellColor }]}>
                        <Text style={styles.riskDotText}>{cellRisks.length}</Text>
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </View>

      {/* X-axis label */}
      <Text style={styles.xAxisLabel}>WPŁYW</Text>

      {/* Legend */}
      <View style={styles.legend}>
        <LegendItem color={colors.riskLow} label="Niskie" />
        <LegendItem color={colors.riskMedium} label="Średnie" />
        <LegendItem color={colors.riskHigh} label="Wysokie" />
        <LegendItem color={colors.riskCritical} label="Krytyczne" />
      </View>

      {/* Risk Summary Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { borderLeftColor: colors.riskCritical }]}>
          <Text style={[styles.statValue, { color: colors.riskCritical }]}>
            {allRisks.filter(r => r.risk_score >= 0.5).length}
          </Text>
          <Text style={styles.statLabel}>Krytyczne</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: colors.riskHigh }]}>
          <Text style={[styles.statValue, { color: colors.riskHigh }]}>
            {allRisks.filter(r => r.risk_score >= 0.3 && r.risk_score < 0.5).length}
          </Text>
          <Text style={styles.statLabel}>Wysokie</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: colors.riskMedium }]}>
          <Text style={[styles.statValue, { color: colors.riskMedium }]}>
            {allRisks.filter(r => r.risk_score >= 0.15 && r.risk_score < 0.3).length}
          </Text>
          <Text style={styles.statLabel}>Średnie</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: colors.riskLow }]}>
          <Text style={[styles.statValue, { color: colors.riskLow }]}>
            {allRisks.filter(r => r.risk_score < 0.15).length}
          </Text>
          <Text style={styles.statLabel}>Niskie</Text>
        </View>
      </View>

      {/* Risk List */}
      <Text style={styles.sectionTitle}>Lista Ryzyk</Text>
      {allRisks.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🛡️</Text>
          <Text style={styles.emptyText}>Brak zidentyfikowanych ryzyk</Text>
          <Text style={styles.emptySubtext}>Dodaj ryzyka w szczegółach celu</Text>
        </View>
      )}
      {allRisks.sort((a, b) => b.risk_score - a.risk_score).map(risk => (
        <View key={risk.id} style={[styles.riskCard, { borderLeftColor: getRiskColor(risk.risk_score) }]}>
          <View style={styles.riskHeader}>
            <Text style={styles.riskTitle}>{risk.title}</Text>
            <View style={[styles.scoreBadge, { backgroundColor: getRiskColor(risk.risk_score) + '20' }]}>
              <Text style={[styles.scoreBadgeText, { color: getRiskColor(risk.risk_score) }]}>
                {Math.round(risk.risk_score * 100)}%
              </Text>
            </View>
          </View>
          {risk.description && <Text style={styles.riskDesc}>{risk.description}</Text>}
          <View style={styles.riskTags}>
            <View style={styles.tag}>
              <Text style={styles.tagText}>P: {PROB_LABELS[risk.probability]}</Text>
            </View>
            <View style={styles.tag}>
              <Text style={styles.tagText}>I: {IMPACT_LABELS[risk.impact]}</Text>
            </View>
            <View style={[styles.tag, { backgroundColor: colors.primary + '20' }]}>
              <Text style={[styles.tagText, { color: colors.primary }]}>{risk.category}</Text>
            </View>
          </View>
          {risk.mitigation_plan && (
            <View style={styles.mitigationBox}>
              <Text style={styles.mitigationLabel}>Plan mitygacji</Text>
              <Text style={styles.mitigationText}>{risk.mitigation_plan}</Text>
            </View>
          )}
          {risk.contingency_plan && (
            <View style={styles.mitigationBox}>
              <Text style={styles.mitigationLabel}>Plan awaryjny</Text>
              <Text style={styles.mitigationText}>{risk.contingency_plan}</Text>
            </View>
          )}
        </View>
      ))}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function LegendItem({ color, label }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const cellSize = isTablet ? 70 : 54;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16 },
  goalSelector: { marginBottom: 16 },
  goalChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: colors.card, marginRight: 8, borderWidth: 1, borderColor: colors.border,
  },
  goalChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  goalChipText: { fontSize: 13, color: colors.textSecondary },
  goalChipTextActive: { color: '#fff', fontWeight: '600' },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary, marginBottom: 4, marginTop: 16 },
  sectionSubtitle: { fontSize: 13, color: colors.textSecondary, marginBottom: 16 },
  matrixContainer: { flexDirection: 'row', marginBottom: 8 },
  yAxisLabel: { justifyContent: 'center', width: 20 },
  axisLabelText: { fontSize: 9, color: colors.textMuted, transform: [{ rotate: '-90deg' }], width: 120 },
  matrixGrid: {},
  matrixRow: { flexDirection: 'row' },
  matrixHeaderCell: { width: cellSize, alignItems: 'center', paddingBottom: 6 },
  matrixHeaderText: { fontSize: 9, color: colors.textMuted, textAlign: 'center' },
  matrixLabelCell: { width: 60, justifyContent: 'center', paddingRight: 6 },
  matrixLabelText: { fontSize: 10, color: colors.textSecondary, textAlign: 'right' },
  matrixCell: {
    width: cellSize, height: cellSize, borderRadius: 8, borderWidth: 1,
    margin: 2, alignItems: 'center', justifyContent: 'center',
  },
  riskDot: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  riskDotText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  xAxisLabel: { textAlign: 'center', fontSize: 10, color: colors.textMuted, marginBottom: 12, marginLeft: 60 },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 20 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 12, height: 12, borderRadius: 3 },
  legendText: { fontSize: 12, color: colors.textSecondary },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  statCard: {
    flex: 1, backgroundColor: colors.card, borderRadius: 12, padding: 12,
    borderLeftWidth: 3, ...shadows.card,
  },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 10, color: colors.textSecondary, marginTop: 2 },
  emptyState: { alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 40, marginBottom: 8 },
  emptyText: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  emptySubtext: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  riskCard: {
    backgroundColor: colors.card, borderRadius: 14, padding: 16,
    marginBottom: 10, borderLeftWidth: 4, ...shadows.card,
  },
  riskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  riskTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, flex: 1 },
  scoreBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  scoreBadgeText: { fontSize: 14, fontWeight: '700' },
  riskDesc: { fontSize: 13, color: colors.textSecondary, lineHeight: 18, marginBottom: 8 },
  riskTags: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: colors.surfaceHighlight },
  tagText: { fontSize: 11, color: colors.textSecondary },
  mitigationBox: { backgroundColor: colors.surfaceHighlight, borderRadius: 8, padding: 10, marginTop: 6 },
  mitigationLabel: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, marginBottom: 4 },
  mitigationText: { fontSize: 13, color: colors.textPrimary, lineHeight: 18 },
});
