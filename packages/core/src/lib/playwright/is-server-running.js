#!/usr/bin/env node

main().then((status) => process.exit(status));

async function main() {
  const port = process.argv[2];
  if (!port) {
    console.error('Usage: is-server-running.js <port>');
    return 1;
  }

  try {
    await fetch(`http://localhost:${port}`);
  } catch {
    console.warn(`Server is not running on port ${port}`);
    return 2;
  }

  return 0;
}
