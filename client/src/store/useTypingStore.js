import { create } from 'zustand';
import { api } from './useAuthStore';

const useTypingStore = create((set, get) => ({
  lessons: [],
  activeLesson: null,
  sessions: [],
  loading: false,

  fetchLessons: async () => {
    set({ loading: true });
    try {
      const res = await api.get('/lessons');
      set({ lessons: res.data, loading: false });
    } catch (error) {
      set({ loading: false });
    }
  },

  setActiveLesson: (lessonId) => {
    const lesson = get().lessons.find(l => l._id === lessonId);
    set({ activeLesson: lesson });
  },

  fetchSessions: async () => {
    try {
      const res = await api.get('/sessions');
      set({ sessions: res.data });
    } catch (error) {
      console.error("Failed to fetch sessions", error);
    }
  },

  submitSession: async (sessionData) => {
    try {
      const res = await api.post('/sessions', sessionData);
      set((state) => ({ sessions: [res.data, ...state.sessions] }));
    } catch (error) {
      console.error("Failed to submit session", error);
    }
  }
}));

export default useTypingStore;
