import React from "react";
import { TouchableOpacity, ScrollView, FlatList } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Center } from "@/components/ui/center";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Box } from "@/components/ui/box";
import { Button } from "@/components/ui/button";
import { topicsManager } from "@/app/utils/storage/storage";

export default function SubjectTopics() {
    const router = useRouter();
    const { subject } = useLocalSearchParams<{ subject: string }>();

    const subjectName =
        subject?.charAt(0).toUpperCase() + subject?.slice(1) || "";
    const topics = topicsManager.getSubjectTopics(subjectName);

    const handleTopicPress = (topic: string) => {
        router.push(`/notes/${subject}/${encodeURIComponent(topic)}`);
    };

    const handleBackPress = () => {
        router.push('/tabs/notes');
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
            className="mb-3">
            <Box className="bg-card rounded-lg p-4 border border-border">
                <Text className="text-foreground font-medium text-base">
                    {topic}
                </Text>
                <Text className="text-muted-foreground text-sm mt-1">
                    Tap to read notes
                </Text>
            </Box>
        </TouchableOpacity>
    );

    return (
        <Box className="flex-1 bg-background">
            <Box className="p-6 pb-4">
                <Button
                    variant="ghost"
                    size="sm"
                    onPress={handleBackPress}
                    className="self-start mb-4">
                    <Text>← Back</Text>
                </Button>

                <Heading className="font-bold text-2xl mb-2">
                    {subjectName} Topics
                </Heading>
                <Text className="text-muted-foreground">
                    Select a topic to study
                </Text>
            </Box>

            {topics.length > 0 ? (
                <FlatList
                    data={topics}
                    renderItem={renderTopicItem}
                    keyExtractor={(item, index) => `${item}-${index}`}
                    contentContainerStyle={{ padding: 24, paddingTop: 0 }}
                    showsVerticalScrollIndicator={false}
                />
            ) : (
                <Center className="flex-1">
                    <Text className="text-muted-foreground text-center">
                        No topics available for {subjectName}
                    </Text>
                </Center>
            )}
        </Box>
    );
}
