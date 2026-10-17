/** 常规快照应在毫秒级返回 */
export const ACP_SNAPSHOT_TIMEOUT_MS = 5_000;
/** 可能触发扫描 PDF 按需 OCR 的快照 */
export const ACP_SNAPSHOT_OCR_TIMEOUT_MS = 120_000;
export function resolveSnapshotTimeoutMs(resource) {
    switch (resource) {
        case 'visual-context':
        case 'viewport-image':
            return 15_000;
        case 'viewport.txt':
        case 'chapter.txt':
        case 'chapter':
        case 'search':
            return ACP_SNAPSHOT_OCR_TIMEOUT_MS;
        default:
            return ACP_SNAPSHOT_TIMEOUT_MS;
    }
}
//# sourceMappingURL=montree-snapshot.js.map