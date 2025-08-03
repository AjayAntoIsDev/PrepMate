import {
    Button,
    ButtonText,
    ButtonSpinner,
    ButtonIcon,
} from "@/components/ui/button";
import { BadgeQuestionMark, ScrollText, RefreshCw } from "lucide-react-native";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";
import { HStack } from "@/components/ui/hstack";
import { Card } from "@/components/ui/card";
import config from "@/app/config.json";
import EditScreenInfo from "@/components/EditScreenInfo";
import { Center } from "@/components/ui/center";
import { Divider } from "@/components/ui/divider";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState, useEffect, useCallback } from "react";
import { Alert, RefreshControl, ScrollView } from "react-native";
import React from "react";
import { Box } from "@/components/ui/box";
import {
    getTodaysPlan,
    type TodaysPlan,
    type ExamType,
} from "@/app/utils/ai/getTodaysPlan";
import { topicsManager, settingsManager } from "@/app/utils/storage/storage";
import { type TopicsManager } from "@/app/utils/storage/manageTopics";
import {
    createCacheManager,
    StudyPlanCache,
    CACHE_CONFIGS,
} from "@/app/utils/cache/cache";
import storage from "@/app/utils/storage/storage";

enum Exam {
    JEE = "JEE",
    NEET = "NEET",
}

// Initialize universal cache manager
const cacheManager = createCacheManager(storage);
const studyPlanCache = new StudyPlanCache(cacheManager);

