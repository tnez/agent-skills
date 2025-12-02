import { Command } from "commander";
import chalk from "chalk";
import { mkdir, writeFile, stat } from "node:fs/promises";
import { join, relative } from "node:path";
import { createInterface } from "node:readline";
import { findAgentsDir } from "../../lib/config.js";
import {
  validateAllWorkflows,
  validateAllPersonas,
  ValidationResult,
  ValidationIssue,
} from "../../lib/validation/index.js";

const AGENTS_DIR = ".agents";
const PERSONAS_DIR = "personas";
const WORKFLOWS_DIR = "workflows";
const SKILLS_DIR = "skills";
const SESSIONS_DIR = "sessions";

const DEFAULT_PERSONA_NAME = "claude";

const DEFAULT_PERSONA_CONTENT = `---
name: claude
description: Base Claude persona
cmd:
  - "claude --print"
  - "claude -p"
env:
  CLAUDE_MODEL: sonnet
---

You are a helpful assistant. Execute tasks thoroughly and report results clearly.
`;

const SAMPLE_WORKFLOW_CONTENT = `---
name: hello-world
description: A simple hello world workflow
persona: claude
on:
  manual: true
---

Say hello and tell me today's date.
`;

async function prompt(question: string): Promise<string> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function confirm(question: string, defaultYes = true): Promise<boolean> {
  const hint = defaultYes ? "[Y/n]" : "[y/N]";
  const answer = await prompt(`${question} ${hint} `);

  if (answer === "") {
    return defaultYes;
  }

  return answer.toLowerCase().startsWith("y");
}

