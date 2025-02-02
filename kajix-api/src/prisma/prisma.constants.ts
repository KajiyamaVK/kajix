export const PrismaErrorCode = {
  UNIQUE_CONSTRAINT_VIOLATION: 'P2002',
  RECORD_NOT_FOUND: 'P2025',
  FOREIGN_KEY_CONSTRAINT_VIOLATION: 'P2003',
  REQUIRED_RELATION_VIOLATION: 'P2014',
  RECORD_DOES_NOT_EXIST: 'P2001',
} as const;

// Type-safe way to use the error codes
export type PrismaErrorCodeType =
  (typeof PrismaErrorCode)[keyof typeof PrismaErrorCode];
