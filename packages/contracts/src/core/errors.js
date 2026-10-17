export function isCancelled(error) {
    return error.code === 'CANCELLED';
}
export function isAppError(value) {
    return (value !== null &&
        typeof value === 'object' &&
        'code' in value &&
        'message' in value &&
        typeof value.message === 'string');
}
export function toAppError(error, fallbackMessage) {
    if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
        return error;
    }
    const message = error instanceof Error ? error.message : fallbackMessage;
    const code = error instanceof Error && 'code' in error && error.code === 'ENOENT'
        ? 'FILE_NOT_FOUND'
        : 'UNKNOWN';
    return { code, message };
}
//# sourceMappingURL=errors.js.map