export class AppError extends Error {
 constructor(public code: string, message: string, public status=400) { super(message); }
}
export function storageUnavailable(): AppError {
 return new AppError('STORAGE_UNAVAILABLE','Database is unavailable or its schema is not initialized. Run config/schema.sql and try again.',503);
}