async function dirExists(path: string): Promise<boolean> {
  try {
    const stats = await stat(path);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

async function fileExists(path: string): Promise<boolean> {
  try {
    const stats = await stat(path);
    return stats.isFile();
  } catch {
    return false;
  }
}

interface MigrationStatus {
  hasPersonas: boolean;
  hasWorkflows: boolean;
  hasSkills: boolean;
  hasSessions: boolean;
  personaResults: ValidationResult[];
  workflowResults: ValidationResult[];
}

async function analyzeMigration(agentsDir: string): Promise<MigrationStatus> {
  const personasDir = join(agentsDir, PERSONAS_DIR);
  const workflowsDir = join(agentsDir, WORKFLOWS_DIR);
  const skillsDir = join(agentsDir, SKILLS_DIR);
  const sessionsDir = join(agentsDir, SESSIONS_DIR);

  const status: MigrationStatus = {
    hasPersonas: await dirExists(personasDir),
    hasWorkflows: await dirExists(workflowsDir),
    hasSkills: await dirExists(skillsDir),
    hasSessions: await dirExists(sessionsDir),
    personaResults: [],
    workflowResults: [],
  };

  // Validate personas
  if (status.hasPersonas) {
    status.personaResults = await validateAllPersonas(personasDir);
    // Update hasPersonas based on whether any valid personas exist
    status.hasPersonas = status.personaResults.some((r) => r.valid);
  }

  // Validate workflows
  if (status.hasWorkflows) {
    status.workflowResults = await validateAllWorkflows(
      workflowsDir,
      status.hasPersonas ? personasDir : undefined
    );
  }

  return status;
}

/**
 * Format a validation issue for display
 */
function formatIssue(issue: ValidationIssue): string {
  const icon = issue.severity === "error" ? chalk.red("✗") : chalk.yellow("⚠");

  let line = `      ${icon} ${issue.message}`;
  if (issue.path && issue.path !== "file" && issue.path !== "frontmatter") {
    line += chalk.dim(` [${issue.path}]`);
  }
  if (issue.suggestion) {
    line += `\n        ${chalk.dim("→")} ${chalk.cyan(issue.suggestion)}`;
  }

  return line;
}

async function freshInstall(targetDir: string): Promise<void> {
  const agentsDir = join(targetDir, AGENTS_DIR);

  console.log(chalk.blue("\nCreating .agents directory structure...\n"));

  // Create directories
  const dirs = [
    join(agentsDir, PERSONAS_DIR, DEFAULT_PERSONA_NAME),
    join(agentsDir, WORKFLOWS_DIR, "hello-world"),
    join(agentsDir, SKILLS_DIR),
    join(agentsDir, SESSIONS_DIR),
  ];

  for (const dir of dirs) {
    await mkdir(dir, { recursive: true });
    console.log(chalk.dim(`  Created ${dir}`));
  }

  // Create default persona
  const personaPath = join(
    agentsDir,
    PERSONAS_DIR,
    DEFAULT_PERSONA_NAME,
    "PERSONA.md"
  );
  await writeFile(personaPath, DEFAULT_PERSONA_CONTENT);
  console.log(chalk.green(`  Created ${personaPath}`));

  // Create sample workflow
  const workflowPath = join(
    agentsDir,
    WORKFLOWS_DIR,
    "hello-world",
    "WORKFLOW.md"
  );
  await writeFile(workflowPath, SAMPLE_WORKFLOW_CONTENT);
  console.log(chalk.green(`  Created ${workflowPath}`));

  console.log(chalk.green("\n✓ Initialization complete!\n"));
  console.log("Next steps:");
  console.log(chalk.dim("  1. Review the default persona at:"));
  console.log(chalk.dim(`     ${personaPath}`));
  console.log(chalk.dim("  2. Try running the sample workflow:"));
  console.log(chalk.dim("     dot-agents run hello-world --dry-run"));
  console.log(chalk.dim("  3. Create your own workflows in:"));
  console.log(chalk.dim(`     ${join(agentsDir, WORKFLOWS_DIR)}/`));
}

async function migrate(agentsDir: string): Promise<void> {
  console.log(chalk.blue("\nAnalyzing existing .agents directory...\n"));

  const status = await analyzeMigration(agentsDir);
  const workflowsDir = join(agentsDir, WORKFLOWS_DIR);

  // Report current state
  console.log("Current structure:");
  console.log(
    `  ${status.hasPersonas ? chalk.green("✓") : chalk.red("✗")} personas/`
  );
  console.log(
    `  ${status.hasWorkflows ? chalk.green("✓") : chalk.yellow("○")} workflows/`
  );
  console.log(
    `  ${status.hasSkills ? chalk.green("✓") : chalk.dim("○")} skills/`
  );
  console.log(
    `  ${status.hasSessions ? chalk.green("✓") : chalk.dim("○")} sessions/`
  );

  // Count valid vs invalid workflows
  const validWorkflows = status.workflowResults.filter((r) => r.valid);
  const invalidWorkflows = status.workflowResults.filter((r) => !r.valid);
  const workflowsWithWarnings = status.workflowResults.filter(
    (r) => r.valid && r.issues.length > 0
  );

  if (validWorkflows.length > 0) {
    console.log(chalk.green(`\n  ${validWorkflows.length} valid workflow(s)`));
  }
  if (workflowsWithWarnings.length > 0) {
    console.log(
      chalk.yellow(`  ${workflowsWithWarnings.length} workflow(s) with warnings`)
    );
  }
  if (invalidWorkflows.length > 0) {
    console.log(
      chalk.red(`  ${invalidWorkflows.length} workflow(s) with errors`)
    );
  }

  let needsAction = false;

  // Create personas directory if missing
  if (!status.hasPersonas) {
    needsAction = true;
    console.log(chalk.yellow("\n⚠ No valid personas found."));

    const createPersona = await confirm("Create default 'claude' persona?");

    if (createPersona) {
      const personaDir = join(agentsDir, PERSONAS_DIR, DEFAULT_PERSONA_NAME);
      await mkdir(personaDir, { recursive: true });

      const personaPath = join(personaDir, "PERSONA.md");
      await writeFile(personaPath, DEFAULT_PERSONA_CONTENT);

      console.log(chalk.green(`  Created ${personaPath}`));
    }
  }

  // Report workflow issues with detailed validation feedback
  const workflowsWithIssues = status.workflowResults.filter(
    (r) => r.issues.length > 0
  );

  if (workflowsWithIssues.length > 0) {
    needsAction = true;
    console.log(chalk.yellow("\n⚠ Workflow issues found:\n"));

    for (const result of workflowsWithIssues) {
      const relPath = relative(workflowsDir, result.path);
      const displayName = result.name || relPath;
      const hasErrors = result.issues.some((i) => i.severity === "error");

      if (hasErrors) {
        console.log(`  ${chalk.red("✗")} ${displayName}`);
      } else {
        console.log(`  ${chalk.yellow("○")} ${displayName}`);
      }

      for (const issue of result.issues) {
        console.log(formatIssue(issue));
      }
      console.log();
    }
  }

  if (!needsAction) {
    console.log(chalk.green("\n✓ Your .agents directory is already set up!"));
  } else {
    console.log(chalk.blue("After making changes, verify with:"));
    console.log(chalk.dim("  dot-agents check"));
  }
}

export const initCommand = new Command("init")
  .description("Initialize or migrate a .agents directory")
  .option("-d, --dir <path>", "Target directory", process.cwd())
  .option("-f, --force", "Overwrite existing files")
  .action(async (options) => {
    try {
      const targetDir = options.dir;

      // Check if .agents already exists
      const existingAgentsDir = await findAgentsDir(targetDir);
      const localAgentsDir = join(targetDir, AGENTS_DIR);
      const hasLocalAgents = await dirExists(localAgentsDir);

      if (hasLocalAgents) {
        // Migration mode
        console.log(chalk.blue("Found existing .agents directory"));
        await migrate(localAgentsDir);
      } else if (existingAgentsDir) {
        // Found .agents in parent directory
        console.log(
          chalk.yellow(
            `Found .agents in parent directory: ${existingAgentsDir}`
          )
        );
        const createLocal = await confirm(
          "Create a new .agents in current directory instead?"
        );

        if (createLocal) {
          await freshInstall(targetDir);
        } else {
          console.log(chalk.dim("Using existing .agents directory"));
          await migrate(existingAgentsDir);
        }
      } else {
        // Fresh install
        await freshInstall(targetDir);
      }
    } catch (error) {
      console.error(chalk.red(`Error: ${(error as Error).message}`));
      process.exit(1);
    }
  });
