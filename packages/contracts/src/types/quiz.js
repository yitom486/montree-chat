export function calculateQuizGrade(score) {
    if (score >= 90)
        return 'A';
    if (score >= 75)
        return 'B';
    if (score >= 60)
        return 'C';
    return 'D';
}
/**
 * 序列化单条测验记录为单行 JSON
 */
export function serializeQuizSession(session) {
    return `${JSON.stringify(session)}\n`;
}
/**
 * 解析 JSONL 文本为 QuizSessionRecord 列表（容错跳过损坏行）
 */
export function parseQuizJsonl(raw) {
    const lines = raw.split('\n');
    const records = [];
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed)
            continue;
        try {
            const parsed = JSON.parse(trimmed);
            if (parsed && typeof parsed === 'object' && parsed.id && Array.isArray(parsed.questions)) {
                records.push(parsed);
            }
        }
        catch {
            // 容错跳过损坏行
        }
    }
    return records;
}
//# sourceMappingURL=quiz.js.map