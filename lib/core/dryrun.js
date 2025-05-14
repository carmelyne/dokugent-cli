import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

function countTokens(str) {
  return str.split(/\s+/).length;
}


export async function dryrun() {
  const compiledDir = path.join('.dokugent', 'structured', 'latest');
  if (!fs.existsSync(compiledDir)) {
    throw new Error('No compiled output found. Run `dokugent compile` first.');
  }

  const files = fs.readdirSync(compiledDir).filter(f => f.endsWith('.json'));
  if (!files.length) {
    throw new Error('No compiled JSON files found in .dokugent/structured.');
  }

  // Get most recent file
  const sorted = files.sort((a, b) =>
    fs.statSync(path.join(compiledDir, b)).mtimeMs - fs.statSync(path.join(compiledDir, a)).mtimeMs
  );
  const latestFile = sorted[0];
  const fullPath = path.join(compiledDir, latestFile);
  const compiled = JSON.parse(fs.readFileSync(fullPath, 'utf8'));

  console.log(`\n🧪 Dryrun Report (Agent Simulation)\n`);
  console.log(`🗂️  Source: compiled/${latestFile}`);
  console.log(`🧠  Token Breakdown:`);
  for (const key of Object.keys(compiled.meta.tokens)) {
    console.log(`  - ${key}: ${compiled.meta.tokens[key]} tokens`);
  }

  console.log(`\n📦 Keys in Compiled JSON:\n`);
  Object.keys(compiled).forEach(key => {
    console.log(`  - ${key}`);
  });

  if (compiled['criteria.cert']) {
    console.log(`\n📄 Value of criteria.cert:\n`);
    console.log(compiled['criteria.cert']);
  } else {
    console.log(`\n⚠️ criteria.cert not found in compiled output.`);
  }

  // if (compiled['plan.cert']) {
  //   console.log(`\n📄 Value of plan.cert:\n`);
  //   console.log(compiled['plan.cert']);
  // } else {
  //   console.log(`\n⚠️ plan.cert not found in compiled output.`);
  // }

  // Extract agent role and goal from plan.cert fields, not by regex
  const role = compiled['plan.cert']?.role || 'unspecified';
  const goal = compiled['plan.cert']?.goal || 'unspecified';

  console.log(`\n🎭 Agent Role: ${role}`);
  console.log(`🎯 Agent Goal: ${goal}`);
}
