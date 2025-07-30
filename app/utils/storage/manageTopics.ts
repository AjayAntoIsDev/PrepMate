import { MMKV } from "react-native-mmkv";
import config from "@/app/config.json";

const TOPICS_KEYS = {
    COMPLETED_TOPICS: "topics.completed",
    LAST_STUDIED: "topics.lastStudied",
    STUDY_STREAK: "topics.studyStreak",
    TOTAL_STUDY_DAYS: "topics.totalStudyDays",
    LAST_STUDY_DATE: "topics.lastStudyDate",
} as const;

export type CompletedTopics = {
    [subject: string]: string[];
};

export type ExamType = "JEE" | "NEET";

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

    // Get exam info
    getExamInfo() {
        return {
            examDate: config[this.currentExam].examDate,
            examData: config[this.currentExam].examData,
            subjects: Object.keys(config[this.currentExam].subjects),
        };
    }

    getCompletedTopics(): CompletedTopics {
        const stored = this.storage.getString(TOPICS_KEYS.COMPLETED_TOPICS);
        return stored ? JSON.parse(stored) : {};
    }

    setCompletedTopics(topics: CompletedTopics): void {
        this.storage.set(TOPICS_KEYS.COMPLETED_TOPICS, JSON.stringify(topics));
    }

    markTopicCompleted(subject: string, topic: string): void {
        const completed = this.getCompletedTopics();

        if (!completed[subject]) {
            completed[subject] = [];
        }

        if (!completed[subject].includes(topic)) {
            completed[subject].push(topic);
            this.setCompletedTopics(completed);
        }
    }

    markTopicsCompleted(topics: CompletedTopics): void {
        const completed = this.getCompletedTopics();

        Object.keys(topics).forEach((subject) => {
            if (!completed[subject]) {
                completed[subject] = [];
            }

            topics[subject].forEach((topic) => {
                if (!completed[subject].includes(topic)) {
                    completed[subject].push(topic);
                }
            });
        });

        this.setCompletedTopics(completed);
    }

    markTopicNotCompleted(subject: string, topic: string): void {
        const completed = this.getCompletedTopics();

        if (completed[subject]) {
            completed[subject] = completed[subject].filter((t) => t !== topic);

            if (completed[subject].length === 0) {
                delete completed[subject];
            }

            this.setCompletedTopics(completed);
        }
    }

    isTopicCompleted(subject: string, topic: string): boolean {
        const completed = this.getCompletedTopics();
        return completed[subject]?.includes(topic) || false;
    }

    getSubjectCompletedTopics(subject: string): string[] {
        const completed = this.getCompletedTopics();
        return completed[subject] || [];
    }

    getSubjectCompletionCount(subject: string): number {
        return this.getSubjectCompletedTopics(subject).length;
    }

    getNotCompletedTopics(): CompletedTopics {
        const allSubjects = this.getAllSubjects();
        const completed = this.getCompletedTopics();
        const notCompleted: CompletedTopics = {};

        Object.keys(allSubjects).forEach((subject) => {
            const completedTopicsInSubject = completed[subject] || [];
            const notCompletedInSubject = allSubjects[subject].filter(
                (topic) => !completedTopicsInSubject.includes(topic)
            );

            if (notCompletedInSubject.length > 0) {
                notCompleted[subject] = notCompletedInSubject;
            }
        });

        return notCompleted;
    }

    getSubjectNotCompletedTopics(subject: string): string[] {
        const allSubjects = this.getAllSubjects();
        const allTopicsInSubject = allSubjects[subject] || [];
        const completedTopics = this.getSubjectCompletedTopics(subject);
        return allTopicsInSubject.filter(
            (topic) => !completedTopics.includes(topic)
        );
    }

    getSubjectNotCompletedCount(subject: string): number {
        return this.getSubjectNotCompletedTopics(subject).length;
    }

    getOverallProgress(): number {
        const allSubjects = this.getAllSubjects();
        const completed = this.getCompletedTopics();

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

    getAvailableSubjects(): string[] {
        return Object.keys(this.getAllSubjects());
    }

    getStudyStreak(): number {
        return this.storage.getNumber(TOPICS_KEYS.STUDY_STREAK) || 0;
    }

    resetAllProgress(): void {
        this.storage.delete(TOPICS_KEYS.COMPLETED_TOPICS);
        this.storage.delete(TOPICS_KEYS.LAST_STUDIED);
        this.storage.delete(TOPICS_KEYS.STUDY_STREAK);
        this.storage.delete(TOPICS_KEYS.TOTAL_STUDY_DAYS);
        this.storage.delete(TOPICS_KEYS.LAST_STUDY_DATE);
    }

    resetSubjectProgress(subject: string): void {
        const completed = this.getCompletedTopics();
        delete completed[subject];
        this.setCompletedTopics(completed);
    }

    exportProgress(): string {
        return JSON.stringify({
            examType: this.currentExam,
            completedTopics: this.getCompletedTopics(),
            studyStreak: this.getStudyStreak(),
            overallProgress: this.getOverallProgress(),
            detailedStats: this.getDetailedStats(),
            exportDate: new Date().toISOString(),
        });
    }

    getStorageInfo(): { size: number; hasData: boolean } {
        return {
            size: this.storage.size,
            hasData: this.storage.contains(TOPICS_KEYS.COMPLETED_TOPICS),
        };
    }
}

export const createTopicsManager = (
    storage: MMKV,
    examType: ExamType = "JEE"
) => {
    return new TopicsManager(storage, examType);
};

export { TopicsManager };