export default function Home() {
    const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
    const [todaysPlan, setTodaysPlan] = useState<TodaysPlan | null>(null);
    const [isLoadingPlan, setIsLoadingPlan] = useState(false);
    const [studyStreak, setStudyStreak] = useState(0);
    const [refreshing, setRefreshing] = useState(false);
    const [isFromCache, setIsFromCache] = useState(false);

    useEffect(() => {
        const loadSelectedExam = async () => {
            try {
                const value = await AsyncStorage.getItem("exam_preference");
                if (value) {
                    const exam = value as Exam;
                    setSelectedExam(exam);

                    topicsManager.setExamType(exam);
                    setStudyStreak(topicsManager.getStudyStreak());
                }
            } catch (error) {
                Alert.alert("Error", "Failed to load exam selection.");
            }
        };
        loadSelectedExam();
    }, []);

    useEffect(() => {
        if (selectedExam) {
            generateTodaysPlan();
        }
    }, [selectedExam]);

    const generateTodaysPlan = async (forceRegenerate: boolean = false) => {
        if (!selectedExam) return;

        setIsLoadingPlan(true);
        try {
            const daysLeft = getDaysLeft(selectedExam);
            if (daysLeft === null || daysLeft <= 0) {
                Alert.alert("Error", "Invalid exam date");
                return;
            }

            const completedTopics = topicsManager.getCompletedTopics();
            const progressHash = generateProgressHash(completedTopics);

            let plan: TodaysPlan;

            if (forceRegenerate) {
                cacheManager.delete(
                    "study_plans",
                    `${selectedExam}-${daysLeft}-${cacheManager.generateCacheKey(
                        { selectedExam, daysLeft }
                    )}`
                );
                setIsFromCache(false);
            }

            plan = await studyPlanCache.getTodaysPlan(
                selectedExam,
                daysLeft,
                progressHash,
                async () => {
                    console.log(
                        `Generating new AI plan for ${selectedExam}`
                    );
                    return await getTodaysPlan(
                        daysLeft,
                        completedTopics,
                        selectedExam
                    );
                }
            );

            const wasFromCache =
                !forceRegenerate &&
                cacheManager.has(
                    "study_plans",
                    `${selectedExam}-${daysLeft}-${cacheManager.generateCacheKey(
                        { selectedExam, daysLeft }
                    )}`
                );
            setIsFromCache(wasFromCache);

            setTodaysPlan(plan);
        } catch (error) {
            console.error("Error generating plan:", error);
            Alert.alert("Error", "Failed to generate today's study plan");
        } finally {
            setIsLoadingPlan(false);
        }
    };

    const generateProgressHash = (completedTopics: any): string => {
        return cacheManager.generateCacheKey(completedTopics);
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await generateTodaysPlan(true);
        setRefreshing(false);
    }, [selectedExam]);

    const markTopicCompleted = (subject: string, topic: string) => {
        const isCompleted = topicsManager.isTopicCompleted(subject, topic);

        if (isCompleted) {
            topicsManager.markTopicNotCompleted(subject, topic);
        } else {
            topicsManager.markTopicCompleted(subject, topic);
        }

        setStudyStreak(topicsManager.getStudyStreak());

        const allCompleted = Object.keys(todaysPlan?.subjects || {}).every(
            (subj) =>
                (todaysPlan?.subjects[subj] || []).every((t) =>
                    topicsManager.isTopicCompleted(subj, t)
                )
        );

        if (allCompleted) {
            generateTodaysPlan(true);
        } else {
            const completedTopics = topicsManager.getCompletedTopics();
            const currentHash = generateProgressHash(completedTopics);

            const studyPlanKey = `${selectedExam}-${getDaysLeft(
                selectedExam
            )}-${cacheManager.generateCacheKey({
                selectedExam,
                getDaysLeft: getDaysLeft(selectedExam),
            })}`;
            if (cacheManager.has("study_plans", studyPlanKey)) {
                generateTodaysPlan(true);
            }
        }
    };

    function getDaysLeft(examType: Exam): number | null {
        const examConfig = config[examType];
        if (!examConfig || !examConfig.examDate) return null;

        const today = new Date();
        const examDate = new Date(examConfig.examDate);
        const diff = examDate.getTime() - today.setHours(0, 0, 0, 0);
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    }

    function getTodayString(): string {
        const today = new Date();
        return today.toISOString().split("T")[0];
    }

    const renderSubjectSection = (subject: string, topics: string[]) => {
        return (
            <Box key={subject}>
                <Text className="text-gray-500 dark:text-gray-300 text-lg font-semibold mb-2 text-center">
                    {subject}
                </Text>
                <Box className="gap-2 mt-2">
                    {topics.map((topic, index) => {
                        const isCompleted = topicsManager.isTopicCompleted(
                            subject,
                            topic
                        );
                        return (
                            <Box
                                key={index}
                                className="flex-row items-center justify-between">
                                <Text
                                    className={`text-sm ${
                                        isCompleted
                                            ? "text-green-500 line-through"
                                            : "text-black dark:text-white"
                                    }`}>
                                    {topic}
                                </Text>
                                <Box className="flex-row items-center gap-2">
                                    <Button
                                        action={"negative"}
                                        variant={"solid"}
                                        size={"sm"}
                                        isDisabled={false}>
                                        <ButtonIcon
                                            as={BadgeQuestionMark}
                                            size={16}
                                            color="white"
                                        />
                                    </Button>
                                    <Button
                                        action={"negative"}
                                        variant={"solid"}
                                        size={"sm"}
                                        isDisabled={false}>
                                        <ButtonIcon
                                            as={ScrollText}
                                            size={16}
                                            color="white"
                                        />
                                    </Button>
                                </Box>
                            </Box>
                        );
                    })}
                </Box>
            </Box>
        );
    };

    if (!selectedExam) {
        return (
            <Box className="flex-1 justify-center items-center p-4">
                <Text className="text-xl text-center">
                    Please select your exam preference in settings
                </Text>
            </Box>
        );
    }

    return (
        <ScrollView
            className="flex-1"
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }>
            <Box className="flex-1 p-4 mt-4">
                <Box className="flex-row justify-center items-center gap-3">
                    <Card
                        size={"lg"}
                        variant={"filled"}
                        className={`${
                            selectedExam === Exam.JEE
                                ? "bg-blue-600"
                                : "bg-green-600"
                        } w-64 border-2 dark:border-white`}>
                        <Heading size="" className={"text-white mb-1"}>
                            Exam in
                        </Heading>
                        <Text
                            size="3xl"
                            className="text-white font-bold ml-auto">
                            {getDaysLeft(selectedExam) !== null
                                ? `${getDaysLeft(selectedExam)} days`
                                : "Invalid Date"}
                        </Text>
                    </Card>
                    <Card
                        size={"lg"}
                        variant={"filled"}
                        className={`bg-yellow-500 dark:bg-yellow-500 border-2 dark:border-white`}>
                        <Heading size="" className={"text-white mb-1"}>
                            Current Streak
                        </Heading>
                        <Text
                            size="3xl"
                            className="text-white font-bold ml-auto">
                            {studyStreak}
                        </Text>
                    </Card>
                </Box>

                <Box className="flex-row items-center justify-between mt-6">
                    <Text className="text-gray-600 dark:text-white text-xl">
                        Daily Goals
                    </Text>
                </Box>

                <Box className="mt-6 bg-white dark:bg-typography-black p-4 rounded-lg">
                    {isLoadingPlan ? (
                        <Box className="gap-4">
                            <SkeletonText _lines={3} gap={2} />
                            <Divider />
                            <SkeletonText _lines={3} gap={2} />
                            <Divider />
                            <SkeletonText _lines={3} gap={2} />
                        </Box>
                    ) : todaysPlan ? (
                        <>
                            {Object.keys(todaysPlan.subjects).length === 0 ? (
                                <Box className="items-center py-8">
                                    <Text className="text-gray-800 dark:text-white text-center text-lg mb-2">
                                        🎉 All topics completed!
                                    </Text>
                                    <Text className="text-gray-600 dark:text-gray-400 text-center text-sm">
                                        Pull down to generate tomorrow's plan
                                    </Text>
                                </Box>
                            ) : (
                                <>
                                    {Object.entries(todaysPlan.subjects).map(
                                        ([subject, topics], index) => (
                                            <React.Fragment key={subject}>
                                                {renderSubjectSection(
                                                    subject,
                                                    topics
                                                )}
                                                {index <
                                                    Object.keys(
                                                        todaysPlan.subjects
                                                    ).length -
                                                        1 && (
                                                    <Divider
                                                        orientation={
                                                            "horizontal"
                                                        }
                                                        className="my-6 h-[1px]"
                                                    />
                                                )}
                                            </React.Fragment>
                                        )
                                    )}
                                </>
                            )}
                        </>
                    ) : (
                        <Text className="text-gray-800 dark:text-white text-center">
                            Pull down to refresh and generate today's study plan
                        </Text>
                    )}
                </Box>

                <Card className="mt-4 p-4">
                    <Text className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">
                        Overall Progress
                    </Text>
                    <Text className="text-2xl font-bold text-blue-600">
                        {topicsManager.getOverallProgress()}%
                    </Text>
                    <Text className="text-gray-500 dark:text-gray-400 text-sm">
                        Keep learning!
                    </Text>
                </Card>
            </Box>
        </ScrollView>
    );
}
