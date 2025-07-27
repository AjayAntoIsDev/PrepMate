import React, { useEffect, useMemo } from "react";
import {
    Button,
    ButtonText,
    ButtonSpinner,
    ButtonIcon,
} from "@/components/ui/button";
import { Center } from "@/components/ui/center";
import { Text } from "@/components/ui/text";
import { Box } from "@/components/ui/box";
import { useRouter } from "expo-router";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
} from "react-native-reanimated";
import {
    BookOpenCheck,
    NotepadText,
    GraduationCap,
    BookText,
    Laptop,
    ArrowRight,
} from "lucide-react-native";
import { useTheme } from "@/contexts/ThemeContext";
function FloatingIcon({
    icon: IconComponent,
    size = 64,
    color = "black",
    style,
}) {
    const initialRotation = useMemo(() => Math.random() * 40 - 20, []);
    const phaseX = useMemo(() => Math.random() * Math.PI * 2, []);
    const phaseY = useMemo(() => Math.random() * Math.PI * 2, []);
    const phaseR = useMemo(() => Math.random() * Math.PI * 2, []);
    const initialT = useMemo(() => Math.random() * 1000, []);
    const t = useSharedValue(initialT);
    useEffect(() => {
        t.value = withRepeat(
            withTiming(initialT + 1000, {
                duration: 10000,
            }),
            -1,
            false
        );
    }, []);
    const animatedStyle = useAnimatedStyle(() => {
        const time = (t.value / 1000) * Math.PI * 2;
        const translateX = Math.sin(time + phaseX) * 10;
        const translateY = Math.cos(time + phaseY) * 10;
        const rotateZ = `${initialRotation + Math.sin(time + phaseR) * 8}deg`;
        return {
            transform: [
                {
                    translateX,
                },
                {
                    translateY,
                },
                {
                    rotateZ,
                },
            ],
        };
    });
    const AnimatedIcon = Animated.createAnimatedComponent(IconComponent);
    return (
        <Animated.View style={[animatedStyle, style]}>
            <AnimatedIcon size={size} color={color} />
        </Animated.View>
    );
}
export default function OnboardingStep1() {
    const { colorScheme } = useTheme();
    const router = useRouter();
    const handleNext = () => {
        router.push("/onboarding/step2");
    };
    return (
        <>
            <Box
                className={
                    "h-screen w-screen justify-center bg-white dark:bg-black flex flex-col"
                }>
                <FloatingIcon
                    icon={BookOpenCheck}
                    size={48}
                    color="#fa7f7c"
                    style={{
                        position: "absolute",
                        top: 100,
                        left: 30,
                    }}
                />
                <FloatingIcon
                    icon={NotepadText}
                    size={56}
                    color="#b58df1"
                    style={{
                        position: "absolute",
                        top: 200,
                        right: 40,
                    }}
                />
                <FloatingIcon
                    icon={GraduationCap}
                    size={56}
                    color="#ffe780"
                    style={{
                        position: "absolute",
                        bottom: 275,
                        left: 75,
                    }}
                />
                <FloatingIcon
                    icon={BookText}
                    size={52}
                    color="#82cab2"
                    style={{
                        position: "absolute",
                        bottom: 225,
                        right: 60,
                    }}
                />
                <FloatingIcon
                    icon={Laptop}
                    size={44}
                    color="#87cce8"
                    style={{
                        position: "absolute",
                        top: 225,
                        left: 75,
                    }}
                />
                <Center className="flex-1 flex items-center justify-center ">
                    <Text className="font-bold text-black dark:text-white text-5xl text-center">
                        Welcome to{" "}
                        <Text className="font-bold text-blue-400 text-5xl text-center">
                            PrepMate
                        </Text>
                    </Text>
                    <Text className="text-gray-500 dark:text-gray-400 text-lg text-center mt-4 mx-16 font-bold">
                        Ultimate exam preparation app for students.
                    </Text>
                </Center>
                <Box className="mb-24 mx-6">
                    <Button
                        onPress={handleNext}
                        action={"primary"}
                        variant={"solid"}
                        size={"xl"}
                        isDisabled={false}
                        className={`mt-12`}>
                        <ButtonText>Lets Go!</ButtonText>
                        <ButtonIcon as={ArrowRight} className></ButtonIcon>
                    </Button>
                </Box>
            </Box>
        </>
    );
}
