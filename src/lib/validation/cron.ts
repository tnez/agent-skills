/**
 * Validate cron expression syntax
 *
 * Supports standard 5-field cron format:
 * minute hour day-of-month month day-of-week
 *
 * Each field can be:
 * - asterisk (any value)
 * - number (specific value)
 * - range (1-5)
 * - step (star/15 or 1-5/2)
 * - list (1,3,5)
 * - combinations of above
 */

interface CronValidationResult {
  valid: boolean;
  error?: string;
}

const FIELD_RANGES: Record<string, [number, number]> = {
  minute: [0, 59],
  hour: [0, 23],
  dayOfMonth: [1, 31],
  month: [1, 12],
  dayOfWeek: [0, 7], // 0 and 7 both represent Sunday
};

const FIELD_NAMES = ["minute", "hour", "dayOfMonth", "month", "dayOfWeek"];

/**
 * Validate a single cron field value
 */
function validateField(
  value: string,
  fieldName: string
): { valid: boolean; error?: string } {
  const [min, max] = FIELD_RANGES[fieldName];

  // Handle wildcard
  if (value === "*") {
    return { valid: true };
  }

  // Handle step values (*/n or range/n)
  if (value.includes("/")) {
    const [base, step] = value.split("/");
    if (!step || isNaN(Number(step)) || Number(step) < 1) {
      return { valid: false, error: `Invalid step value: ${step}` };
    }
    // Validate the base part
    if (base !== "*") {
      const baseResult = validateField(base, fieldName);
      if (!baseResult.valid) {
        return baseResult;
      }
    }
    return { valid: true };
  }

  // Handle lists (1,2,3)
  if (value.includes(",")) {
    const parts = value.split(",");
    for (const part of parts) {
      const result = validateField(part.trim(), fieldName);
      if (!result.valid) {
        return result;
      }
    }
    return { valid: true };
  }

  // Handle ranges (1-5)
  if (value.includes("-")) {
    const [start, end] = value.split("-").map(Number);
    if (isNaN(start) || isNaN(end)) {
      return { valid: false, error: `Invalid range: ${value}` };
    }
    if (start < min || start > max || end < min || end > max) {
      return {
        valid: false,
        error: `Range ${value} out of bounds (${min}-${max})`,
      };
    }
    if (start > end) {
      return { valid: false, error: `Invalid range: start > end in ${value}` };
    }
    return { valid: true };
  }

  // Handle single number
  const num = Number(value);
  if (isNaN(num)) {
    return { valid: false, error: `Invalid value: ${value}` };
  }
  if (num < min || num > max) {
    return {
      valid: false,
      error: `Value ${num} out of bounds (${min}-${max})`,
    };
  }

  return { valid: true };
}

/**
 * Validate a cron expression
 */
export function validateCron(expression: string): CronValidationResult {
  if (!expression || typeof expression !== "string") {
    return { valid: false, error: "Cron expression must be a non-empty string" };
  }

  const trimmed = expression.trim();
  const fields = trimmed.split(/\s+/);

  if (fields.length !== 5) {
    return {
      valid: false,
      error: `Expected 5 fields (minute hour day month weekday), got ${fields.length}`,
    };
  }

  for (let i = 0; i < fields.length; i++) {
    const result = validateField(fields[i], FIELD_NAMES[i]);
    if (!result.valid) {
      return {
        valid: false,
        error: `Invalid ${FIELD_NAMES[i]}: ${result.error}`,
      };
    }
  }

  return { valid: true };
}

/**
 * Parse a human-readable schedule hint into a cron suggestion
 * This is best-effort for common patterns
 */
export function suggestCronFromHint(hint: string): string | null {
  const lower = hint.toLowerCase();

  // Common patterns
  if (lower.includes("hourly")) {
    return "0 * * * *";
  }
  if (lower.includes("daily")) {
    // Try to extract time
    const timeMatch = lower.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)?/i);
    if (timeMatch) {
      let hour = parseInt(timeMatch[1], 10);
      const minute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
      const meridiem = timeMatch[3]?.toLowerCase();

      if (meridiem === "pm" && hour < 12) hour += 12;
      if (meridiem === "am" && hour === 12) hour = 0;

      return `${minute} ${hour} * * *`;
    }
    return "0 9 * * *"; // Default to 9 AM
  }
  if (lower.includes("weekly")) {
    return "0 9 * * 1"; // Monday 9 AM
  }
  if (lower.includes("monthly")) {
    return "0 9 1 * *"; // 1st of month 9 AM
  }

  // Try to extract "every N hours/minutes"
  const everyMatch = lower.match(/every\s+(\d+)\s+(hour|minute|min)/i);
  if (everyMatch) {
    const n = parseInt(everyMatch[1], 10);
    const unit = everyMatch[2].toLowerCase();
    if (unit.startsWith("hour")) {
      return `0 */${n} * * *`;
    }
    if (unit.startsWith("min")) {
      return `*/${n} * * * *`;
    }
  }

  return null;
}
