import { MMKV } from "react-native-mmkv";
import config from "@/app/config.json";

const TOPICS_KEYS = {
    COMPLETED_TOPICS: "topics.completed",
    COMPLETED_QUIZ: "topics.completedQuiz",
    COMPLETED_NOTES: "topics.completedNotes",
    STUDY_STREAK: "topics.studyStreak",
    LAST_STUDIED: "topics.lastStudied",
    TOTAL_STUDY_DAYS: "topics.totalStudyDays",
    LAST_STUDY_DATE: "topics.lastStudyDate",
} as const;

export type CompletedTopics = {
    [subject: string]: string[];
};

export type ExamType = "JEE" | "NEET";

export type ActivityType = "quiz" | "notes" | "general";

class TopicsManager {
    private storage: MMKV;
    private currentExam: ExamType;

    constructor(storage: MMKV, examType: ExamType = "JEE") {
        this.storage = storage;
        this.currentExam = examType;
    }

    private getAllSubjects(): { [subject: string]: string[] } {
        return config[this.currentExam].subjects;
    }

    setExamType(examType: ExamType): void {
        this.currentExam = examType;
    }

    getCurrentExamType(): ExamType {
        return this.currentExam;
    }

    getCompletedTopics(activity: ActivityType): CompletedTopics {
        let key: string;
        switch (activity) {
            case "quiz":
                key = TOPICS_KEYS.COMPLETED_QUIZ;
                break;
            case "notes":
                key = TOPICS_KEYS.COMPLETED_NOTES;
                break;
            default:
                key = TOPICS_KEYS.COMPLETED_TOPICS;
        }
        const stored = this.storage.getString(key);
        return stored ? JSON.parse(stored) : {};
    }

    setCompletedTopics(
        topics: CompletedTopics,
        activity: ActivityType
    ): void {
        let key: string;
        switch (activity) {
            case "quiz":
                key = TOPICS_KEYS.COMPLETED_QUIZ;
                break;
            case "notes":
                key = TOPICS_KEYS.COMPLETED_NOTES;
                break;
            default:
                key = TOPICS_KEYS.COMPLETED_TOPICS;
        }
        this.storage.set(key, JSON.stringify(topics));
    }

    markTopicCompleted(
        subject: string,
        topic: string,
        activity: ActivityType = "general"
    ): void {
        const completed = this.getCompletedTopics(activity);

        if (!completed[subject]) {
            completed[subject] = [];
        }

        if (!completed[subject].includes(topic)) {
            completed[subject].push(topic);
            this.setCompletedTopics(completed, activity);
        }
    }

    markTopicNotCompleted(
        subject: string,
        topic: string,
        activity: ActivityType = "general"
    ): void {
        const completed = this.getCompletedTopics(activity);

        if (completed[subject]) {
            completed[subject] = completed[subject].filter(t => t !== topic);
            if (completed[subject].length === 0) {
                delete completed[subject];
            }
            this.setCompletedTopics(completed, activity);
        }
    }

    isTopicCompleted(
        subject: string,
        topic: string,
        activity: ActivityType = "general"
    ): boolean {
        const completed = this.getCompletedTopics(activity);
        return completed[subject]?.includes(topic) || false;
    }

    getOverallProgress(activity: ActivityType = "general"): number {
        const allSubjects = this.getAllSubjects();
        const completed = this.getCompletedTopics(activity);

        const totalTopics = Object.values(allSubjects).reduce(
            (sum, topics) => sum + topics.length,
            0
        );

        const completedCount = Object.values(completed).reduce(
            (sum, topics) => sum + topics.length,
            0
        );

        return totalTopics > 0
            ? Math.round((completedCount / totalTopics) * 100)
            : 0;
    }

    getSubjectTopics(subject: string): string[] {
        const allSubjects = this.getAllSubjects();
        return allSubjects[subject] || [];
    }


    getStudyStreak(): number {
        return this.storage.getNumber(TOPICS_KEYS.STUDY_STREAK) || 0;
    }
}

export const createTopicsManager = (
    storage: MMKV,
    examType: ExamType = "JEE"
) => {
    return new TopicsManager(storage, examType);
};

export { TopicsManager };
