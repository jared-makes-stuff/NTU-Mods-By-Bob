const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { config } = require('dotenv');

const backendDir = path.resolve(__dirname, '..');

const loadEnvFile = (filePath, override = false) => {
  if (fs.existsSync(filePath)) {
    config({ path: filePath, override });
  }
};

const loadEnvGroup = (baseDir) => {
  loadEnvFile(path.join(baseDir, '.env'));
  const nodeEnv = process.env.NODE_ENV;
  if (nodeEnv) {
    loadEnvFile(path.join(baseDir, `.env.${nodeEnv}`), true);
  }
  loadEnvFile(path.join(baseDir, '.env.local'), true);
  if (nodeEnv) {
    loadEnvFile(path.join(baseDir, `.env.${nodeEnv}.local`), true);
  }
};

loadEnvGroup(backendDir);

const [command, ...args] = process.argv.slice(2);

if (!command) {
  console.error('Usage: node scripts/run-with-env.cjs <command> [...args]');
  process.exit(1);
}

const result = spawnSync(command, args, {
  stdio: 'inherit',
  shell: true,
  env: process.env,
});

process.exit(result.status ?? 1);
