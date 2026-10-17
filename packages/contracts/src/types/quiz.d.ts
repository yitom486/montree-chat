export type QuizQuestionType = 'choice' | 'short_answer' | 'essay_design' | 'subjective' | 'boolean' | 'cloze';
export interface QuizConfig {
    totalCount: number;
    enabledTypes: QuizQuestionType[];
    focusOnCards?: boolean;
    includeContext?: boolean;
    countsByType?: Partial<Record<QuizQuestionType, number>>;
}
export interface QuizQuestion {
    id: string;
    title: string;
    prompt: string;
    tag?: string;
    keyPoints: string[];
    sourceExcerpt: string;
    chapterTitle?: string;
    markId?: string;
    type?: QuizQuestionType;
    options?: string[];
    correctOption?: string;
    explanation?: string;
    designRequirements?: string[];
}
export type QuizGrade = 'A' | 'B' | 'C' | 'D';
export interface QuizAnswerSubmission {
    questionId: string;
    userAnswer: string;
    score: number;
    grade: QuizGrade;
    feedback: string;
    hitKeyPoints: string[];
    missedKeyPoints: string[];
    gradedAt: string;
}
export interface QuizSessionRecord {
    id: string;
    bookTitle: string;
    filePath: string;
    chapterKey?: string;
    chapterTitle?: string;
    createdAt: string;
    totalScore: number;
    grade: QuizGrade;
    overallFeedback?: string;
    questions: QuizQuestion[];
    submissions: Record<string, QuizAnswerSubmission>;
}
export declare function calculateQuizGrade(score: number): QuizGrade;
/**
 * 序列化单条测验记录为单行 JSON
 */
export declare function serializeQuizSession(session: QuizSessionRecord): string;
/**
 * 解析 JSONL 文本为 QuizSessionRecord 列表（容错跳过损坏行）
 */
export declare function parseQuizJsonl(raw: string): QuizSessionRecord[];
//# sourceMappingURL=quiz.d.ts.map