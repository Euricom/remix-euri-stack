import path from 'node:path';
import fs from 'node:fs/promises';

const getRandomString = (length) => crypto.randomBytes(length).toString('hex');
const getRandomString32 = () => getRandomString(32);

export default async function main({ rootDirectory }) {
  const ENV_PATH = path.join(rootDirectory, '.env');
  const EXAMPLE_ENV_PATH = path.join(rootDirectory, '.env.example');
  const PKG_PATH = path.join(rootDirectory, 'package.json');

  const DIR_NAME = path.basename(rootDirectory);
  const SUFFIX = getRandomString(2);

  const APP_NAME = (DIR_NAME + '-' + SUFFIX)
    // get rid of anything that's not allowed in an app name
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .toLowerCase();

  const [env, packageJsonString] = await Promise.all([
    fs.readFile(EXAMPLE_ENV_PATH, 'utf-8'),
    fs.readFile(PKG_PATH, 'utf-8'),
  ]);

  const newEnv = env.replace(/^SESSION_SECRET=.*$/m, `SESSION_SECRET="${getRandomString(16)}"`);
  const packageJson = JSON.parse(packageJsonString);
  packageJson.name = APP_NAME;
  delete packageJson.author;
  delete packageJson.license;

  const fileOperationPromises = [
    fs.writeFile(ENV_PATH, newEnv),
    fs.writeFile(PKG_PATH, JSON.stringify(packageJson, null, 2)),
    fs.copyFile(path.join(rootDirectory, 'remix.init', 'gitignore'), path.join(rootDirectory, '.gitignore')),
    fs.rm(path.join(rootDirectory, 'LICENSE.md')),
    fs.rm(path.join(rootDirectory, 'CONTRIBUTING.md')),
    fs.rm(path.join(rootDirectory, 'docs'), { recursive: true }),
    // fs.rm(path.join(rootDirectory, 'tests/e2e/notes.test.ts')),
    // fs.rm(path.join(rootDirectory, 'tests/e2e/search.test.ts')),
    // fs.rm(path.join(rootDirectory, '.github/workflows/version.yml')),
  ];

  await Promise.all(fileOperationPromises);
}
