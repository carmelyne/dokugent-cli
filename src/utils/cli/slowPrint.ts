export async function slowPrint(text: string, delay = 5): Promise<void> {
  const PAD_WIDTH_SCROLL = 12;
  const lines = text.split('\n');
  for (const rawLine of lines) {
    if (rawLine.trim() === '') continue; // skip blank lines

    const paddedLine = ' '.repeat(PAD_WIDTH_SCROLL) + rawLine;
    for (const char of paddedLine) {
      process.stdout.write(char);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    process.stdout.write('\n');
  }
}
