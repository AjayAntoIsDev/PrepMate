import { MMKV } from "react-native-mmkv";

// Settings keys with prefix
const SETTINGS_KEYS = {
    THEME: "settings.theme",
    ONBOARDED: "settings.onboarded",
    NOTIFICATIONS: "settings.notifications",
} as const;

// Types
export type Theme = "light" | "dark" | "system";
export type Settings = {
    theme: Theme;
    onboarded: boolean;
    notifications: boolean;
};

// Default settings
const DEFAULT_SETTINGS: Settings = {
    theme: "system",
    onboarded: false,
    notifications: true,
};

class SettingsManager {
    private storage: MMKV;

    constructor(storage: MMKV) {
        this.storage = storage;
    }

    // Get theme setting
    getTheme(): Theme {
        return (
            (this.storage.getString(SETTINGS_KEYS.THEME) as Theme) ||
            DEFAULT_SETTINGS.theme
        );
    }

    // Set theme setting
    setTheme(theme: Theme): void {
        this.storage.set(SETTINGS_KEYS.THEME, theme);
    }

    // Get onboarded status
    getOnboarded(): boolean {
        return (
            this.storage.getBoolean(SETTINGS_KEYS.ONBOARDED) ??
            DEFAULT_SETTINGS.onboarded
        );
    }

    // Set onboarded status
    setOnboarded(onboarded: boolean): void {
        this.storage.set(SETTINGS_KEYS.ONBOARDED, onboarded);
    }

    // Get notifications setting
    getNotifications(): boolean {
        return (
            this.storage.getBoolean(SETTINGS_KEYS.NOTIFICATIONS) ??
            DEFAULT_SETTINGS.notifications
        );
    }

    // Set notifications setting
    setNotifications(enabled: boolean): void {
        this.storage.set(SETTINGS_KEYS.NOTIFICATIONS, enabled);
    }

    // Get all settings
    getAllSettings(): Settings {
        return {
            theme: this.getTheme(),
            onboarded: this.getOnboarded(),
            notifications: this.getNotifications(),
        };
    }

    // Update multiple settings at once
    updateSettings(settings: Partial<Settings>): void {
        if (settings.theme !== undefined) {
            this.setTheme(settings.theme);
        }
        if (settings.onboarded !== undefined) {
            this.setOnboarded(settings.onboarded);
        }
        if (settings.notifications !== undefined) {
            this.setNotifications(settings.notifications);
        }
    }

    // Reset all settings to defaults
    resetSettings(): void {
        this.storage.delete(SETTINGS_KEYS.THEME);
        this.storage.delete(SETTINGS_KEYS.ONBOARDED);
        this.storage.delete(SETTINGS_KEYS.NOTIFICATIONS);
    }

    // Check if a setting exists
    hasSetting(key: keyof Settings): boolean {
        const settingsKey =
            SETTINGS_KEYS[key.toUpperCase() as keyof typeof SETTINGS_KEYS];
        return this.storage.contains(settingsKey);
    }

    // Get storage size (useful for debugging)
    getStorageSize(): number {
        return this.storage.size;
    }

    // Clear all storage (use with caution)
    clearAllStorage(): void {
        this.storage.clearAll();
    }
}

export const createSettingsManager = (storage: MMKV) => {
    return new SettingsManager(storage);
};

export { SettingsManager };
