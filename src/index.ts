import { estimateTokensFromText, warnIfExceedsLimit } from './utils/tokenizer';

const sample = 'This is a test sentence for token counting.';
const tokens = estimateTokensFromText(sample);
warnIfExceedsLimit('TestAgent', tokens, { tokenLimit: 10 });

console.log("Hello Dokugent TS!");