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
import Markdown from "react-native-marked";
import { generateNotes, clearNotesCache, hasNotesInCache } from "@/app/utils/ai/generateNotes";
import { topicsManager } from "@/app/utils/storage/storage";

export default function TopicNotes() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const { subject, topic } = useLocalSearchParams<{
        subject: string;
        topic: string;
    }>();

    const subjectName =
        subject?.charAt(0).toUpperCase() + subject?.slice(1) ;
    const topicName = decodeURIComponent(topic );
    
    const [markdownContent, setMarkdownContent] = useState<string>("");
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

    const getMarkdownTheme = () => {
        const isDark = colorScheme === 'dark';
        return {
            colors: {
                text: isDark ? "#ffffff" : "#1a1a1a",
                border: isDark ? "#404040" : "#e0e0e0",
                notification: isDark ? "#0A84FF" : "#007AFF",
                code: isDark ? "#2d2d2d" : "#f5f5f5",
            },
            fonts: {
                body: "System",
                heading: "System",
                monospace: "Courier",
            },
            spacing: {
                s1: 4,
                s2: 8,
                s3: 12,
                s4: 16,
            },
        };
    };

    const loadNotesContent = async () => {
        try {
            const examType = topicsManager.getCurrentExamType();
            const cachedExists = hasNotesInCache(subjectName, topicName, examType);
            
            const result = await generateNotes({
                subject: subjectName,
                topic: topicName,
                exam: examType
            });

            if (result.success && result.notes) {
                setMarkdownContent(result.notes);
            } else {
                const errorMessage = result.error || "Failed to generate notes";
                setError(errorMessage);
                console.error("Error generating notes:", errorMessage);
                
                setMarkdownContent(`# Oops an error occurred while generating notes for ${topicName} in ${subjectName}.\n\n## Error Details\n\n${errorMessage}`);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
            setError(errorMessage);
            console.error("Error in loadNotesContent:", error);
            
            setMarkdownContent(`# ${topicName} - ${subjectName} Study Notes

## Error Loading Content

We encountered an unexpected error while generating notes for this topic.

**Error:** ${errorMessage}

Please try again or contact support if the issue persists.`);
        }
    };

    useEffect(() => {
        const loadMarkdownContent = async () => {
            setIsLoading(true);
            await loadNotesContent();
            setIsLoading(false);
        };

        loadMarkdownContent();
    }, [topicName, subjectName]);

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
                                            {subjectName}
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
                {isLoading ? (
                    <Box className="bg-background-0 dark:bg-background-100 rounded-2xl border border-outline-200 dark:border-outline-100 shadow-sm">
                        <HStack className="p-5 items-center space-x-4">
                            <Box
                                className={`w-12 h-12 ${getSubjectColor(
                                    subjectName
                                )} rounded-xl items-center justify-center`}>
                                <Text className="text-white text-lg font-bold">
                                    ⏳
                                </Text>
                            </Box>
                            <VStack className="flex-1 space-y-1 ml-4">
                                <Text className="text-typography-900 dark:text-white font-semibold text-lg leading-tight">
                                    Loading notes...
                                </Text>
                                <Text className="text-typography-600 dark:text-typography-400 text-sm">
                                    This may take a moment
                                </Text>
                            </VStack>
                        </HStack>
                    </Box>
                ) : (
                    <Box className="bg-background-50 dark:bg-white ">
                        <Markdown
                            value={markdownContent}
                            flatListProps={{
                                scrollEnabled: false,
                                style: {
                                    backgroundColor:
                                        colorScheme === "dark"
                                            ? "#151515"
                                            : "#f8f8f8",
                                },
                            }}
                            theme={getMarkdownTheme()}
                        />
                    </Box>
                )}
            </ScrollView>
        </Box>
    );
}
