import { differenceInDays, differenceInHours, differenceInMinutes, format, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';

export function getCountdown(targetDate) {
  if (!targetDate) return { text: '---', days: 0, isOverdue: false };

  const target = typeof targetDate === 'string' ? parseISO(targetDate) : targetDate;
  const now = new Date();
  const days = differenceInDays(target, now);
  const hours = differenceInHours(target, now) % 24;
  const minutes = differenceInMinutes(target, now) % 60;

  if (days < 0) {
    return { text: `${Math.abs(days)}d po terminie`, days, isOverdue: true };
  }
  if (days === 0) {
    return { text: `${hours}h ${minutes}m`, days: 0, isOverdue: false, isToday: true };
  }
  if (days <= 7) {
    return { text: `${days}d ${hours}h`, days, isOverdue: false };
  }
  return { text: `${days} dni`, days, isOverdue: false };
}

export function formatDate(date) {
  if (!date) return '';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'dd MMM yyyy', { locale: pl });
}

export function formatShortDate(date) {
  if (!date) return '';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'dd.MM', { locale: pl });
}

export function getPriorityColor(priority) {
  const map = {
    critical: '#EF4444',
    high: '#F97316',
    medium: '#EAB308',
    low: '#22C55E',
  };
  return map[priority] || '#8B95B5';
}

export function getStatusColor(status) {
  const map = {
    draft: '#8B95B5',
    active: '#4A90D9',
    paused: '#FBBF24',
    completed: '#34D399',
    abandoned: '#F87171',
  };
  return map[status] || '#8B95B5';
}

export function getStatusLabel(status) {
  const map = {
    draft: 'Szkic',
    active: 'Aktywny',
    paused: 'Wstrzymany',
    completed: 'Ukończony',
    abandoned: 'Porzucony',
    todo: 'Do zrobienia',
    in_progress: 'W trakcie',
    done: 'Gotowe',
    skipped: 'Pominięto',
  };
  return map[status] || status;
}

export function getCategoryLabel(category) {
  const map = {
    career: 'Kariera',
    health: 'Zdrowie',
    finance: 'Finanse',
    education: 'Edukacja',
    personal: 'Osobiste',
    relationships: 'Relacje',
    other: 'Inne',
  };
  return map[category] || category;
}

export function getCategoryIcon(category) {
  const map = {
    career: '💼',
    health: '❤️',
    finance: '💰',
    education: '📚',
    personal: '⭐',
    relationships: '👥',
    other: '📋',
  };
  return map[category] || '🎯';
}

export function getRiskColor(score) {
  if (score >= 0.6) return '#EF4444';
  if (score >= 0.4) return '#F97316';
  if (score >= 0.2) return '#EAB308';
  return '#22C55E';
}

export function getSmartScore(goal) {
  const fields = [
    goal.smart_specific,
    goal.smart_measurable,
    goal.smart_achievable,
    goal.smart_relevant,
    goal.smart_time_bound,
  ];
  const filled = fields.filter(f => f && f.trim().length > 10).length;
  return filled / 5;
}

export function getSmartLabel(key) {
  const map = {
    smart_specific: { letter: 'S', label: 'Specific', pl: 'Konkretny' },
    smart_measurable: { letter: 'M', label: 'Measurable', pl: 'Mierzalny' },
    smart_achievable: { letter: 'A', label: 'Achievable', pl: 'Osiągalny' },
    smart_relevant: { letter: 'R', label: 'Relevant', pl: 'Istotny' },
    smart_time_bound: { letter: 'T', label: 'Time-bound', pl: 'Określony w czasie' },
  };
  return map[key];
}
