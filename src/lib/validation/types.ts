/**
 * Severity levels for validation issues
 */
export type ValidationSeverity = "error" | "warning";

/**
 * Types of validation errors
 */
export type ValidationErrorType =
  | "missing_field"
  | "invalid_type"
  | "invalid_value"
  | "reference_not_found";

/**
 * Types of validation warnings
 */
export type ValidationWarningType = "unknown_field" | "deprecated_field";

/**
 * A validation issue (error or warning)
 */
export interface ValidationIssue {
  severity: ValidationSeverity;
  type: ValidationErrorType | ValidationWarningType;
  /** Path to the problematic field (e.g., "on.schedule[0].cron") */
  path: string;
  /** Human-readable error message */
  message: string;
  /** Suggestion for how to fix the issue */
  suggestion?: string;
}

/**
 * Result of validating a single resource
 */
export interface ValidationResult {
  /** Path to the resource */
  path: string;
  /** Resource name (if available) */
  name?: string;
  /** Whether the resource is valid (no errors, warnings are ok) */
  valid: boolean;
  /** All issues found */
  issues: ValidationIssue[];
}

/**
 * Summary of validation across multiple resources
 */
export interface ValidationSummary {
  workflows: {
    total: number;
    valid: number;
    results: ValidationResult[];
  };
  personas: {
    total: number;
    valid: number;
    results: ValidationResult[];
  };
  /** Overall validity (all resources valid) */
  valid: boolean;
}

/**
 * Helper to create an error issue
 */
export function createError(
  type: ValidationErrorType,
  path: string,
  message: string,
  suggestion?: string
): ValidationIssue {
  return {
    severity: "error",
    type,
    path,
    message,
    suggestion,
  };
}

/**
 * Helper to create a warning issue
 */
export function createWarning(
  type: ValidationWarningType,
  path: string,
  message: string,
  suggestion?: string
): ValidationIssue {
  return {
    severity: "warning",
    type,
    path,
    message,
    suggestion,
  };
}
