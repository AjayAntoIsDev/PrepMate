import React, { useState, useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { Redirect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Onboarding from "./Onboarding";

export default function Home() {
    console.log("Home component rendered");
    const [onboarded, setOnboarded] = useState<boolean | null>(null);

    useEffect(() => {
        AsyncStorage.getItem("onboarded").then((value) => {
            setOnboarded(value === "true");
        });
    }, []);

    const handleComplete = async () => {1
        await AsyncStorage.setItem("onboarded", "true");
        setOnboarded(true);
    };

    if (onboarded === null) {
        return <ActivityIndicator size="large" />;
    }
    console.log("Onboarding status:", onboarded);

    if (!onboarded) {
        return <Redirect href="/onboarding/step1" />;
    }
    console.log("User is onboarded, redirecting to tabs");
    return <Redirect href="/tabs" />;
}
