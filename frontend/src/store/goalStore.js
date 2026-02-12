import { create } from 'zustand';
import { goalsApi, milestonesApi, tasksApi, risksApi, progressApi } from '../services/api';

export const useGoalStore = create((set, get) => ({
  goals: [],
  currentGoal: null,
  stats: null,
  loading: false,
  error: null,

  // Fetch all goals
  fetchGoals: async (params) => {
    set({ loading: true, error: null });
    try {
      const { data } = await goalsApi.getAll(params);
      set({ goals: data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  // Fetch single goal with details
  fetchGoalDetails: async (id) => {
    set({ loading: true, error: null });
    try {
      const { data } = await goalsApi.getById(id);
      set({ currentGoal: data, loading: false });
      return data;
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  // Create goal
  createGoal: async (goalData) => {
    try {
      const { data } = await goalsApi.create(goalData);
      set(state => ({ goals: [data, ...state.goals] }));
      return data;
    } catch (error) {
      set({ error: error.message });
    }
  },

  // Update goal
  updateGoal: async (id, updates) => {
    try {
      const { data } = await goalsApi.update(id, updates);
      set(state => ({
        goals: state.goals.map(g => g.id === id ? data : g),
        currentGoal: state.currentGoal?.id === id ? { ...state.currentGoal, ...data } : state.currentGoal,
      }));
      return data;
    } catch (error) {
      set({ error: error.message });
    }
  },

  // Delete goal
  deleteGoal: async (id) => {
    try {
      await goalsApi.delete(id);
      set(state => ({
        goals: state.goals.filter(g => g.id !== id),
        currentGoal: state.currentGoal?.id === id ? null : state.currentGoal,
      }));
    } catch (error) {
      set({ error: error.message });
    }
  },

  // Fetch stats
  fetchStats: async () => {
    try {
      const { data } = await goalsApi.getStats();
      set({ stats: data });
    } catch (error) {
      set({ error: error.message });
    }
  },

  // ======== Milestones ========
  addMilestone: async (milestoneData) => {
    try {
      const { data } = await milestonesApi.create(milestoneData);
      const current = get().currentGoal;
      if (current && current.id === milestoneData.goal_id) {
        set({ currentGoal: { ...current, milestones: [...(current.milestones || []), data] } });
      }
      return data;
    } catch (error) {
      set({ error: error.message });
    }
  },

  updateMilestone: async (id, updates) => {
    try {
      const { data } = await milestonesApi.update(id, updates);
      const current = get().currentGoal;
      if (current) {
        set({
          currentGoal: {
            ...current,
            milestones: (current.milestones || []).map(m => m.id === id ? data : m),
          },
        });
      }
      return data;
    } catch (error) {
      set({ error: error.message });
    }
  },

  // ======== Tasks ========
  addTask: async (taskData) => {
    try {
      const { data } = await tasksApi.create(taskData);
      const current = get().currentGoal;
      if (current && current.id === taskData.goal_id) {
        set({ currentGoal: { ...current, tasks: [...(current.tasks || []), data] } });
      }
      return data;
    } catch (error) {
      set({ error: error.message });
    }
  },

  updateTask: async (id, updates) => {
    try {
      const { data } = await tasksApi.update(id, updates);
      const current = get().currentGoal;
      if (current) {
        set({
          currentGoal: {
            ...current,
            tasks: (current.tasks || []).map(t => t.id === id ? data : t),
          },
        });
      }
      return data;
    } catch (error) {
      set({ error: error.message });
    }
  },

  // ======== Risks ========
  addRisk: async (riskData) => {
    try {
      const { data } = await risksApi.create(riskData);
      const current = get().currentGoal;
      if (current && current.id === riskData.goal_id) {
        set({ currentGoal: { ...current, risks: [...(current.risks || []), data] } });
      }
      return data;
    } catch (error) {
      set({ error: error.message });
    }
  },

  updateRisk: async (id, updates) => {
    try {
      const { data } = await risksApi.update(id, updates);
      const current = get().currentGoal;
      if (current) {
        set({
          currentGoal: {
            ...current,
            risks: (current.risks || []).map(r => r.id === id ? data : r),
          },
        });
      }
      return data;
    } catch (error) {
      set({ error: error.message });
    }
  },

  // ======== Progress ========
  addProgressLog: async (progressData) => {
    try {
      const { data } = await progressApi.create(progressData);
      const current = get().currentGoal;
      if (current && current.id === progressData.goal_id) {
        set({
          currentGoal: {
            ...current,
            progress: progressData.progress_value,
            progressLogs: [data, ...(current.progressLogs || [])],
          },
        });
      }
      return data;
    } catch (error) {
      set({ error: error.message });
    }
  },

  clearError: () => set({ error: null }),
}));
