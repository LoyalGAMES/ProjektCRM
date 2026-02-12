import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert,
} from 'react-native';
import { colors, shadows } from '../theme/colors';
import { useGoalStore } from '../store/goalStore';
import { getSmartLabel } from '../utils/helpers';

const CATEGORIES = [
  { key: 'career', label: 'Kariera', icon: '💼' },
  { key: 'health', label: 'Zdrowie', icon: '❤️' },
  { key: 'finance', label: 'Finanse', icon: '💰' },
  { key: 'education', label: 'Edukacja', icon: '📚' },
  { key: 'personal', label: 'Osobiste', icon: '⭐' },
  { key: 'relationships', label: 'Relacje', icon: '👥' },
  { key: 'other', label: 'Inne', icon: '📋' },
];

const PRIORITIES = [
  { key: 'critical', label: 'Krytyczny', color: '#EF4444' },
  { key: 'high', label: 'Wysoki', color: '#F97316' },
  { key: 'medium', label: 'Średni', color: '#EAB308' },
  { key: 'low', label: 'Niski', color: '#22C55E' },
];

const SMART_FIELDS = ['smart_specific', 'smart_measurable', 'smart_achievable', 'smart_relevant', 'smart_time_bound'];

const SMART_PROMPTS = {
  smart_specific: 'Co dokładnie chcesz osiągnąć? Opisz cel jak najdokładniej.',
  smart_measurable: 'Jak zmierzysz postęp? Jakie będą wskaźniki sukcesu?',
  smart_achievable: 'Czy cel jest realistyczny? Jakie zasoby potrzebujesz?',
  smart_relevant: 'Dlaczego ten cel jest dla Ciebie ważny? Jak wpłynie na Twoje życie?',
  smart_time_bound: 'Jaki jest Twój termin? Jakie są etapy pośrednie?',
};

