import React, { useState, useEffect, useRef } from "react";
import { ScrollView, Platform, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { View } from "@/components/ui/view";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Divider } from "@/components/ui/divider";
import {
    Select,
    SelectTrigger,
    SelectInput,
    SelectIcon,
    SelectPortal,
    SelectBackdrop,
    SelectContent,
    SelectItem,
    SelectScrollView,
} from "@/components/ui/select";
import { ActionsheetItemText } from "@/components/ui/select/select-actionsheet";
import {
    Moon,
    Sun,
    Bell,
    BellOff,
    Volume2,
    VolumeX,
    Info,
    Shield,
    Database,
    Trash2,
    Download,
    Upload,
    HelpCircle,
    Settings,
    ChevronRight,
    Smartphone,
    RotateCcw,
    Palette,
} from "lucide-react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { Colors } from "@/constants/Colors";
import { settingsManager, topicsManager } from "@/app/utils/storage/storage";
import storage from "@/app/utils/storage/storage";

const SETTINGS_KEYS = {
    THEME_PREFERENCE: "theme_preference", // 'light', 'dark', 'system'
    NOTIFICATIONS_ENABLED: "notifications_enabled",
    SOUND_ENABLED: "sound_enabled",
};

interface SettingsState {
    themePreference: "light" | "dark" | "system";
    notificationsEnabled: boolean;
    soundEnabled: boolean;
    exam: "JEE" | "NEET";
}

