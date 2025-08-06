import React, { useState, useEffect } from "react";
import { ScrollView, useColorScheme } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Center } from "@/components/ui/center";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Box } from "@/components/ui/box";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { ArrowLeft, RefreshCw, Trash2 } from "lucide-react-native";
import { topicsManager } from "@/app/utils/storage/storage";

export default function TopicQuiz() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const { subject, topic } = useLocalSearchParams<{
        subject: string;
        topic: string;
    }>();

    const subjectName =
        subject?.charAt(0).toUpperCase() + subject?.slice(1);
    const topicName = decodeURIComponent(topic);
    
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>("");

    const handleBackPress = () => {
        router.back();
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

    return (
        <Box className="flex-1 bg-background-0 dark:bg-background-0">
            <Box className="bg-background-0 dark:bg-background-0 border-b border-outline-200 dark:border-outline-100">
                <Box className="px-6 pt-6 pb-6">
                    <VStack className="space-y-3">
                        <HStack className="flex justify-between items-center">
                            <Box>
                                <VStack className="flex-1 space-y-1">
                                    <Heading className="text-typography-900 dark:text-white font-bold text-2xl w-64">
                                        {topicName}
                                    </Heading>
                                    <HStack className="items-center space-x-2">
                                        <Text className="text-typography-600 dark:text-typography-400 text-base">
                                            {subjectName} Quiz
                                        </Text>
                                    </HStack>
                                </VStack>
                            </Box>
                            <HStack className="space-x-2">
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
                        </HStack>
                    </VStack>
                </Box>
            </Box>

            <ScrollView
                contentContainerStyle={{
                    padding: 24,
                    paddingBottom: 100,
                }}
                showsVerticalScrollIndicator={false}>
            </ScrollView>
        </Box>
    );
}