export default function GoalFormScreen({ route, navigation }) {
  const goalId = route?.params?.goalId;
  const { currentGoal, fetchGoalDetails, createGoal, updateGoal } = useGoalStore();
  const isEditing = !!goalId;

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'personal',
    priority: 'medium',
    target_date: '',
    start_date: '',
    smart_specific: '',
    smart_measurable: '',
    smart_achievable: '',
    smart_relevant: '',
    smart_time_bound: '',
    color: '#4A90D9',
  });

  const [step, setStep] = useState(0); // 0: basic, 1: SMART

  useEffect(() => {
    if (isEditing && goalId) {
      fetchGoalDetails(goalId).then(goal => {
        if (goal) {
          setForm({
            title: goal.title || '',
            description: goal.description || '',
            category: goal.category || 'personal',
            priority: goal.priority || 'medium',
            target_date: goal.target_date ? goal.target_date.split('T')[0] : '',
            start_date: goal.start_date ? goal.start_date.split('T')[0] : '',
            smart_specific: goal.smart_specific || '',
            smart_measurable: goal.smart_measurable || '',
            smart_achievable: goal.smart_achievable || '',
            smart_relevant: goal.smart_relevant || '',
            smart_time_bound: goal.smart_time_bound || '',
            color: goal.color || '#4A90D9',
          });
        }
      });
    }
  }, [goalId]);

  useEffect(() => {
    navigation.setOptions({
      title: isEditing ? 'Edytuj Cel' : 'Nowy Cel SMART',
    });
  }, [isEditing]);

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const getSmartScore = () => {
    const filled = SMART_FIELDS.filter(f => form[f] && form[f].trim().length > 10).length;
    return filled / 5;
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      Alert.alert('Błąd', 'Nazwa celu jest wymagana');
      return;
    }
    if (!form.target_date) {
      Alert.alert('Błąd', 'Termin realizacji jest wymagany');
      return;
    }

    if (isEditing) {
      await updateGoal(goalId, form);
    } else {
      await createGoal(form);
    }
    navigation.goBack();
  };

  const smartScore = getSmartScore();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Step Indicator */}
      <View style={styles.steps}>
        <TouchableOpacity style={[styles.stepDot, step === 0 && styles.stepActive]} onPress={() => setStep(0)}>
          <Text style={[styles.stepText, step === 0 && styles.stepTextActive]}>1. Podstawy</Text>
        </TouchableOpacity>
        <View style={styles.stepLine} />
        <TouchableOpacity style={[styles.stepDot, step === 1 && styles.stepActive]} onPress={() => setStep(1)}>
          <Text style={[styles.stepText, step === 1 && styles.stepTextActive]}>2. SMART</Text>
        </TouchableOpacity>
      </View>

      {step === 0 && (
        <>
          {/* Title */}
          <Text style={styles.label}>Nazwa celu *</Text>
          <TextInput
            style={styles.input}
            value={form.title}
            onChangeText={v => update('title', v)}
            placeholder="np. Nauczyć się języka hiszpańskiego na poziomie B2"
            placeholderTextColor={colors.textMuted}
          />

          {/* Description */}
          <Text style={styles.label}>Opis</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={form.description}
            onChangeText={v => update('description', v)}
            placeholder="Szczegółowy opis celu..."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={4}
          />

          {/* Category */}
          <Text style={styles.label}>Kategoria</Text>
          <View style={styles.optionGrid}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.key}
                style={[styles.optionCard, form.category === cat.key && styles.optionCardActive]}
                onPress={() => update('category', cat.key)}
              >
                <Text style={styles.optionIcon}>{cat.icon}</Text>
                <Text style={[styles.optionLabel, form.category === cat.key && styles.optionLabelActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Priority */}
          <Text style={styles.label}>Priorytet</Text>
          <View style={styles.priorityRow}>
            {PRIORITIES.map(p => (
              <TouchableOpacity
                key={p.key}
                style={[styles.priorityCard, form.priority === p.key && { borderColor: p.color, borderWidth: 2 }]}
                onPress={() => update('priority', p.key)}
              >
                <View style={[styles.priorityIndicator, { backgroundColor: p.color }]} />
                <Text style={styles.priorityLabel}>{p.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Dates */}
          <View style={styles.dateRow}>
            <View style={styles.dateField}>
              <Text style={styles.label}>Data rozpoczęcia</Text>
              <TextInput
                style={styles.input}
                value={form.start_date}
                onChangeText={v => update('start_date', v)}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textMuted}
              />
            </View>
            <View style={styles.dateField}>
              <Text style={styles.label}>Termin realizacji *</Text>
              <TextInput
                style={styles.input}
                value={form.target_date}
                onChangeText={v => update('target_date', v)}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </View>

          <TouchableOpacity style={styles.nextButton} onPress={() => setStep(1)}>
            <Text style={styles.nextButtonText}>Dalej: Zdefiniuj SMART</Text>
          </TouchableOpacity>
        </>
      )}

      {step === 1 && (
        <>
          {/* SMART Score */}
          <View style={styles.smartScoreCard}>
            <Text style={styles.smartScoreLabel}>Jakość celu SMART</Text>
            <View style={styles.smartScoreBar}>
              <View style={[styles.smartScoreFill, {
                width: `${smartScore * 100}%`,
                backgroundColor: smartScore >= 0.8 ? colors.success : smartScore >= 0.6 ? colors.warning : colors.danger,
              }]} />
            </View>
            <Text style={styles.smartScoreValue}>{Math.round(smartScore * 100)}%</Text>
            <View style={styles.smartLetters}>
              {SMART_FIELDS.map(field => {
                const info = getSmartLabel(field);
                const filled = form[field] && form[field].trim().length > 10;
                return (
                  <View key={field} style={[styles.smartLetterBadge, filled && styles.smartLetterFilled]}>
                    <Text style={[styles.smartLetterText, filled && styles.smartLetterTextFilled]}>
                      {info.letter}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* SMART Fields */}
          {SMART_FIELDS.map(field => {
            const info = getSmartLabel(field);
            return (
              <View key={field} style={styles.smartField}>
                <View style={styles.smartFieldHeader}>
                  <View style={[styles.smartBadge, { backgroundColor: form[field]?.length > 10 ? colors.primary : colors.surfaceHighlight }]}>
                    <Text style={styles.smartBadgeText}>{info.letter}</Text>
                  </View>
                  <View>
                    <Text style={styles.smartFieldTitle}>{info.label}</Text>
                    <Text style={styles.smartFieldSubtitle}>{info.pl}</Text>
                  </View>
                </View>
                <Text style={styles.smartPrompt}>{SMART_PROMPTS[field]}</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={form[field]}
                  onChangeText={v => update(field, v)}
                  placeholder="Opisz szczegółowo..."
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={3}
                />
              </View>
            );
          })}

          <View style={styles.formActions}>
            <TouchableOpacity style={styles.backButton} onPress={() => setStep(0)}>
              <Text style={styles.backButtonText}>Wstecz</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>
                {isEditing ? 'Zapisz zmiany' : 'Utwórz cel'}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16 },
  steps: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, justifyContent: 'center' },
  stepDot: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: colors.card },
  stepActive: { backgroundColor: colors.primary },
  stepText: { fontSize: 14, color: colors.textSecondary, fontWeight: '600' },
  stepTextActive: { color: '#fff' },
  stepLine: { width: 40, height: 2, backgroundColor: colors.border, marginHorizontal: 8 },
  label: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginBottom: 6, marginTop: 14 },
  input: {
    backgroundColor: colors.card, borderRadius: 12, paddingHorizontal: 16,
    paddingVertical: 14, color: colors.textPrimary, fontSize: 15,
    borderWidth: 1, borderColor: colors.border,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionCard: {
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  optionCardActive: { borderColor: colors.primary, backgroundColor: colors.primary + '20' },
  optionIcon: { fontSize: 18 },
  optionLabel: { fontSize: 13, color: colors.textSecondary },
  optionLabelActive: { color: colors.primary, fontWeight: '600' },
  priorityRow: { flexDirection: 'row', gap: 8 },
  priorityCard: {
    flex: 1, paddingVertical: 12, borderRadius: 12,
    backgroundColor: colors.card, alignItems: 'center', borderWidth: 1, borderColor: colors.border,
  },
  priorityIndicator: { width: 12, height: 12, borderRadius: 6, marginBottom: 4 },
  priorityLabel: { fontSize: 12, color: colors.textSecondary },
  dateRow: { flexDirection: 'row', gap: 12 },
  dateField: { flex: 1 },
  nextButton: {
    backgroundColor: colors.primary, borderRadius: 16, paddingVertical: 16,
    alignItems: 'center', marginTop: 24, ...shadows.button,
  },
  nextButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  // SMART
  smartScoreCard: {
    backgroundColor: colors.card, borderRadius: 16, padding: 20,
    alignItems: 'center', marginBottom: 20, ...shadows.card,
  },
  smartScoreLabel: { fontSize: 14, color: colors.textSecondary, marginBottom: 10 },
  smartScoreBar: { width: '100%', height: 8, backgroundColor: colors.surfaceHighlight, borderRadius: 4, overflow: 'hidden' },
  smartScoreFill: { height: '100%', borderRadius: 4 },
  smartScoreValue: { fontSize: 28, fontWeight: '900', color: colors.textPrimary, marginTop: 8 },
  smartLetters: { flexDirection: 'row', gap: 8, marginTop: 12 },
  smartLetterBadge: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: colors.surfaceHighlight,
    alignItems: 'center', justifyContent: 'center',
  },
  smartLetterFilled: { backgroundColor: colors.primary },
  smartLetterText: { fontSize: 16, fontWeight: '800', color: colors.textMuted },
  smartLetterTextFilled: { color: '#fff' },
  smartField: { marginBottom: 16 },
  smartFieldHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  smartBadge: {
    width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  smartBadgeText: { fontSize: 16, fontWeight: '800', color: '#fff' },
  smartFieldTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  smartFieldSubtitle: { fontSize: 12, color: colors.textSecondary },
  smartPrompt: { fontSize: 12, color: colors.textMuted, fontStyle: 'italic', marginBottom: 6 },
  formActions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  backButton: {
    flex: 1, paddingVertical: 16, borderRadius: 16, alignItems: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  backButtonText: { color: colors.textSecondary, fontWeight: '600', fontSize: 15 },
  saveButton: {
    flex: 2, paddingVertical: 16, borderRadius: 16, alignItems: 'center',
    backgroundColor: colors.primary, ...shadows.button,
  },
  saveButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