export default function SettingsScreen() {
    const { colorScheme, themePreference, setThemePreference } = useTheme();
    const [settings, setSettings] = useState<SettingsState>(() => ({
        themePreference: "system",
        notificationsEnabled: true,
        soundEnabled: true,
        exam: settingsManager.getExam(),
    }));

    const [loading, setLoading] = useState(true);
    const saveTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});

    useEffect(() => {
        return () => {
            Object.values(saveTimeoutRef.current).forEach((timeout) => {
                clearTimeout(timeout);
            });
        };
    }, []);

    useEffect(() => {
        loadSettings();
    }, []);

    useEffect(() => {
        setSettings((prev) => ({ ...prev, themePreference }));
    }, [themePreference]);

    const loadSettings = async () => {
        try {
            const settingsData = await Promise.all([
                AsyncStorage.getItem(SETTINGS_KEYS.NOTIFICATIONS_ENABLED),
                AsyncStorage.getItem(SETTINGS_KEYS.SOUND_ENABLED),
            ]);

            setSettings((prev) => ({
                ...prev,
                notificationsEnabled: settingsData[0] !== "false",
                soundEnabled: settingsData[1] !== "false",
                exam: settingsManager.getExam(),
            }));
        } catch (error) {
            console.error("Error loading settings:", error);
        } finally {
            setLoading(false);
        }
    };

    const updateSetting = <K extends keyof SettingsState>(
        key: K,
        value: SettingsState[K],
        storageKey?: string
    ) => {
        if (key === "themePreference") {
            setThemePreference(value as any);
            return;
        }

        setSettings((prev) => ({ ...prev, [key]: value }));

        if (!storageKey) return;

        if (saveTimeoutRef.current[key as string]) {
            clearTimeout(saveTimeoutRef.current[key as string]);
        }

        saveTimeoutRef.current[key as string] = setTimeout(async () => {
            try {
                await AsyncStorage.setItem(storageKey, String(value));
            } catch (error) {
                console.error("Error saving setting:", error);
                setSettings((prev) => {
                    const revertedValue =
                        typeof value === "boolean" ? !value : prev[key];
                    return { ...prev, [key]: revertedValue };
                });
                Alert.alert(
                    "Error",
                    "Failed to save setting. Please try again."
                );
            } finally {
                delete saveTimeoutRef.current[key as string];
            }
        }, 300);
    };

    const handleClearAllData = () => {
        Alert.alert(
            "Confirm Reset",
            "This will permanently delete all your app data (progress, settings, exam selection). Are you sure?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            settingsManager.clearAllStorage();
                            await AsyncStorage.multiRemove([
                                SETTINGS_KEYS.THEME_PREFERENCE,
                            ]);
                            topicsManager.setExamType("JEE");
                            setThemePreference("system");
                            setSettings({
                                themePreference: "system",
                                exam: "JEE",
                            });
                            Alert.alert("Data Cleared", "All app data has been removed.");
                        } catch (e) {
                            console.error("Failed to clear data", e);
                            Alert.alert("Error", "Failed to clear data. Please try again.");
                        }
                    },
                },
            ]
        );
    };

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center">
                <Text>Loading settings...</Text>
            </View>
        );
    }

    return (
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
            <VStack space="lg">
                <Card className="p-4">
                    <VStack space="md">
                        <HStack
                            space="sm"
                            className="items-center justify-between">
                            <HStack className="items-center" space="sm">
                                <Palette
                                    size={18}
                                    color={
                                        colorScheme === "dark"
                                            ? "white"
                                            : "black"
                                    }
                                />
                                <Heading size="lg">Theme</Heading>
                            </HStack>

                            <Select
                                selectedValue={settings.themePreference}
                                onValueChange={(value) =>
                                    updateSetting(
                                        "themePreference",
                                        value as any
                                    )
                                }>
                                <SelectTrigger className="h-12">
                                    <SelectInput
                                        placeholder="Select theme"
                                        value={
                                            settings.themePreference ===
                                            "system"
                                                ? "System Default"
                                                : settings.themePreference ===
                                                  "light"
                                                ? "Light Mode"
                                                : "Dark Mode"
                                        }
                                    />
                                    <SelectIcon as={ChevronRight} />
                                </SelectTrigger>
                                <SelectPortal>
                                    <SelectBackdrop />
                                    <SelectContent>
                                        <SelectScrollView>
                                            <SelectItem
                                                label="System Default"
                                                value="system"></SelectItem>
                                            <SelectItem
                                                label="Light Mode"
                                                value="light"></SelectItem>
                                            <SelectItem
                                                label="Dark Mode"
                                                value="dark"></SelectItem>
                                        </SelectScrollView>
                                    </SelectContent>
                                </SelectPortal>
                            </Select>
                        </HStack>
                    </VStack>

                    <VStack space="md" className="mt-8">
                        <HStack
                            space="sm"
                            className="items-center justify-between">
                            <HStack className="items-center" space="sm">
                                <Heading size="lg">Exam</Heading>
                            </HStack>

                            <Select
                                selectedValue={settings.exam}
                                onValueChange={(value) => {
                                    setSettings((prev) => ({
                                        ...prev,
                                        exam: value as any,
                                    }));
                                    settingsManager.setExam(value as any);
                                    topicsManager.setExamType(value as any);
                                }}
                            >
                                <SelectTrigger className="h-12">
                                    <SelectInput
                                        placeholder="Select exam"
                                        value={settings.exam}
                                    />
                                    <SelectIcon as={ChevronRight} />
                                </SelectTrigger>
                                <SelectPortal>
                                    <SelectBackdrop />
                                    <SelectContent>
                                        <SelectScrollView>
                                            <SelectItem
                                                label="JEE"
                                                value="JEE"
                                            ></SelectItem>
                                            <SelectItem
                                                label="NEET"
                                                value="NEET"
                                            ></SelectItem>
                                        </SelectScrollView>
                                    </SelectContent>
                                </SelectPortal>
                            </Select>
                        </HStack>
                    </VStack>
                </Card>

                <Card className="p-4">
                    <VStack space="md">
                        <HStack className="items-center" space="sm">
                            <Info
                                size={18}
                                color={
                                    colorScheme === "dark" ? "white" : "black"
                                }
                            />
                            <Heading size="lg">App Information</Heading>
                        </HStack>

                        <VStack space="sm">
                            <HStack className="justify-between">
                                <Text>Version</Text>
                                <Text>1.0.0</Text>
                            </HStack>

                            <HStack className="justify-between">
                                <Text>Platform</Text>
                                <Text>{Platform.OS}</Text>
                            </HStack>
                        </VStack>
                    </VStack>
                </Card>

                <Card className="p-4 border border-red-500 bg-red-50 dark:bg-red-950/30">
                    <VStack space="md">
                        <Heading size="lg" className="text-red-600 dark:text-red-400">Danger Zone</Heading>
                        <Text size="sm" className="text-red-600 dark:text-red-400">
                            Clearing data will remove all progress, notes, quiz completions and reset settings.
                        </Text>
                        <Button
                            className="bg-red-600 dark:bg-red-700"
                            onPress={handleClearAllData}
                        >
                            <Text className="text-white font-semibold">Clear All Data</Text>
                        </Button>
                    </VStack>
                </Card>

                <VStack space="md" className="mt-4">
                    <Text size="sm" className="text-center">
                        Made with ♥️ by Ajay Anto
                    </Text>
                </VStack>

                <View className="h-8" />
            </VStack>
        </ScrollView>
    );
}
