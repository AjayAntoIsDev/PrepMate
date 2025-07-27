import { HStack } from "@/components/ui/hstack";

import { Card } from "@/components/ui/card";
import config from "@/app/config.json";
import EditScreenInfo from "@/components/EditScreenInfo";
import { Center } from "@/components/ui/center";
import { Divider } from "@/components/ui/divider";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState } from "react";
import { Alert } from "react-native";
import React from "react";
import { Box } from "@/components/ui/box";
enum Exam {
    JEE = "JEE",
    NEET = "NEET",
}
export default function Home() {
    const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
    React.useEffect(() => {
        const loadSelectedExam = async () => {
            try {
                const value = await AsyncStorage.getItem("exam_preference");
                if (value) {
                    setSelectedExam(value as Exam);
                }
            } catch (error) {
                Alert.alert("Error", "Failed to load exam selection.");
            }
        };
        loadSelectedExam();
    }, []);
    function getDaysLeft(examType: Exam): number | null {
        const examConfig = config[examType];
        if (!examConfig || !examConfig.examDate) return null;
        const today = new Date();
        const examDate = new Date(examConfig.examDate);
        // Calculate difference in milliseconds
        const diff = examDate.getTime() - today.setHours(0, 0, 0, 0);
        // Convert to days
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    }
    return (
        <Box className="flex-1 p-4 mt-4">
            <Box className="flex-row justify-center items-center gap-3">
                <Card
                    size={"lg"}
                    variant={"filled"}
                    className={`${
                        selectedExam === Exam.JEE
                            ? "bg-blue-600"
                            : "bg-green-600"
                    } w-64`}>
                    <Heading
                        size=""
                        className={"text-white dark:text-gray-300 mb-1"}>
                        Exam in
                    </Heading>
                    <Text
                        size="3xl"
                        className="text-white dark:text-gray-300 font-bold ml-auto">
                        {getDaysLeft(selectedExam) !== null
                            ? `${getDaysLeft(selectedExam)} days`
                            : "Idk bruh"}
                    </Text>
                </Card>
                <Card
                    size={"lg"}
                    variant={"filled"}
                    className={`bg-yellow-500 dark:bg-yellow-600 `}>
                    <Heading
                        size=""
                        className={"text-white dark:text-gray-300 mb-1"}>
                        Current Streak
                    </Heading>
                    <Text
                        size="3xl"
                        className="text-white dark:text-gray-300 font-bold ml-auto">
                        0
                    </Text>
                </Card>
            </Box>
            <Text className="text-gray-600 dark:text-gray-400 text-xl mt-4 font-bold">
                Daily Goals
            </Text>
        </Box>
    );
}
