#!/usr/bin/env node

require('ts-node/register'); // allows TypeScript at runtime
require('tsconfig-paths/register'); // resolves @ paths
require('./dokugent.ts'); // your actual CLI entry
