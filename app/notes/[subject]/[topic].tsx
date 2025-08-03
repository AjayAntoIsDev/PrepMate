import React from "react";
import { ScrollView } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Center } from "@/components/ui/center";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Box } from "@/components/ui/box";
import { Button } from "@/components/ui/button";

export default function TopicNotes() {
    const router = useRouter();
    const { subject, topic } = useLocalSearchParams<{
        subject: string;
        topic: string;
    }>();

    const subjectName =
        subject?.charAt(0).toUpperCase() + subject?.slice(1) || "";
    const topicName = decodeURIComponent(topic || "");

    const handleBackPress = () => {
        router.back();
    };

    return (
        <ScrollView className="flex-1 bg-background">
            <Box className="p-6">
                <Button
                    variant="ghost"
                    size="sm"
                    onPress={handleBackPress}
                    className="self-start mb-4">
                    <Text>← Back to Topics</Text>
                </Button>

                <Heading className="font-bold text-2xl mb-2">
                    {topicName}
                </Heading>
                <Text className="text-muted-foreground mb-6">
                    {subjectName}
                </Text>

                {/* This is where you'll implement the actual notes content */}
                <Box className="bg-card rounded-xl p-6 border border-border">
                    <Center>
                        <Text className="text-center text-muted-foreground">
                            Notes content for "{topicName}" will be implemented
                            here.
                        </Text>
                        <Text className="text-center text-muted-foreground mt-4">
                            Subject: {subjectName}
                        </Text>
                    </Center>
                </Box>
            </Box>
        </ScrollView>
    );
}
