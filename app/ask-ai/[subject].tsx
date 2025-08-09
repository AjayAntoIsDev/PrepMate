import { Spinner } from "@/components/ui/spinner";
import colors from "tailwindcss/colors";

import React, { useState, useRef, useEffect } from "react";
import { KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Box } from "@/components/ui/box";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Input, InputField } from "@/components/ui/input";
import { ArrowLeft, Send, Loader2 } from "lucide-react-native";
import { chat, type Message, CEREBRAS_MODELS } from "@/app/utils/ai/sendPrompt";
import { generateNotes } from "@/app/utils/ai/generateNotes";
import config from "@/app/config.json";
import { topicsManager } from "@/app/utils/storage/storage";
interface ChatItem {
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
}
export default function AskAISubject() {
    const router = useRouter();
    const { subject, topic } = useLocalSearchParams<{
        subject: string;
        topic?: string;
    }>();
    const examType = topicsManager.getCurrentExamType();
    const subjectName = subject?.charAt(0).toUpperCase() + subject?.slice(1);
    const rawTopic = topic ? decodeURIComponent(topic) : undefined;
    const subjectTopics = (config as any)[examType].subjects[subjectName] || [];
    const [notes, setNotes] = useState<string>("");
    const [notesLoading, setNotesLoading] = useState<boolean>(!!rawTopic);
    const [notesError, setNotesError] = useState<string>("");
    const [messages, setMessages] = useState<ChatItem[]>([
        {
            id: "sys",
            role: "assistant",
            content: rawTopic,
        },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<ScrollView>(null);
    useEffect(() => {
        const loadNotes = async () => {
            if (!rawTopic) return;
            try {
                setNotesLoading(true);
                const result = await generateNotes({
                    subject: subjectName!,
                    topic: rawTopic,
                    exam: examType,
                });
                if (result.success && result.notes) {
                    setNotes(result.notes);
                    setMessages((prev) =>
                        prev.map((m) =>
                            m.id === "sys"
                                ? {
                                      ...m,
                                      content: `Got questions on ${rawTopic}?`,
                                  }
                                : m
                        )
                    );
                } else {
                    const err = result.error || "Failed to load notes";
                    setNotesError(err);
                    setMessages((prev) =>
                        prev.map((m) =>
                            m.id === "sys"
                                ? {
                                      ...m,
                                      content: `Could not load notes for ${rawTopic}. You can still ask questions.`,
                                  }
                                : m
                        )
                    );
                }
            } catch (e: any) {
                setNotesError(e.message);
                setMessages((prev) =>
                    prev.map((m) =>
                        m.id === "sys"
                            ? {
                                  ...m,
                                  content: `Error loading notes for ${rawTopic}. Proceed with your questions.`,
                              }
                            : m
                    )
                );
            } finally {
                setNotesLoading(false);
            }
        };
        loadNotes();
    }, [rawTopic, subjectName, examType]);
    const buildSystemContext = (): string => {
        const baseInstruction = `You are an AI tutor for the ${examType} exam. Subject: ${subjectName}.`;
        const focusTopic = rawTopic ? ` Focus Topic: ${rawTopic}.` : "";
        const getNotesSection = (): string => {
            if (!rawTopic) return "";
            if (notes) {
                return `
      STUDY NOTES FOR TOPIC (${rawTopic}):
      """
      ${notes.slice(0, 6000)}
      """
      (End of notes)
      `;
            }
            if (notesLoading) {
                return "\n\n(Notes still loading; answer based on prior knowledge.)";
            }
            if (notesError) {
                return `\n\n(Notes unavailable due to error: ${notesError})`;
            }
            return "";
        };
        const teachingGuidelines = `
      Guidelines:
      • Tailor answers to ${examType} exam style
      • If user's question is about a different topic, politely clarify
      • Use plain text formatting (no LaTeX)
      • Write formulas inline like: F = ma
      • Be concise but thorough in explanations
      • When relevant, reference sections from the provided notes
      • Focus on exam-relevant information and problem-solving techniques`;
        return [
            baseInstruction,
            focusTopic,
            getNotesSection(),
            teachingGuidelines,
        ].join("");
    };
    const sendMessage = async () => {
        if (!input.trim() || loading) return;
        const userMsg: ChatItem = {
            id: Date.now() + "-u",
            role: "user",
            content: input.trim(),
        };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setLoading(true);
        try {
            const systemContext = buildSystemContext();
            const chatMessages: Message[] = [
                {
                    role: "system",
                    content: systemContext,
                },
                ...messages
                    .filter((m) => m.role !== "system")
                    .map((m) => ({
                        role: m.role,
                        content: m.content,
                    })),
                {
                    role: "user",
                    content: userMsg.content,
                },
            ];
            const response = await chat(
                chatMessages,
                CEREBRAS_MODELS.LLAMA_3_3_70B,
                {
                    temperature: 0.6,
                    max_completion_tokens: 1200,
                }
            );
            const aiContent =
                response.choices[0]?.message?.content?.trim() || "No response.";
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now() + "-a",
                    role: "assistant",
                    content: aiContent,
                },
            ]);
        } catch (e: any) {
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now() + "-e",
                    role: "assistant",
                    content: `Error: ${e.message}`,
                },
            ]);
        } finally {
            setLoading(false);
            setTimeout(() => {
                scrollRef.current?.scrollToEnd({
                    animated: true,
                });
            }, 50);
        }
    };
    const handleBackPress = () => router.back();
    const getBubbleColor = (role: string) => {
        if (role === "user") return "bg-background-300 dark:bg-background-600";
        return "bg-background-100 dark:bg-background-200";
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
                                        Ask AI
                                    </Heading>
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

            <KeyboardAvoidingView
                style={{
                    flex: 1,
                }}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                keyboardVerticalOffset={88}>
                <ScrollView
                    ref={scrollRef}
                    contentContainerStyle={{
                        padding: 24,
                        paddingBottom: 120,
                    }}
                    onContentSizeChange={() =>
                        scrollRef.current?.scrollToEnd({
                            animated: true,
                        })
                    }>
                    <VStack className="space-y-4 gap-4">
                        {messages.map((m) => (
                            <Box
                                key={m.id}
                                className={`
                  rounded-2xl px-4 py-3 max-w-[90%] shadow-sm
                  ${m.role === "user" ? "self-end" : "self-start"} 
                  ${getBubbleColor(m.role)}
                `}>
                                <Text
                                    className={`text-lg ${
                                        m.role === "user"
                                            ? "text-black"
                                            : "text-typography-900 dark:text-white"
                                    }`}>
                                    {m.content}
                                </Text>
                            </Box>
                        ))}

                        {loading && (
                            <Box className="rounded-2xl px-4 py-3 self-start bg-background-100 dark:bg-background-200">
                                <HStack className="items-center space-x-2 gap-2">
                                    <Spinner
                                        size={"small"}
                                        color={"white"}
                                    />
                                    <Text className="text-lg text-typography-600 dark:text-white">
                                        Thinking...
                                    </Text>
                                </HStack>
                            </Box>
                        )}
                    </VStack>
                </ScrollView>

                <Box className="absolute bottom-0 left-0 right-0 p-4 bg-background-0 dark:bg-background-0 border-t border-outline-200 dark:border-outline-100 mb-6">
                    <HStack className="space-x-2 items-center gap-3">
                        <Input className="flex-1" size="lg">
                            <InputField
                                value={input}
                                onChangeText={setInput}
                                placeholder={`Ask about anything`}
                                onSubmitEditing={sendMessage}
                                returnKeyType="send"
                            />
                        </Input>

                        <Button
                            variant="solid"
                            action="primary"
                            size="md"
                            onPress={sendMessage}
                            isDisabled={loading || !input.trim()}>
                            <ButtonIcon as={Send} />
                        </Button>
                    </HStack>
                </Box>
            </KeyboardAvoidingView>
        </Box>
    );
}
