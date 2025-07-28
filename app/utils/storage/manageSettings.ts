import { MMKV } from "react-native-mmkv";

const SETTINGS_KEYS = {
    THEME: "settings.theme",
    ONBOARDED: "settings.onboarded",
    NOTIFICATIONS: "settings.notifications",
    EXAM: "settings.exam",
} as const;

export type Theme = "light" | "dark" | "system";
export type Exam = "JEE" | "NEET";

export type Settings = {
    theme: Theme;
    onboarded: boolean;
    notifications: boolean;
    exam: Exam;
};

const DEFAULT_SETTINGS: Settings = {
    theme: "system",
    onboarded: false,
    notifications: true,
    exam: "JEE",
};

class SettingsManager {
    private storage: MMKV;

    constructor(storage: MMKV) {
        this.storage = storage;
    }

    getTheme(): Theme {
        return (
            (this.storage.getString(SETTINGS_KEYS.THEME) as Theme) ||
            DEFAULT_SETTINGS.theme
        );
    }

    setTheme(theme: Theme): void {
        this.storage.set(SETTINGS_KEYS.THEME, theme);
    }

    getOnboarded(): boolean {
        return (
            this.storage.getBoolean(SETTINGS_KEYS.ONBOARDED) ??
            DEFAULT_SETTINGS.onboarded
        );
    }

    setOnboarded(onboarded: boolean): void {
        this.storage.set(SETTINGS_KEYS.ONBOARDED, onboarded);
    }

    getNotifications(): boolean {
        return (
            this.storage.getBoolean(SETTINGS_KEYS.NOTIFICATIONS) ??
            DEFAULT_SETTINGS.notifications
        );
    }

    setNotifications(enabled: boolean): void {
        this.storage.set(SETTINGS_KEYS.NOTIFICATIONS, enabled);
    }

    getExam(): Exam {
        return (
            (this.storage.getString(SETTINGS_KEYS.EXAM) as Exam) ||
            DEFAULT_SETTINGS.exam
        );
    }

    setExam(exam: Exam): void {
        this.storage.set(SETTINGS_KEYS.EXAM, exam);
    }

    getAllSettings(): Settings {
        return {
            theme: this.getTheme(),
            onboarded: this.getOnboarded(),
            notifications: this.getNotifications(),
            exam: this.getExam(),
        };
    }

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
        if (settings.exam !== undefined) {
            this.setExam(settings.exam);
        }
    }

    resetSettings(): void {
        this.storage.delete(SETTINGS_KEYS.THEME);
        this.storage.delete(SETTINGS_KEYS.ONBOARDED);
        this.storage.delete(SETTINGS_KEYS.NOTIFICATIONS);
        this.storage.delete(SETTINGS_KEYS.EXAM);
    }

    hasSetting(key: keyof Settings): boolean {
        const settingsKey =
            SETTINGS_KEYS[key.toUpperCase() as keyof typeof SETTINGS_KEYS];
        return this.storage.contains(settingsKey);
    }

    getStorageSize(): number {
        return this.storage.size;
    }

    clearAllStorage(): void {
        this.storage.clearAll();
    }
}

export const createSettingsManager = (storage: MMKV) => {
    return new SettingsManager(storage);
};

export { SettingsManager };
