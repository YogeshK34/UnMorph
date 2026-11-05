// Guards the repo so dependencies are only ever installed with Bun.
// npm / pnpm / yarn set npm_config_user_agent to their own name, which fails here.
const agent = process.env.npm_config_user_agent ?? "";

if (agent && !agent.startsWith("bun")) {
  console.error(
    "\n\x1b[31m✖ This project uses Bun exclusively.\x1b[0m\n" +
      "  Install with: \x1b[36mbun install\x1b[0m\n" +
      `  (detected: ${agent.split(" ")[0]})\n`,
  );
  process.exit(1);
}
