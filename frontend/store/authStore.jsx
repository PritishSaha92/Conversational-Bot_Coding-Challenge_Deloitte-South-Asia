import { create } from 'zustand';

const useAuthStore = create((set, get) => ({
    user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null,
    username: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).username : null,
    role: localStorage.getItem('role') ? localStorage.getItem('role'): null,
    isFlagged: localStorage.getItem('isFlagged') ? localStorage.getItem('isFlagged') : false,
    token: null,
    isAuthenticated: localStorage.getItem('jwt') ? true : false,

    setUser: async (user, isFlagged, role) => {
        set({ user, username: user.username, role, isFlagged, isAuthenticated: true });
        console.log(get().isAuthenticated);
    },
    clearUser: () => {
        set({ user: null, username: null, role: null, isFlagged: false, isAuthenticated: false });
    },
    setToken: (token) => {
        set({ token });
    },

    logout: () => {
        localStorage.removeItem('jwt');
        set({ user: null, token: null, isAuthenticated: false });
    },
}));

export default useAuthStore;