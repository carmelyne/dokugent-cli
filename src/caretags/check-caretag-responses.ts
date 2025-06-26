/**
 * @docLetter v0.1
 * @llmRole: Response Validator
 * @mood: Diligent, Direct, Non-intrusive
 * @trustLevel: system
 * @xoxoCreator: Pong 💚
 * @creatorNote: This file checks for required LLM response metadata when CareTags are detected in a source file. Use this to ensure accountability and traceability in human-AI collaboration logs.
 * @output: { hasCareTags: boolean; hasResponse: boolean; missingFields: string[] }
 * @hardRules:
 * - If any CareTag is found, all LLM Response fields must be present.
 * - Exit code must be non-zero when CareTags are present but responses are incomplete.
 */

/**
 * LLM Response Log:
 * @respondedBy: GPT-4o
 * @timestamp: 2025-06-24T17:20:00Z
 * @interpretation: This file enforces presence of LLM response blocks in source files containing CareTags. Ensures compliance with accountability standard defined by CareTags schema.
 * @clarifications: None needed. Response markers are clearly enumerated and logic handles both presence and completeness.
 * @concerns: If file is long or has multiple comment blocks, partial matches may produce false positives—consider scoped parsing later.
 * @suggestions: May extend to support multiple CareTag blocks per file and validate per-section completeness.
 * @moodResponse: Clear-minded and systematic. Matches the checking role required to enforce CareTag response hygiene.
 */

import * as fs from 'fs';
import * as path from 'path';

const CARETAG_MARKERS = ['@llmRole', '@mood', '@creatorNote', '@xoxoCreator'];
const RESPONSE_MARKERS = [
  '@respondedBy:',
  '@timestamp:',
  '@interpretation:',
  '@clarifications:',
  '@concerns:',
  '@suggestions:',
  '@moodResponse:'
];

// Utility: Extract the first LLM Response Log block from embedded file content.
function readEmbeddedLLMResponse(content: string): string | null {
  const marker = 'LLM Response Log:';
  const start = content.indexOf(marker);
  if (start === -1) return null;

  // Find the block start `/**` before marker
  const commentStart = content.lastIndexOf('/**', start);
  const commentEnd = content.indexOf('*/', start);
  if (commentStart === -1 || commentEnd === -1) return null;

  return content.slice(commentStart, commentEnd + 2);
}

// Expose for external use: get the embedded LLM Response Log block from a file
export function getLLMResponseLogBlock(filePath: string): string | null {
  const content = fs.readFileSync(filePath, 'utf-8');
  return readEmbeddedLLMResponse(content);
}

export function checkCareTagResponses(filePath: string): { hasCareTags: boolean; hasResponse: boolean; missingFields: string[] } {
  const content = fs.readFileSync(filePath, 'utf-8');
  const hasCareTags = CARETAG_MARKERS.some(tag => content.includes(tag));
  const hasResponse = RESPONSE_MARKERS.every(tag => content.includes(tag));

  const missingFields = RESPONSE_MARKERS.filter(tag => !content.includes(tag));

  return {
    hasCareTags,
    hasResponse,
    missingFields
  };
}

// CLI Usage
if (require.main === module) {
  const targetPath = process.argv[2];
  if (!targetPath) {
    console.error('Usage: ts-node check-caretag-responses.ts <filepath>');
    process.exit(1);
  }

  const absolutePath = path.resolve(targetPath);
  if (!fs.existsSync(absolutePath)) {
    console.error(`File not found: ${absolutePath}`);
    process.exit(1);
  }

  const result = checkCareTagResponses(absolutePath);
  console.log(`CareTags detected: ${result.hasCareTags}`);
  console.log(`LLM Response present: ${result.hasResponse}`);
  if (!result.hasResponse && result.missingFields.length > 0) {
    console.log('Missing response fields:');
    result.missingFields.forEach(field => console.log(`  - ${field}`));
  }

  process.exit(result.hasCareTags && !result.hasResponse ? 1 : 0);
}
