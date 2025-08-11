import { Spinner } from "@/components/ui/spinner";
import colors from "tailwindcss/colors";

import React, { useState, useEffect } from "react";
import { ScrollView, useColorScheme, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Center } from "@/components/ui/center";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Box } from "@/components/ui/box";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Card } from "@/components/ui/card";
import {
    ArrowLeft,
    RefreshCw,
    CheckCircle,
    XCircle,
    RotateCcw,
} from "lucide-react-native";
import { topicsManager } from "@/app/utils/storage/storage";
import {
    generateQuiz,
    type Quiz,
    type QuizQuestion,
} from "@/app/utils/ai/generateQuiz";
import { CircleCheckBig } from "lucide-react-native";
type QuizState = "loading" | "ready" | "in-progress" | "completed" | "error";
export default function TopicQuiz() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const { subject, topic } = useLocalSearchParams<{
        subject: string;
        topic: string;
    }>();
    const topicName = decodeURIComponent(topic);
    
    const [quizState, setQuizState] = useState<QuizState>("loading");
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
    const [showExplanation, setShowExplanation] = useState(false);
    const [score, setScore] = useState(0);
    const [error, setError] = useState<string>("");
    const [wasAlreadyCompleted, setWasAlreadyCompleted] = useState(false);
    const handleBackPress = () => {
        router.back();
    };
    const getSubjectColor = (subject: string) => {
        console.log(subject)
        const subjectColors: {
            [key: string]: string;
        } = {
            physics: "bg-blue-400",
            chemistry: "bg-green-400",
            mathematics: "bg-red-400",
            maths: "bg-red-400",
            biology: "bg-rose-400",
        };
        return subjectColors[subject.toLowerCase()] || "bg-blue-400";
    };
    const loadQuiz = async () => {
        try {
            setQuizState("loading");

            setWasAlreadyCompleted(
                topicsManager.isTopicCompleted(subject!, topicName, "quiz")
            );
            const examType = topicsManager.getCurrentExamType();
            const result = await generateQuiz({
                subject: subject,
                topic: topicName,
                exam: examType,
                difficulty: "medium",
                questionCount: 5,
            });
            if (result.success && result.quiz) {
                setQuiz(result.quiz);
                setSelectedAnswers(
                    new Array(result.quiz.questions.length).fill(-1)
                );
                setQuizState("ready");
            } else {
                const errorMessage = result.error || "Failed to generate quiz";
                setError(errorMessage);
                setQuizState("error");
            }
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Unknown error occurred";
            setError(errorMessage);
            setQuizState("error");
        }
    };
    const startQuiz = () => {
        setQuizState("in-progress");
        setCurrentQuestionIndex(0);
        setShowExplanation(false);
    };
    const selectAnswer = (answerIndex: number) => {
        if (showExplanation) return;
        const newAnswers = [...selectedAnswers];
        newAnswers[currentQuestionIndex] = answerIndex;
        setSelectedAnswers(newAnswers);
    };
    const submitAnswer = () => {
        if (selectedAnswers[currentQuestionIndex] === -1) {
            Alert.alert(
                "Please select an answer",
                "You must select an answer before proceeding."
            );
            return;
        }
        setShowExplanation(true);
    };
    const nextQuestion = () => {
        if (currentQuestionIndex < quiz!.questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            setShowExplanation(false);
        } else {
            finishQuiz();
        }
    };
    const finishQuiz = () => {
        const correctAnswers = selectedAnswers.reduce(
            (count, answer, index) => {
                return (
                    count +
                    (answer === quiz!.questions[index].correctAnswer ? 1 : 0)
                );
            },
            0
        );
        setScore(correctAnswers);

        // Mark topic as completed if score is 70% or higher
        const scorePercentage = (correctAnswers / quiz!.totalQuestions) * 100;
        if (scorePercentage >= 70 && !wasAlreadyCompleted) {
            topicsManager.markTopicCompleted(subject!, topicName, "quiz");
        }
        setQuizState("completed");
    };
    const retryQuiz = () => {
        setWasAlreadyCompleted(
            topicsManager.isTopicCompleted(subject!, topicName, "quiz")
        );
        setSelectedAnswers(new Array(quiz!.questions.length).fill(-1));
        setCurrentQuestionIndex(0);
        setShowExplanation(false);
        setScore(0);
        setQuizState("ready");
    };
    useEffect(() => {
        loadQuiz();
    }, [topicName, subject]);
    const currentQuestion = quiz?.questions[currentQuestionIndex];
    const selectedAnswer = selectedAnswers[currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion?.correctAnswer;
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
                                            {subject} Quiz
                                        </Text>
                                        {quizState === "in-progress" &&
                                            quiz && (
                                                <Text className="text-typography-600 dark:text-typography-400 text-sm">
                                                    ({currentQuestionIndex + 1}/
                                                    {quiz.totalQuestions})
                                                </Text>
                                            )}
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
                {quizState === "loading" && (
                    <Card className="p-6 mt-56">
                        <VStack className="items-center space-y-4">
                            <Box
                                className={`w-16 h-16 ${getSubjectColor(
                                    subject
                                )} rounded-xl items-center justify-center`}>
                                <Spinner
                                    size={"large"}
                                    color="white"
                                />
                            </Box>
                            <VStack className="items-center space-y-2 mt-6">
                                <Text className="text-typography-900 dark:text-white font-semibold text-lg">
                                    Generating Quiz...
                                </Text>
                                <Text className="text-typography-600 dark:text-typography-400 text-center">
                                    Creating questions for{" "}
                                    {topicName}
                                </Text>
                            </VStack>
                        </VStack>
                    </Card>
                )}

                {quizState === "ready" && quiz && (
                    <VStack className="space-y-6 mt-56">
                        <Card className="p-6">
                            <VStack className="space-y-4">
                                <Box className="items-center mb-8">
                                    <Box
                                        className={`w-16 h-16 rounded-xl items-center justify-center`}>
                                        <CircleCheckBig
                                            size={32}
                                            color={
                                                colorScheme === "dark"
                                                    ? "white"
                                                    : "black"
                                            }
                                        />
                                    </Box>
                                    <Heading className="text-typography-900 dark:text-white font-bold text-xl text-center">
                                        Ready to start the quiz?
                                    </Heading>
                                </Box>

                                <VStack className="space-y-3">
                                    {wasAlreadyCompleted && (
                                        <Box className="bg-green-100 dark:bg-green-900 px-3 py-2 rounded-lg mb-2">
                                            <Text className="text-green-800 dark:text-green-200 font-semibold text-sm text-center">
                                                ✅ Already Completed
                                            </Text>
                                        </Box>
                                    )}

                                    <HStack className="justify-between">
                                        <Text className="text-typography-600 dark:text-typography-400">
                                            Questions:
                                        </Text>
                                        <Text className="text-typography-900 dark:text-white font-semibold">
                                            {quiz.totalQuestions}
                                        </Text>
                                    </HStack>
                                    <HStack className="justify-between">
                                        <Text className="text-typography-600 dark:text-typography-400">
                                            Estimated Time:
                                        </Text>
                                        <Text className="text-typography-900 dark:text-white font-semibold">
                                            {quiz.estimatedTime} minutes
                                        </Text>
                                    </HStack>
                                </VStack>

                                <Button
                                    variant="solid"
                                    action="primary"
                                    size="lg"
                                    onPress={startQuiz}
                                    className="w-full mt-4">
                                    <ButtonText className="font-semibold">
                                        Start Quiz
                                    </ButtonText>
                                </Button>
                            </VStack>
                        </Card>
                    </VStack>
                )}

                {quizState === "in-progress" && currentQuestion && (
                    <VStack className="space-y-6">
                        <Card className="">
                            <VStack className="space-y-4">
                                <Text className="text-typography-900 dark:text-white font-semibold text-lg leading-relaxed">
                                    {currentQuestion.question}
                                </Text>

                                <VStack className="space-y-3 mt-4 gap-4">
                                    {currentQuestion.options.map(
                                        (option, index) => {
                                            const isSelected =
                                                selectedAnswer === index;
                                            const isCorrectOption =
                                                index ===
                                                currentQuestion.correctAnswer;
                                            let buttonAction:
                                                | "primary"
                                                | "positive"
                                                | "negative"
                                                | "secondary" = "secondary";
                                            if (showExplanation) {
                                                if (isCorrectOption) {
                                                    buttonAction = "positive";
                                                } else if (
                                                    isSelected &&
                                                    !isCorrectOption
                                                ) {
                                                    buttonAction = "negative";
                                                }
                                            } else if (isSelected) {
                                                buttonAction = "primary";
                                            }
                                            return (
                                                <Button
                                                    key={index}
                                                    variant="outline"
                                                    action={buttonAction}
                                                    size="md"
                                                    onPress={() =>
                                                        selectAnswer(index)
                                                    }
                                                    className="w-full justify-start p-4">
                                                    <HStack className="items-center space-x-3">
                                                        <Text className="font-semibold text-sm">
                                                            {/*Fancy ASCII trick yay*/}
                                                            {String.fromCharCode(
                                                                65 + index
                                                            )}
                                                            .
                                                        </Text>
                                                        <Text className="flex-1 text-left">
                                                            {option}
                                                        </Text>
                                                        {showExplanation &&
                                                            isCorrectOption && (
                                                                <CheckCircle
                                                                    size={20}
                                                                    color="green"
                                                                />
                                                            )}
                                                        {showExplanation &&
                                                            isSelected &&
                                                            !isCorrectOption && (
                                                                <XCircle
                                                                    size={20}
                                                                    color="red"
                                                                />
                                                            )}
                                                    </HStack>
                                                </Button>
                                            );
                                        }
                                    )}
                                </VStack>

                                {showExplanation && (
                                    <Card
                                        className="p-4 mt-4"
                                        variant="outline">
                                        <VStack className="space-y-2">
                                            <Text className="text-typography-900 dark:text-white font-semibold">
                                                Explanation:
                                            </Text>
                                            <Text className="text-typography-700 dark:text-typography-300">
                                                {currentQuestion.yap}
                                            </Text>
                                        </VStack>
                                    </Card>
                                )}

                                <HStack className="justify-between mt-6">
                                    {!showExplanation ? (
                                        <Button
                                            variant="solid"
                                            action="primary"
                                            size="md"
                                            onPress={submitAnswer}
                                            isDisabled={selectedAnswer === -1}
                                            className="flex-1">
                                            <ButtonText>
                                                Submit Answer
                                            </ButtonText>
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="solid"
                                            action="primary"
                                            size="md"
                                            onPress={nextQuestion}
                                            className="flex-1">
                                            <ButtonText>
                                                {currentQuestionIndex <
                                                quiz!.questions.length - 1
                                                    ? "Next Question"
                                                    : "Finish Quiz"}
                                            </ButtonText>
                                        </Button>
                                    )}
                                </HStack>
                            </VStack>
                        </Card>
                    </VStack>
                )}

                {quizState === "completed" && quiz && (
                    <VStack className="space-y-6">
                        <Card className="p-6">
                            <VStack className="items-center space-y-4">
                                <Box
                                    className={`w-20 h-20 ${
                                        score >= quiz.totalQuestions * 0.8
                                            ? "bg-green-500"
                                            : score >= quiz.totalQuestions * 0.6
                                            ? "bg-yellow-500"
                                            : "bg-red-500"
                                    } rounded-xl items-center justify-center`}>
                                    <Text className="text-white text-3xl">
                                        {score >= quiz.totalQuestions * 0.8
                                            ? "🎉"
                                            : score >= quiz.totalQuestions * 0.6
                                            ? "👍"
                                            : "📚"}
                                    </Text>
                                </Box>

                                <VStack className="items-center space-y-2 mt-4">
                                    <Heading className="text-typography-900 dark:text-white font-bold text-2xl">
                                        Quiz Completed!
                                    </Heading>
                                    <Text className="text-typography-600 dark:text-typography-400 text-center">
                                        You scored {score} out of{" "}
                                        {quiz.totalQuestions}
                                    </Text>
                                    <Text className="text-typography-900 dark:text-white font-semibold text-xl">
                                        {Math.round(
                                            (score / quiz.totalQuestions) * 100
                                        )}
                                        %
                                    </Text>

                                    {(score / quiz.totalQuestions) * 100 >=
                                        70 && (
                                        <Box className="bg-green-100 dark:bg-green-900 px-3 py-2 rounded-lg mt-2">
                                            <Text className="text-green-800 dark:text-green-200 font-semibold text-sm">
                                                {wasAlreadyCompleted
                                                    ? "Topic Already Completed"
                                                    : "Topic Completed!"}
                                            </Text>
                                        </Box>
                                    )}
                                </VStack>

                                <VStack className="space-y-3 w-full mt-6 gap-3">
                                    <Button
                                        variant="solid"
                                        action="primary"
                                        size="md"
                                        onPress={retryQuiz}
                                        className="w-full">
                                        <ButtonIcon as={RotateCcw} />
                                        <ButtonText className="ml-2">
                                            Retry Quiz
                                        </ButtonText>
                                    </Button>

                                    <Button
                                        variant="outline"
                                        action="secondary"
                                        size="md"
                                        onPress={handleBackPress}
                                        className="w-full">
                                        <ButtonText>Back to Topics</ButtonText>
                                    </Button>
                                </VStack>
                            </VStack>
                        </Card>
                    </VStack>
                )}

                {quizState === "error" && (
                    <Card className="p-6">
                        <VStack className="items-center space-y-4 gap-3">
                            <Box className="w-16 h-16 bg-red-500 rounded-xl items-center justify-center">
                                <Text className="text-white text-2xl">❌</Text>
                            </Box>
                            <VStack className="items-center space-y-2">
                                <Heading className="text-typography-900 dark:text-white font-bold text-xl text-center">
                                    Quiz Generation Failed
                                </Heading>
                                <Text className="text-typography-600 dark:text-typography-400 text-center">
                                    {error === "AI returned invalid JSON format"
                                        ? "The AI returned an invalid JSON format. Just try again."
                                        : error}
                                </Text>
                            </VStack>
                            <Button
                                variant="solid"
                                action="primary"
                                size="md"
                                onPress={loadQuiz}
                                className="w-full">
                                <ButtonIcon as={RefreshCw} />
                                <ButtonText className="ml-2">
                                    Try Again
                                </ButtonText>
                            </Button>
                        </VStack>
                    </Card>
                )}
            </ScrollView>
        </Box>
    );
}
