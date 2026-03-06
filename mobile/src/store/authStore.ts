import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { api } from "../api/client";

interface AuthState {
  token: string | null;
  isLoading: boolean;
  loadToken: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  isLoading: false,

  loadToken: async () => {
    const token = await SecureStore.getItemAsync("token");
    set({ token });
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post("/auth/login", { email, password });
      await SecureStore.setItemAsync("token", data.access_token);
      set({ token: data.access_token, isLoading: false });
      return true;
    } catch {
      set({ isLoading: false });
      return false;
    }
  },

  register: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      await api.post("/auth/register", { email, password });
      const { data } = await api.post("/auth/login", { email, password });
      await SecureStore.setItemAsync("token", data.access_token);
      set({ token: data.access_token, isLoading: false });
      return true;
    } catch {
      set({ isLoading: false });
      return false;
    }
  },

  logout: async () => {
    await SecureStore.deleteItemAsync("token");
    set({ token: null });
  },
}));
