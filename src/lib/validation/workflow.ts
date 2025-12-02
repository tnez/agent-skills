import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { parse as parseYaml } from "yaml";
import {
  ValidationResult,
  ValidationIssue,
  createError,
  createWarning,
} from "./types.js";
import { validateCron, suggestCronFromHint } from "./cron.js";

const WORKFLOW_FILENAME = "WORKFLOW.md";

/**
 * Known workflow frontmatter fields
 */
const KNOWN_FIELDS = new Set([
  "name",
  "description",
  "persona",
  "on",
  "inputs",
  "outputs",
  "env",
  "timeout",
  "retry",
  "working_dir",
]);

/**
 * Common legacy/misnamed fields and their correct names
 */
const FIELD_SUGGESTIONS: Record<string, string> = {
  goal: "description",
  skills_used: "persona (skills belong in the persona definition)",
  skills: "persona (skills belong in the persona definition)",
  schedule: "on.schedule",
  trigger: "on",
  triggers: "on",
  command: "persona (command belongs in the persona definition)",
  cmd: "persona (command belongs in the persona definition)",
};

/**
 * Parse frontmatter from markdown content without full validation
 */
function parseFrontmatter(content: string): {
  frontmatter: Record<string, unknown>;
  body: string;
} | null {
  const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return null;
  }

  const [, yamlContent, body] = match;
  try {
    const frontmatter = parseYaml(yamlContent) as Record<string, unknown>;
    return { frontmatter, body: body.trim() };
  } catch {
    return null;
  }
}

/**
 * Validate the 'on' trigger configuration
 */
function validateTriggers(
  on: unknown,
  issues: ValidationIssue[]
): void {
  if (on === undefined || on === null) {
    return; // 'on' is optional
  }

  if (typeof on !== "object" || Array.isArray(on)) {
    issues.push(
      createError(
        "invalid_type",
        "on",
        "'on' must be an object with trigger configurations",
        "Example: on: { manual: true, schedule: [{cron: '0 9 * * *'}] }"
      )
    );
    return;
  }

  const triggers = on as Record<string, unknown>;

  // Validate schedule
  if (triggers.schedule !== undefined) {
    if (typeof triggers.schedule === "string") {
      // Common mistake: using a string instead of array
      const hint = suggestCronFromHint(triggers.schedule);
      issues.push(
        createError(
          "invalid_type",
          "on.schedule",
          "'schedule' must be an array of {cron: string} objects, got string",
          hint
            ? `Use: schedule: [{ cron: "${hint}" }]`
            : "Use: schedule: [{ cron: \"0 9 * * *\" }]"
        )
      );
    } else if (!Array.isArray(triggers.schedule)) {
      issues.push(
        createError(
          "invalid_type",
          "on.schedule",
          "'schedule' must be an array",
          "Use: schedule: [{ cron: \"0 9 * * *\" }]"
        )
      );
    } else {
      // Validate each schedule entry
      triggers.schedule.forEach((entry: unknown, index: number) => {
        if (typeof entry !== "object" || entry === null) {
          issues.push(
            createError(
              "invalid_type",
              `on.schedule[${index}]`,
              "Schedule entry must be an object with 'cron' field",
              "Use: { cron: \"0 9 * * *\" }"
            )
          );
          return;
        }

        const scheduleEntry = entry as Record<string, unknown>;
        if (typeof scheduleEntry.cron !== "string") {
          issues.push(
            createError(
              "missing_field",
              `on.schedule[${index}].cron`,
              "Schedule entry missing required 'cron' field",
              "Add: cron: \"0 9 * * *\""
            )
          );
          return;
        }

        // Validate cron expression
        const cronResult = validateCron(scheduleEntry.cron);
        if (!cronResult.valid) {
          issues.push(
            createError(
              "invalid_value",
              `on.schedule[${index}].cron`,
              `Invalid cron expression: ${cronResult.error}`,
              "Format: minute hour day-of-month month day-of-week (e.g., \"30 9 * * 1-5\")"
            )
          );
        }
      });
    }
  }

  // Validate manual trigger
  if (triggers.manual !== undefined) {
    if (
      typeof triggers.manual !== "boolean" &&
      typeof triggers.manual !== "object"
    ) {
      issues.push(
        createError(
          "invalid_type",
          "on.manual",
          "'manual' must be true/false or an object with input overrides",
          "Use: manual: true"
        )
      );
    }
  }

  // Check for unknown trigger types
  const knownTriggers = new Set([
    "schedule",
    "manual",
    "file_change",
    "webhook",
    "workflow_complete",
    "git",
    "github",
  ]);
  for (const key of Object.keys(triggers)) {
    if (!knownTriggers.has(key)) {
      issues.push(
        createWarning(
          "unknown_field",
          `on.${key}`,
          `Unknown trigger type '${key}'`,
          `Known triggers: ${Array.from(knownTriggers).join(", ")}`
        )
      );
    }
  }
}

/**
 * Validate a workflow file
 */
