import { readdir, stat } from "node:fs/promises";
import { join, relative } from "node:path";
import {
  ValidationResult,
  ValidationSummary,
  createError,
} from "./types.js";
import { validateWorkflow, getWorkflowPersonaRef } from "./workflow.js";
import { validatePersona } from "./persona.js";

export * from "./types.js";
export { validateWorkflow } from "./workflow.js";
export { validatePersona } from "./persona.js";
export { validateCron } from "./cron.js";

const PERSONA_FILENAME = "PERSONA.md";
const WORKFLOW_FILENAME = "WORKFLOW.md";

/**
 * Check if a directory contains a specific file
 */
async function hasFile(dirPath: string, filename: string): Promise<boolean> {
  try {
    const filePath = join(dirPath, filename);
    const stats = await stat(filePath);
    return stats.isFile();
  } catch {
    return false;
  }
}

/**
 * Recursively find all directories containing a specific file
 */
async function findDirectoriesWithFile(
  root: string,
  filename: string
): Promise<string[]> {
  const results: string[] = [];

  async function scanDir(dir: string): Promise<void> {
    try {
      const entries = await readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const subDir = join(dir, entry.name);
          if (await hasFile(subDir, filename)) {
            results.push(subDir);
          }
          await scanDir(subDir);
        }
      }
    } catch {
      // Directory doesn't exist or not readable
    }
  }

  await scanDir(root);
  return results;
}

/**
 * Check if a persona path exists
 */
async function personaExists(
  personaRef: string,
  personasDir: string
): Promise<boolean> {
  const personaPath = join(personasDir, personaRef);
  return hasFile(personaPath, PERSONA_FILENAME);
}

/**
 * Determine if a persona is a root persona (no parent with PERSONA.md)
 */
async function isRootPersona(
  personaPath: string,
  personasRoot: string
): Promise<boolean> {
  const relativePath = relative(personasRoot, personaPath);
  const parts = relativePath.split("/").filter(Boolean);

  // If it's directly under personasRoot, it's a root persona
  if (parts.length <= 1) {
    return true;
  }

  // Check if any parent directory has a PERSONA.md
  let currentPath = personasRoot;
  for (let i = 0; i < parts.length - 1; i++) {
    currentPath = join(currentPath, parts[i]);
    if (await hasFile(currentPath, PERSONA_FILENAME)) {
      return false; // Has a parent persona
    }
  }

  return true;
}

/**
 * Validate all workflows in a directory
 */
export async function validateAllWorkflows(
  workflowsDir: string,
  personasDir?: string
): Promise<ValidationResult[]> {
  const workflowPaths = await findDirectoriesWithFile(
    workflowsDir,
    WORKFLOW_FILENAME
  );
  const results: ValidationResult[] = [];

  for (const workflowPath of workflowPaths) {
    const result = await validateWorkflow(workflowPath);

    // Cross-validate persona reference if personasDir provided
    if (personasDir && result.valid) {
      const personaRef = await getWorkflowPersonaRef(workflowPath);
      if (personaRef && !(await personaExists(personaRef, personasDir))) {
        result.issues.push(
          createError(
            "reference_not_found",
            "persona",
            `Persona '${personaRef}' not found`,
            `Create persona at: ${join(personasDir, personaRef, PERSONA_FILENAME)}`
          )
        );
        result.valid = false;
      }
    }

    results.push(result);
  }

  return results;
}

/**
 * Validate all personas in a directory
 */
export async function validateAllPersonas(
  personasDir: string
): Promise<ValidationResult[]> {
  const personaPaths = await findDirectoriesWithFile(
    personasDir,
    PERSONA_FILENAME
  );
  const results: ValidationResult[] = [];

  for (const personaPath of personaPaths) {
    const isRoot = await isRootPersona(personaPath, personasDir);
    const result = await validatePersona(personaPath, isRoot);
    results.push(result);
  }

  return results;
}

/**
 * Validate entire .agents directory
 */
export async function validateAll(
  agentsDir: string
): Promise<ValidationSummary> {
  const personasDir = join(agentsDir, "personas");
  const workflowsDir = join(agentsDir, "workflows");

  const personaResults = await validateAllPersonas(personasDir);
  const workflowResults = await validateAllWorkflows(workflowsDir, personasDir);

  const validPersonas = personaResults.filter((r) => r.valid).length;
  const validWorkflows = workflowResults.filter((r) => r.valid).length;

  return {
    personas: {
      total: personaResults.length,
      valid: validPersonas,
      results: personaResults,
    },
    workflows: {
      total: workflowResults.length,
      valid: validWorkflows,
      results: workflowResults,
    },
    valid:
      validPersonas === personaResults.length &&
      validWorkflows === workflowResults.length,
  };
}
