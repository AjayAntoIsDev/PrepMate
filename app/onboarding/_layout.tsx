import React from "react";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import {
    ThemeProvider as CustomThemeProvider,
    useColorScheme,
} from "@/contexts/ThemeContext";
import { Slot } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function OnboardingLayout() {
    const colorScheme = useColorScheme();

    return (
        <SafeAreaView style={{ flex: 1 }} className="bg-white dark:bg-black">
            <GluestackUIProvider mode={colorScheme}>
                <Slot />
            </GluestackUIProvider>
        </SafeAreaView>
    );
}
