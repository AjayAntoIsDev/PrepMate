import React, { useState, useEffect, useRef } from 'react';
import { ScrollView, Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View } from '@/components/ui/view';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Divider } from '@/components/ui/divider';
import { 
  Select, 
  SelectTrigger, 
  SelectInput, 
  SelectIcon, 
  SelectPortal, 
  SelectBackdrop, 
  SelectContent, 
  SelectItem, 
  SelectScrollView 
} from '@/components/ui/select';
import { ActionsheetItemText } from '@/components/ui/select/select-actionsheet';
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
  RotateCcw
} from "lucide-react-native";
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';

const SETTINGS_KEYS = {
  THEME_PREFERENCE: 'theme_preference', // 'light', 'dark', 'system'
  NOTIFICATIONS_ENABLED: 'notifications_enabled',
  SOUND_ENABLED: 'sound_enabled',
};

interface SettingsState {
  themePreference: 'light' | 'dark' | 'system';
  notificationsEnabled: boolean;
  soundEnabled: boolean;
}

export default function SettingsScreen() {
  const { colorScheme, themePreference, setThemePreference } = useTheme();
  const [settings, setSettings] = useState<SettingsState>({
    themePreference: 'system',
    notificationsEnabled: true,
    soundEnabled: true,
  });

  const [loading, setLoading] = useState(true);
  const saveTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});

  useEffect(() => {
    return () => {
      Object.values(saveTimeoutRef.current).forEach(timeout => {
        clearTimeout(timeout);
      });
    };
  }, []);

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    setSettings(prev => ({ ...prev, themePreference }));
  }, [themePreference]);

  const loadSettings = async () => {
    try {
      const settingsData = await Promise.all([
        AsyncStorage.getItem(SETTINGS_KEYS.NOTIFICATIONS_ENABLED),
        AsyncStorage.getItem(SETTINGS_KEYS.SOUND_ENABLED),
      ]);

      setSettings(prev => ({
        ...prev,
        notificationsEnabled: settingsData[0] !== 'false',
        soundEnabled: settingsData[1] !== 'false',
      }));
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = <K extends keyof SettingsState>(
    key: K,
    value: SettingsState[K],
    storageKey?: string
  ) => {
    if (key === 'themePreference') {
      setThemePreference(value as any);
      return;
    }

    setSettings(prev => ({ ...prev, [key]: value }));

    if (!storageKey) return;

    if (saveTimeoutRef.current[key as string]) {
      clearTimeout(saveTimeoutRef.current[key as string]);
    }

    saveTimeoutRef.current[key as string] = setTimeout(async () => {
      try {
        await AsyncStorage.setItem(storageKey, String(value));
      } catch (error) {
        console.error('Error saving setting:', error);
        setSettings(prev => {
          const revertedValue = typeof value === 'boolean' ? !value : prev[key];
          return { ...prev, [key]: revertedValue };
        });
        Alert.alert('Error', 'Failed to save setting. Please try again.');
      } finally {
        delete saveTimeoutRef.current[key as string];
      }
    }, 300);
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center" >
        <Text >Loading settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      className="flex-1" 
      contentContainerStyle={{ padding: 16 }}
    >
      <VStack space="lg">

        {/* Appearance Section */}
        <Card className="p-4">
          <VStack space="md">
            <HStack className="items-center" space="sm">
              <Settings size={18} />
              <Heading size="lg" >Appearance</Heading>
            </HStack>
            
            <VStack space="sm">
              <Text size="sm">
                Theme Preference
              </Text>
              
              <Select
                selectedValue={settings.themePreference}
                onValueChange={(value) => updateSetting('themePreference', value as any)}
              >
                <SelectTrigger>
                  <SelectInput 
                    placeholder="Select theme"
                    value={
                      settings.themePreference === 'system' ? 'System Default' :
                      settings.themePreference === 'light' ? 'Light Mode' : 'Dark Mode'
                    }
                  />
                  <SelectIcon as={ChevronRight} />
                </SelectTrigger>
                <SelectPortal>
                  <SelectBackdrop />
                  <SelectContent>
                    <SelectScrollView>
                      <SelectItem label="System Default" value="system">
                      </SelectItem>
                      <SelectItem label="Light Mode" value="light">
                      </SelectItem>
                      <SelectItem label="Dark Mode" value="dark">
                      </SelectItem>
                    </SelectScrollView>
                  </SelectContent>
                </SelectPortal>
              </Select>
            </VStack>
          </VStack>
        </Card>

        <Card className="p-4">
          <VStack space="md">
            <HStack className="items-center" space="sm">
              <Bell size={18}  />
              <Heading size="lg" >Notifications</Heading>
            </HStack>
            
            <HStack className="justify-between items-center">
              <HStack className="items-center flex-1" space="sm">
                {settings.notificationsEnabled ? 
                  <Bell size={16}  /> :
                  <BellOff size={16}  />
                }
                <VStack className="flex-1">
                  <Text >Push Notifications</Text>
                  <Text size="sm" >
                    Receive reminders and updates
                  </Text>
                </VStack>
              </HStack>
              <Switch
                value={settings.notificationsEnabled}
                onValueChange={(value) => 
                  updateSetting('notificationsEnabled', value, SETTINGS_KEYS.NOTIFICATIONS_ENABLED)
                }
              />
            </HStack>
          </VStack>
        </Card>

        <Card className="p-4">
          <VStack space="md">
            <HStack className="items-center" space="sm">
              <Info size={18}  />
              <Heading size="lg" >App Information</Heading>
            </HStack>
            
            <VStack space="sm">
              <HStack className="justify-between">
                <Text >Version</Text>
                <Text >1.0.0</Text>
              </HStack>
              
              <HStack className="justify-between">
                <Text >Platform</Text>
                <Text >{Platform.OS}</Text>
              </HStack>
              
              <HStack className="justify-between">
                <Text >Current Theme</Text>
                <Text >
                  {settings.themePreference === 'system' 
                    ? `System` 
                    : settings.themePreference.charAt(0).toUpperCase() + settings.themePreference.slice(1)}
                </Text>
              </HStack>
            </VStack>
          </VStack>
        </Card>

        <VStack space="md" className="mt-4">
          <Button
            variant="outline"
            onPress={() => Alert.alert('About', 'PrepMate - Your study companion app')}
            className="w-full"
          >
            <HStack className="items-center" space="sm">
              <HelpCircle size={16} />
              <Text>About PrepMate</Text>
            </HStack>
          </Button>
        </VStack>

        <View className="h-8" />
      </VStack>
    </ScrollView>
  );
}