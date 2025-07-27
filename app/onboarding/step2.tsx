import React, { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
import { Button, ButtonText,ButtonIcon } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { Box } from "@/components/ui/box";
import { useRouter } from "expo-router";
import {
    ArrowRight,
    BookOpen,
    GraduationCap,
    Check,
    ChevronRight,
    Palette,
} from "lucide-react-native";
import { HStack } from "@/components/ui/hstack";
import { Redirect } from "expo-router";
import {
    Select,
    SelectTrigger,
    SelectInput,
    SelectIcon,
    SelectContent,
    SelectItem,
    SelectScrollView,
    SelectPortal,
    SelectBackdrop,
} from "@/components/ui/select";
import { useTheme } from "@/contexts/ThemeContext";

const STORAGE_KEY = "exam_preference";

export default function OnboardingStep2() {
    const [selectedExam, setSelectedExam] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { colorScheme, themePreference, setThemePreference } = useTheme();

    const handleExamSelection = async (exam: string) => {
        setSelectedExam(exam);
        setLoading(true);

        try {
            await AsyncStorage.setItem(STORAGE_KEY, exam);
            console.log(`${exam} preference saved to storage`);
        } catch (error) {
            console.error("Error saving exam preference:", error);
            Alert.alert(
                "Error",
                "Failed to save your preference. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleNext = async () => {
        if (!selectedExam) {
            Alert.alert(
                "Please select an exam",
                "Choose either JEE or NEET to continue."
            );
            return;
        }

        try {
            await AsyncStorage.setItem("onboarded", "true");
        } catch (error) {
            console.error("Error finishing onboarding:", error);
        }

        router.replace("/tabs");
    };

    return (
        <Box className="h-screen px-6 py-8">
            <Text className="font-bold text-3xl mb-2">Configure</Text>
            <Box className="justify-center flex-1">
                <Box className="mb-6">
                    <HStack space="sm" className="items-center justify-between">
                        <HStack className="items-center" space="sm">
                            <Palette
                                size={18}
                                color={
                                    colorScheme === "dark" ? "white" : "black"
                                }
                            />
                            <Text className="text-lg font-semibold">Theme</Text>
                        </HStack>
                        <Select
                            selectedValue={themePreference}
                            onValueChange={(value) =>
                                setThemePreference(value as any)
                            }>
                            <SelectTrigger className="h-12 min-w-[140px]">
                                <SelectInput
                                    placeholder="Select theme"
                                    value={
                                        themePreference === "system"
                                            ? "System Default"
                                            : themePreference === "light"
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
                                            value="system"
                                        />
                                        <SelectItem
                                            label="Light Mode"
                                            value="light"
                                        />
                                        <SelectItem
                                            label="Dark Mode"
                                            value="dark"
                                        />
                                    </SelectScrollView>
                                </SelectContent>
                            </SelectPortal>
                        </Select>
                    </HStack>
                </Box>
                <Box>
                    <Button
                        onPress={() => handleExamSelection("JEE")}
                        disabled={loading}
                        className={`h-20 mb-6 ${
                            selectedExam === "JEE"
                                ? "bg-blue-600 border-blue-600 dark:bg-blue-500 dark:border-blue-500"
                                : "bg-card border-border dark:border-gray-700"
                        }`}
                        variant={selectedExam === "JEE" ? "solid" : "outline"}>
                        <HStack space="md" className="items-center">
                            <GraduationCap
                                size={24}
                                color={
                                    selectedExam === "JEE" ? "white" : "gray"
                                }
                            />
                            <Box className="flex-1">
                                <ButtonText
                                    className={`text-xl font-bold text-left ${
                                        selectedExam === "JEE"
                                            ? "text-white"
                                            : "text-foreground dark:text-gray-100"
                                    }`}>
                                    JEE
                                </ButtonText>
                                <Text
                                    className={`text-sm text-left ${
                                        selectedExam === "JEE"
                                            ? "text-white/80"
                                            : "text-muted-foreground dark:text-gray-400"
                                    }`}>
                                    Joint Entrance Examination
                                </Text>
                            </Box>
                            {selectedExam === "JEE" && (
                                <Text className="text-white text-2xl">
                                    <Check color="white" />
                                </Text>
                            )}
                        </HStack>
                    </Button>

                    <Button
                        onPress={() => handleExamSelection("NEET")}
                        disabled={loading}
                        className={`h-20 mb-6 ${
                            selectedExam === "NEET"
                                ? "bg-green-600 border-green-600 dark:bg-green-500 dark:border-green-500"
                                : "bg-card border-border dark:border-gray-700"
                        }`}
                        variant={selectedExam === "NEET" ? "solid" : "outline"}>
                        <HStack space="md" className="items-center">
                            <BookOpen
                                size={24}
                                color={
                                    selectedExam === "NEET" ? "white" : "gray"
                                }
                            />
                            <Box className="flex-1">
                                <ButtonText
                                    className={`text-xl font-bold text-left ${
                                        selectedExam === "NEET"
                                            ? "text-white"
                                            : "text-foreground dark:text-gray-100"
                                    }`}>
                                    NEET
                                </ButtonText>
                                <Text
                                    className={`text-sm text-left ${
                                        selectedExam === "NEET"
                                            ? "text-white/80"
                                            : "text-muted-foreground dark:text-gray-400"
                                    }`}>
                                    National Eligibility cum Entrance Test
                                </Text>
                            </Box>
                            {selectedExam === "NEET" && (
                                <Text className="text-white text-2xl">
                                    <Check color="white" />
                                </Text>
                            )}
                        </HStack>
                    </Button>
                </Box>
            </Box>

            <Button
                onPress={handleNext}
                className={`w-full ${!selectedExam ? "opacity-50" : ""} mb-24 `}
                size="lg"
                disabled={loading}>
                <ButtonText>Finish</ButtonText>
                <ButtonIcon as={ArrowRight} className></ButtonIcon>
            </Button>
        </Box>
    );
}
