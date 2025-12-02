import { Command } from "commander";
import chalk from "chalk";
import { mkdir, writeFile, readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { findAgentsDir } from "../../lib/config.js";
import { listWorkflows, loadWorkflow } from "../../lib/workflow.js";

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
  workflowsNeedingMigration: string[];
  validWorkflows: string[];
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
    workflowsNeedingMigration: [],
    validWorkflows: [],
  };

  // Check personas directory has at least one persona
  if (status.hasPersonas) {
    try {
      const entries = await readdir(personasDir);
      const hasPersonaFiles = await Promise.all(
        entries.map(async (entry) => {
          const personaFile = join(personasDir, entry, "PERSONA.md");
          return fileExists(personaFile);
        })
      );
      status.hasPersonas = hasPersonaFiles.some(Boolean);
    } catch {
      status.hasPersonas = false;
    }
  }

  // Scan workflows for migration needs
  if (status.hasWorkflows) {
    try {
      const workflowPaths = await listWorkflows(workflowsDir);

      for (const workflowPath of workflowPaths) {
        try {
          await loadWorkflow(workflowPath);
          status.validWorkflows.push(workflowPath);
        } catch {
          // Workflow exists but doesn't meet requirements
          status.workflowsNeedingMigration.push(workflowPath);
        }
      }
    } catch {
      // Ignore errors
    }
  }

  return status;
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

  // Report workflow status
  if (status.validWorkflows.length > 0) {
    console.log(
      chalk.green(`\n  ${status.validWorkflows.length} valid workflow(s)`)
    );
  }
  if (status.workflowsNeedingMigration.length > 0) {
    console.log(
      chalk.yellow(
        `  ${status.workflowsNeedingMigration.length} workflow(s) need migration`
      )
    );
  }

  let needsAction = false;

  // Create personas directory if missing
  if (!status.hasPersonas) {
    needsAction = true;
    console.log(chalk.yellow("\n⚠ No personas found."));

    const createPersona = await confirm("Create default 'claude' persona?");

    if (createPersona) {
      const personaDir = join(agentsDir, PERSONAS_DIR, DEFAULT_PERSONA_NAME);
      await mkdir(personaDir, { recursive: true });

      const personaPath = join(personaDir, "PERSONA.md");
      await writeFile(personaPath, DEFAULT_PERSONA_CONTENT);

      console.log(chalk.green(`  Created ${personaPath}`));
    }
  }

  // Report workflow migration needs
  if (status.workflowsNeedingMigration.length > 0) {
    needsAction = true;
    console.log(chalk.yellow("\n⚠ Workflows requiring manual migration:\n"));

    for (const workflowPath of status.workflowsNeedingMigration) {
      console.log(chalk.dim(`  - ${workflowPath}/WORKFLOW.md`));
    }

    console.log(chalk.dim("\nRequired changes for each workflow:"));
    console.log(chalk.dim("  1. Add 'description:' field (rename from 'goal:' if present)"));
    console.log(chalk.dim("  2. Add 'persona: claude' field"));
    console.log(chalk.dim("  3. Move 'skills_used:' to persona if present"));
  }

  if (!needsAction) {
    console.log(chalk.green("\n✓ Your .agents directory is already set up!"));
  } else {
    console.log(chalk.blue("\nAfter making changes, verify with:"));
    console.log(chalk.dim("  dot-agents list workflows"));
    console.log(chalk.dim("  dot-agents list personas"));
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
