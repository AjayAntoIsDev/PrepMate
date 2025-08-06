import React from "react";
import {
    TouchableOpacity,
    ScrollView,
    FlatList,
    Dimensions,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Center } from "@/components/ui/center";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Box } from "@/components/ui/box";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Icon } from "@/components/ui/icon";
import { ArrowLeft } from "lucide-react-native";
import { topicsManager } from "@/app/utils/storage/storage";

export default function QuizSubjectTopics() {
    const router = useRouter();
    const { subject } = useLocalSearchParams<{ subject: string }>();
    const { width } = Dimensions.get("window");

    const subjectName =
        subject?.charAt(0).toUpperCase() + subject?.slice(1);
    const topics = topicsManager.getSubjectTopics(subjectName);

    const handleTopicPress = (topic: string) => {
        router.push(`/quiz/${subject}/${encodeURIComponent(topic)}`);
    };

    const handleBackPress = () => {
        router.push("/tabs/quiz");
    };

    const getSubjectColor = (subject: string) => {
        const subjectColors: { [key: string]: string } = {
            'physics': 'bg-blue-400',
            'chemistry': 'bg-green-400',
            'mathematics': 'bg-red-400',
            'maths': 'bg-red-400',
            'biology': 'bg-rose-400'
        };
        return subjectColors[subject.toLowerCase()] || 'bg-blue-400';
    };

    const renderTopicItem = ({
        item: topic,
        index,
    }: {
        item: string;
        index: number;
    }) => (
        <TouchableOpacity
            onPress={() => handleTopicPress(topic)}
            className="mb-4"
        >
            <Box className="bg-background-0 dark:bg-background-100 rounded-2xl border border-outline-200 dark:border-outline-100 shadow-sm">
                <HStack className="p-5 items-center space-x-4">
                    <Box
                        className={`w-12 h-12 ${getSubjectColor(
                            subjectName
                        )} rounded-xl items-center justify-center`}>
                        <Text className="text-white text-lg font-bold">
                            📝
                        </Text>
                    </Box>
                    <VStack className="flex-1 space-y-1 ml-4">
                        <Text className="text-typography-900 dark:text-white font-semibold text-lg leading-tight">
                            {topic}
                        </Text>
                    </VStack>
                </HStack>
            </Box>
        </TouchableOpacity>
    );

    return (
        <Box className="flex-1 bg-background-0 dark:bg-background-0">
            <Box className="bg-background-0 dark:bg-background-0 border-b border-outline-200 dark:border-outline-100">
                <Box className="px-6 pt-6 ">
                    <VStack className="space-y-3">
                        <HStack className="flex justify-between items-center">
                            <Box>
                                <VStack className="flex-1 space-y-1">
                                    <Heading className="text-typography-900 dark:text-white font-bold text-2xl">
                                        {subjectName} Quiz
                                    </Heading>
                                </VStack>
                            </Box>
                            <Button
                                variant="solid"
                                action="secondary"
                                size="sm"
                                onPress={handleBackPress}
                                className="self-start mb-6 -ml-2">
                                <ButtonIcon as={ArrowLeft} />
                                <ButtonText className="font-medium text-sm text-typography-900">
                                    Back
                                </ButtonText>
                            </Button>
                        </HStack>
                    </VStack>
                </Box>
            </Box>

            {topics.length > 0 ? (
                <FlatList
                    data={topics}
                    renderItem={renderTopicItem}
                    keyExtractor={(item, index) => `${item}-${index}`}
                    contentContainerStyle={{
                        padding: 24,
                        paddingBottom: 100,
                    }}
                    showsVerticalScrollIndicator={false}
                    ItemSeparatorComponent={() => <Box className="h-0" />}
                />
            ) : (
                <Center className="flex-1 px-8">
                    <VStack className="items-center space-y-4">
                        <Box className="w-24 h-24 bg-background-100 dark:bg-background-200 rounded-full items-center justify-center">
                            <Text className="text-4xl">📝</Text>
                        </Box>
                        <VStack className="items-center space-y-2">
                            <Text className="text-typography-800 dark:text-typography-200 font-semibold text-xl text-center">
                                No Quizzes Yet
                            </Text>
                            <Text className="text-typography-600 dark:text-typography-400 text-center text-base leading-relaxed">
                                No quizzes available
                            </Text>
                        </VStack>
                    </VStack>
                </Center>
            )}
        </Box>
    );
}
