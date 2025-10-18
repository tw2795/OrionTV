import { create } from "zustand";
import { SettingsManager } from "@/services/storage";
import { api, ServerConfig } from "@/services/api";
import { storageConfig } from "@/services/storageConfig";
import Logger from "@/utils/Logger";

const logger = Logger.withTag('SettingsStore');

interface SettingsState {
  apiBaseUrl: string;
  m3uUrl: string;
  remoteInputEnabled: boolean;
  videoSource: {
    enabledAll: boolean;
    sources: {
      [key: string]: boolean;
    };
  };
  isModalVisible: boolean;
  serverConfig: ServerConfig | null;
  isLoadingServerConfig: boolean;
  hasUnsavedApiChanges: boolean;
  loadSettings: () => Promise<void>;
  fetchServerConfig: (options?: { retries?: number; delayMs?: number }) => Promise<boolean>;
  setApiBaseUrl: (url: string) => void;
  setM3uUrl: (url: string) => void;
  setRemoteInputEnabled: (enabled: boolean) => void;
  saveSettings: () => Promise<void>;
  setVideoSource: (config: { enabledAll: boolean; sources: { [key: string]: boolean } }) => void;
  showModal: () => void;
  hideModal: () => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  apiBaseUrl: "",
  m3uUrl: "",
  liveStreamSources: [],
  remoteInputEnabled: false,
  isModalVisible: false,
  serverConfig: null,
  isLoadingServerConfig: false,
  hasUnsavedApiChanges: false,
  videoSource: {
    enabledAll: true,
    sources: {},
  },
  loadSettings: async () => {
    const settings = await SettingsManager.get();
    set({
      apiBaseUrl: settings.apiBaseUrl,
      m3uUrl: settings.m3uUrl,
      remoteInputEnabled: settings.remoteInputEnabled || false,
      videoSource: settings.videoSource || {
        enabledAll: true,
        sources: {},
      },
      hasUnsavedApiChanges: false,
    });
    if (settings.apiBaseUrl) {
      api.setBaseUrl(settings.apiBaseUrl);
      await get().fetchServerConfig({ retries: 3, delayMs: 1000 });
    }
  },
  fetchServerConfig: async ({ retries = 1, delayMs = 1000 }: { retries?: number; delayMs?: number } = {}) => {
    const { apiBaseUrl } = get();
    if (!apiBaseUrl) {
      set({ serverConfig: null });
      return false;
    }

    set({ isLoadingServerConfig: true });
    let attempt = 0;
    let success = false;

    while (attempt < Math.max(1, retries)) {
      try {
        const config = await api.getServerConfig();
        if (config) {
          storageConfig.setStorageType(config.StorageType);
          set({ serverConfig: config });
          success = true;
          break;
        }
      } catch (error) {
        set({ serverConfig: null });
        logger.error(`[SettingsStore] Failed to fetch server config (attempt ${attempt + 1}):`, error);
        if (attempt < Math.max(1, retries) - 1) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
      attempt += 1;
    }

    set({ isLoadingServerConfig: false });
    return success;
  },
  setApiBaseUrl: (url) =>
    set((state) => {
      if (state.apiBaseUrl === url) {
        return state;
      }
      return {
        apiBaseUrl: url,
        hasUnsavedApiChanges: true,
      };
    }),
  setM3uUrl: (url) => set({ m3uUrl: url }),
  setRemoteInputEnabled: (enabled) => set({ remoteInputEnabled: enabled }),
  setVideoSource: (config) => set({ videoSource: config }),
  saveSettings: async () => {
    const { apiBaseUrl, m3uUrl, remoteInputEnabled, videoSource } = get();

    let processedApiBaseUrl = apiBaseUrl.trim();
    if (processedApiBaseUrl.endsWith("/")) {
      processedApiBaseUrl = processedApiBaseUrl.slice(0, -1);
    }

    if (!/^https?:\/\//i.test(processedApiBaseUrl)) {
      const hostPart = processedApiBaseUrl.split("/")[0];
      // Simple check for IP address format.
      const isIpAddress = /^((\d{1,3}\.){3}\d{1,3})(:\d+)?$/.test(hostPart);
      // Check if the domain includes a port.
      const hasPort = /:\d+/.test(hostPart);

      if (isIpAddress || hasPort) {
        processedApiBaseUrl = "http://" + processedApiBaseUrl;
      } else {
        processedApiBaseUrl = "https://" + processedApiBaseUrl;
      }
    }

    await SettingsManager.save({
      apiBaseUrl: processedApiBaseUrl,
      m3uUrl,
      remoteInputEnabled,
      videoSource,
    });
    api.setBaseUrl(processedApiBaseUrl);
    // Also update the URL in the state so the input field shows the processed URL
    set({ isModalVisible: false, apiBaseUrl: processedApiBaseUrl, hasUnsavedApiChanges: false });
    await get().fetchServerConfig({ retries: 3, delayMs: 1000 });
  },
  showModal: () => set({ isModalVisible: true }),
  hideModal: () => set({ isModalVisible: false }),
}));
