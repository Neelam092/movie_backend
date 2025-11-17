#!/usr/bin/env node
// Usage:
// node scripts/hash-password.js yourPlainPassword
// Or run without args and you'll be prompted to enter a password (hidden input)

import bcrypt from 'bcrypt';
import readline from 'readline';

const SALT_ROUNDS = 10;

async function hashPassword(pwd) {
  const hash = await bcrypt.hash(pwd, SALT_ROUNDS);
  console.log(hash);
}

function promptHidden(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const stdin = process.openStdin();
    process.stdin.on('data', (char) => {
      char = char + '';
      switch (char) {
        case '\n':
        case '\r':
        case '\u0004':
          stdin.pause();
          break;
        default:
          process.stdout.clearLine && process.stdout.clearLine(0);
          process.stdout.cursorTo && process.stdout.cursorTo(0);
          process.stdout.write(question + Array(rl.line.length + 1).join('*'));
          break;
      }
    });
    rl.question(question, (value) => {
      rl.history = rl.history.slice(1);
      rl.close();
      resolve(value);
    });
  });
}

async function main() {
  const arg = process.argv[2];
  if (arg) {
    await hashPassword(arg);
    return;
  }

  // Prompt hidden
  const pwd = await promptHidden('Enter password to hash: ');
  if (!pwd) {
    console.error('No password entered');
    process.exit(1);
  }
  await hashPassword(pwd);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
