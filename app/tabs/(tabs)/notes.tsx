import React from "react";
import { TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Center } from "@/components/ui/center";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Box } from "@/components/ui/box";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { View } from "@/components/ui/view";
import { settingsManager, topicsManager } from "@/app/utils/storage/storage";
import {ArrowRight} from "lucide-react-native";

export default function Notes() {
    const router = useRouter();
    const currentExam = topicsManager.getCurrentExamType();

    const handleSubjectPress = (subject: string) => {
        router.push(`/topics/${subject.toLowerCase()}`);
    };

    return (
        <ScrollView className="flex-1 bg-gray-50 dark:bg-black">
            <VStack space="lg" className="px-6 py-8">
                <TouchableOpacity
                    onPress={() => handleSubjectPress("Physics")}
                    className="transform transition-transform active:scale-[0.98]">
                    <Box className="rounded-3xl overflow-hidden border-2 dark:border-white bg-blue-400">
                        <HStack space="lg" className="p-6 items-center">
                            <Center className="w-20 h-20 rounded-2xl shadow-md bg-blue-200">
                                <Text className="text-4xl">⚛️</Text>
                            </Center>

                            <VStack space="sm" className="flex-1">
                                <HStack className="items-center justify-between">
                                    <Heading className="text-2xl font-bold">
                                        Physics
                                    </Heading>
                                    <View className="p-3 rounded-xl shadow-sm bg-indigo-500">
                                        <Text className="text-white text-lg font-bold">
                                            <ArrowRight color="white" />
                                        </Text>
                                    </View>
                                </HStack>
                            </VStack>
                        </HStack>
                    </Box>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => handleSubjectPress("Chemistry")}
                    className="transform transition-transform active:scale-[0.98]">
                    <Box className="rounded-3xl overflow-hidden border-2 dark:border-white bg-green-400">
                        <HStack space="lg" className="p-6 items-center">
                            <Center className="w-20 h-20 rounded-2xl shadow-md bg-green-200">
                                <Text className="text-4xl">🧪</Text>
                            </Center>

                            <VStack space="sm" className="flex-1">
                                <HStack className="items-center justify-between">
                                    <Heading className="text-2xl font-bold">
                                        Chemistry
                                    </Heading>
                                    <View className="p-3 rounded-xl shadow-sm bg-indigo-500">
                                        <Text className="text-white text-lg font-bold">
                                            <ArrowRight color="white" />
                                        </Text>
                                    </View>
                                </HStack>
                            </VStack>
                        </HStack>
                    </Box>
                </TouchableOpacity>

                {currentExam === "JEE" ? (
                    <TouchableOpacity
                        onPress={() => handleSubjectPress("Mathematics")}
                        className="transform transition-transform active:scale-[0.98]">
                        <Box className="rounded-3xl overflow-hidden border-2 dark:border-white  bg-red-400">
                            <HStack space="lg" className="p-6 items-center">
                                <Center className="w-20 h-20 rounded-2xl shadow-md bg-red-200">
                                    <Text className="text-4xl">📐</Text>
                                </Center>

                                <VStack space="sm" className="flex-1">
                                    <HStack className="items-center justify-between">
                                        <Heading className="text-2xl font-bold ">
                                            Maths
                                        </Heading>
                                        <View className="p-3 rounded-xl shadow-sm bg-indigo-500">
                                            <Text className="text-white text-lg font-bold">
                                                <ArrowRight color="white" />
                                            </Text>
                                        </View>
                                    </HStack>
                                </VStack>
                            </HStack>
                        </Box>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        onPress={() => handleSubjectPress("Biology")}
                        className="transform transition-transform active:scale-[0.98]">
                        <Box className="rounded-3xl overflow-hidden border-2 dark:border-white  bg-rose-400">
                            <HStack space="lg" className="p-6 items-center">
                                <Center className="w-20 h-20 rounded-2xl shadow-md bg-rose-200">
                                    <Text className="text-4xl">🧬</Text>
                                </Center>

                                <VStack space="sm" className="flex-1">
                                    <HStack className="items-center justify-between">
                                        <Heading className="text-2xl font-bold ">
                                            Biology
                                        </Heading>
                                        <View className="p-3 rounded-xl shadow-sm bg-indigo-500">
                                            <Text className="text-white text-lg font-bold">
                                                <ArrowRight color="white" />
                                            </Text>
                                        </View>
                                    </HStack>
                                </VStack>
                            </HStack>
                        </Box>
                    </TouchableOpacity>
                )}
            </VStack>
        </ScrollView>
    );
}
