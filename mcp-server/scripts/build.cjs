#!/usr/bin/env node
// Stages a self-contained copy of mcp-server/ + the specific service/util/config/data
// files it needs (from the parent repo) into mcp-server/build/, ready for `mcpb pack`.
//
// Why this exists: mcp-server/index.js calls the Express app's service layer
// in-process via relative imports (../services/..., etc.) so there's a single
// source of truth in git — nothing is duplicated by hand. An end user's .mcpb
// install never has the rest of this repo sitting next to it, though, so this
// script mechanically copies just the transitively-needed files into a staging
// folder that IS fully self-contained, preserving the exact same relative
// directory nesting the source imports already expect (mcp-server/ -> server/,
// with services/utils/config/data as siblings) so nothing needs path-rewriting.
//
// Two package.json files are used deliberately: build/package.json (no "type"
// field, so it defaults to CommonJS - governs the copied services/utils/config)
// and build/server/package.json ("type": "module" - governs index.js, matching
// mcp-server/package.json today). Both share one node_modules at the build/
// root, which Node's upward module resolution finds from either subtree.

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const MCP_SERVER_DIR = path.join(__dirname, '..');
const REPO_ROOT = path.join(MCP_SERVER_DIR, '..');
const BUILD_DIR = path.join(MCP_SERVER_DIR, 'build');

const SERVICE_FILES = [
  'services/dorar/hadithSearch.service.js',
  'services/dorar/sharhSearch.service.js',
  'services/dorar/mohdithSearch.service.js',
  'services/dorar/bookSearch.service.js',
  'services/data.service.js',
  'services/common/cache.service.js',
  'services/common/dorarFetch.service.js',
  'services/common/hadithMapper.service.js',
];

const UTIL_FILES = [
  'utils/fetchWithTimeout.js',
  'utils/AppError.js',
  'utils/cache.js',
  'utils/parseHadithInfo.js',
  'utils/parseHadithCategories.js',
  'utils/getSimilarHadithDorar.js',
  'utils/getHadithId.js',
  'utils/getAlternateHadithSahihDorar.js',
  'utils/getUsulHadithDorar.js',
  'utils/getAsbabWurudDorar.js',
  'utils/serializeQueryParams.js',
];

const CONFIG_FILES = ['config/config.js'];

const DATA_FILES = [
  'data/book.json',
  'data/degree.json',
  'data/method-search.json',
  'data/mohdith.json',
  'data/rawi.json',
  'data/zone-search.json',
];

function copyFile(relativePath) {
  const src = path.join(REPO_ROOT, relativePath);
  const dest = path.join(BUILD_DIR, relativePath);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function main() {
  console.log(`Cleaning ${BUILD_DIR}`);
  fs.rmSync(BUILD_DIR, { recursive: true, force: true });
  fs.mkdirSync(BUILD_DIR, { recursive: true });

  console.log('Copying service/util/config/data files (single source of truth stays in git)...');
  [...SERVICE_FILES, ...UTIL_FILES, ...CONFIG_FILES, ...DATA_FILES].forEach(copyFile);

  console.log('Copying mcp-server entry point + glossary + manifest + icon...');
  fs.mkdirSync(path.join(BUILD_DIR, 'server'), { recursive: true });
  fs.copyFileSync(
    path.join(MCP_SERVER_DIR, 'index.js'),
    path.join(BUILD_DIR, 'server', 'index.js'),
  );
  fs.copyFileSync(
    path.join(MCP_SERVER_DIR, 'gradingGlossary.json'),
    path.join(BUILD_DIR, 'server', 'gradingGlossary.json'),
  );
  fs.copyFileSync(
    path.join(MCP_SERVER_DIR, 'manifest.json'),
    path.join(BUILD_DIR, 'manifest.json'),
  );
  fs.copyFileSync(
    path.join(MCP_SERVER_DIR, 'icon.png'),
    path.join(BUILD_DIR, 'icon.png'),
  );

  // server/package.json: "type": "module" only, so server/index.js resolves as
  // ESM regardless of the CommonJS root package.json below it (Node uses the
  // nearest ancestor package.json's "type" field).
  fs.writeFileSync(
    path.join(BUILD_DIR, 'server', 'package.json'),
    JSON.stringify({ name: 'dorar-hadith-mcp-server', private: true, type: 'module' }, null, 2) + '\n',
  );

  // Root package.json: no "type" field (defaults to CommonJS, matching how
  // services/utils/config already run in the main Express app), and the full
  // merged dependency list needed by both server/index.js and the copied
  // service files, so a single `npm install` here produces one shared
  // node_modules that both subtrees can find via upward resolution.
  const mcpServerPkg = JSON.parse(
    fs.readFileSync(path.join(MCP_SERVER_DIR, 'package.json'), 'utf-8'),
  );
  fs.writeFileSync(
    path.join(BUILD_DIR, 'package.json'),
    JSON.stringify(
      {
        name: 'dorar-hadith-mcp-bundle',
        private: true,
        version: mcpServerPkg.version,
        dependencies: mcpServerPkg.dependencies,
      },
      null,
      2,
    ) + '\n',
  );

  console.log('Running npm install in build/ (production deps only)...');
  // shell: true is required on Windows to spawn npm.cmd at all (a documented
  // Node quirk); the args below are static literals with no user input, so the
  // usual shell-escaping concern that flag normally carries doesn't apply here.
  execFileSync('npm', ['install', '--omit=dev', '--no-audit', '--no-fund'], {
    cwd: BUILD_DIR,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  console.log(`\nBuild staged at ${BUILD_DIR}`);
}

main();