export async function validateWorkflow(
  workflowPath: string
): Promise<ValidationResult> {
  const filePath = workflowPath.endsWith(WORKFLOW_FILENAME)
    ? workflowPath
    : join(workflowPath, WORKFLOW_FILENAME);

  const issues: ValidationIssue[] = [];
  let name: string | undefined;

  try {
    const content = await readFile(filePath, "utf-8");
    const parsed = parseFrontmatter(content);

    if (!parsed) {
      issues.push(
        createError(
          "invalid_value",
          "frontmatter",
          "No valid YAML frontmatter found",
          "File must start with --- followed by YAML and another ---"
        )
      );
      return {
        path: filePath,
        valid: false,
        issues,
      };
    }

    const { frontmatter, body } = parsed;
    name = frontmatter.name as string | undefined;

    // Check required fields
    if (!frontmatter.name) {
      issues.push(
        createError(
          "missing_field",
          "name",
          "Missing required 'name' field",
          "Add: name: my-workflow"
        )
      );
    } else if (typeof frontmatter.name !== "string") {
      issues.push(
        createError("invalid_type", "name", "'name' must be a string")
      );
    }

    if (!frontmatter.description) {
      // Check if they used 'goal' instead
      if (frontmatter.goal) {
        issues.push(
          createError(
            "missing_field",
            "description",
            "Missing required 'description' field",
            "Rename 'goal' to 'description'"
          )
        );
      } else {
        issues.push(
          createError(
            "missing_field",
            "description",
            "Missing required 'description' field",
            "Add: description: What this workflow does"
          )
        );
      }
    } else if (typeof frontmatter.description !== "string") {
      issues.push(
        createError(
          "invalid_type",
          "description",
          "'description' must be a string"
        )
      );
    }

    if (!frontmatter.persona) {
      issues.push(
        createError(
          "missing_field",
          "persona",
          "Missing required 'persona' field",
          "Add: persona: claude"
        )
      );
    } else if (typeof frontmatter.persona !== "string") {
      issues.push(
        createError("invalid_type", "persona", "'persona' must be a string")
      );
    }

    // Check for task body
    if (!body) {
      issues.push(
        createError(
          "missing_field",
          "body",
          "Missing task body after frontmatter",
          "Add the task/prompt content after the --- delimiter"
        )
      );
    }

    // Validate triggers
    validateTriggers(frontmatter.on, issues);

    // Check for unknown/legacy fields
    for (const key of Object.keys(frontmatter)) {
      if (!KNOWN_FIELDS.has(key)) {
        const suggestion = FIELD_SUGGESTIONS[key];
        if (suggestion) {
          issues.push(
            createWarning(
              "unknown_field",
              key,
              `Unknown field '${key}'`,
              `Did you mean '${suggestion}'?`
            )
          );
        } else {
          issues.push(
            createWarning("unknown_field", key, `Unknown field '${key}'`)
          );
        }
      }
    }

    // Validate inputs if present
    if (frontmatter.inputs !== undefined) {
      if (!Array.isArray(frontmatter.inputs)) {
        issues.push(
          createError(
            "invalid_type",
            "inputs",
            "'inputs' must be an array",
            "Use: inputs: [{ name: 'myInput', type: 'string' }]"
          )
        );
      } else {
        frontmatter.inputs.forEach((input: unknown, index: number) => {
          if (typeof input !== "object" || input === null) {
            issues.push(
              createError(
                "invalid_type",
                `inputs[${index}]`,
                "Input definition must be an object"
              )
            );
            return;
          }
          const inputDef = input as Record<string, unknown>;
          if (!inputDef.name || typeof inputDef.name !== "string") {
            issues.push(
              createError(
                "missing_field",
                `inputs[${index}].name`,
                "Input definition missing required 'name' field"
              )
            );
          }
        });
      }
    }

    // Validate env if present
    if (frontmatter.env !== undefined) {
      if (
        typeof frontmatter.env !== "object" ||
        Array.isArray(frontmatter.env) ||
        frontmatter.env === null
      ) {
        issues.push(
          createError(
            "invalid_type",
            "env",
            "'env' must be an object",
            "Use: env: { KEY: 'value' }"
          )
        );
      }
    }
  } catch (error) {
    issues.push(
      createError(
        "invalid_value",
        "file",
        `Failed to read workflow: ${(error as Error).message}`
      )
    );
  }

  const hasErrors = issues.some((i) => i.severity === "error");

  return {
    path: dirname(filePath),
    name,
    valid: !hasErrors,
    issues,
  };
}

/**
 * Get the persona referenced by a workflow (for cross-validation)
 */
export async function getWorkflowPersonaRef(
  workflowPath: string
): Promise<string | null> {
  const filePath = workflowPath.endsWith(WORKFLOW_FILENAME)
    ? workflowPath
    : join(workflowPath, WORKFLOW_FILENAME);

  try {
    const content = await readFile(filePath, "utf-8");
    const parsed = parseFrontmatter(content);
    if (parsed && typeof parsed.frontmatter.persona === "string") {
      return parsed.frontmatter.persona;
    }
  } catch {
    // Ignore errors
  }
  return null;
}
