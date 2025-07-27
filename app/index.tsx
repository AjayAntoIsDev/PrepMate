import React, { useState, useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { Redirect } from "expo-router";
import { settingsManager } from "./utils/storage/storage";

export default function Home() {
    console.log("Home component rendered");
    const [onboarded, setOnboarded] = useState<boolean | null>(null);

    useEffect(() => {
        const onboardedStatus = settingsManager.getOnboarded();
        setOnboarded(onboardedStatus);
    }, []);

    const handleComplete = () => {
        settingsManager.setOnboarded(true);
        setOnboarded(true);
    };

    if (onboarded === null) {
        return (
            <View
                style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    console.log("Onboarding status:", onboarded);

    if (!onboarded) {
        return <Redirect href="/onboarding/step1" />;
    }

    console.log("User is onboarded, redirecting to tabs");
    return <Redirect href="/tabs" />;
}
