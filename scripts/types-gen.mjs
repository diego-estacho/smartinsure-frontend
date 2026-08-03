#!/usr/bin/env node
// Wrapper for `openapi-typescript`, invoked cross-platform (no shell, no
// POSIX `${VAR:-default}` syntax — pnpm runs scripts through cmd.exe on
// Windows, which does not understand that substitution).
//
// Behaviour preserved from the old script string:
//   openapi-typescript ${OPENAPI_CONTRACT:-../smartinsure-backend/docs/generated/openapi.json} -o app/types/gen/api.ts
import { spawnSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const input = process.env.OPENAPI_CONTRACT || '../smartinsure-backend/docs/generated/openapi.json'
const output = 'app/types/gen/api.ts'
const cliPath = resolve(repoRoot, 'node_modules/openapi-typescript/bin/cli.js')

const result = spawnSync(process.execPath, [cliPath, input, '-o', output], {
  cwd: repoRoot,
  stdio: 'inherit',
})

if (result.error) throw result.error
process.exit(result.status ?? 1)
