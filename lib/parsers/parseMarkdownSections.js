

import fs from 'fs';

/**
 * Parses a markdown file and returns an object where each top-level header (## or #) becomes a key,
 * and its associated content becomes the value.
 * 
 * Example:
 * ## Plan
 * - Step 1
 * - Step 2
 * 
 * Returns:
 * {
 *   Plan: "- Step 1\n- Step 2"
 * }
 */
export function parseMarkdownSections(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  const sections = {};
  let currentHeader = null;
  let buffer = [];

  for (const line of lines) {
    const headerMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headerMatch) {
      if (currentHeader) {
        sections[currentHeader] = buffer.join('\n').trim();
      }
      currentHeader = headerMatch[2].trim();
      buffer = [];
    } else if (currentHeader) {
      buffer.push(line);
    }
  }

  if (currentHeader) {
    sections[currentHeader] = buffer.join('\n').trim();
  }

  return sections;
}