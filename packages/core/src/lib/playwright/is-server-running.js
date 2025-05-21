#!/usr/bin/env node

main();

async function main() {
  const port = process.argv[2];
  const server = await fetch(`http://localhost:${port}`);
  process.exit(server.ok ? 0 : 1);
}
