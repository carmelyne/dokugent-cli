import { ui, paddedLog, paddedSub, printTable, menuList, padMsg, PAD_WIDTH, paddedCompact, glyphs, paddedDefault, padQuestion, paddedLongText, phaseHeader } from '@utils/cli/ui';
import { wrapWithHangingIndent } from '@utils/cli/wrap-utils';
import chalk from 'chalk';

// Helper log object for consistent UI demo logging
const log = {
  sectionTitle: (title: string) => {
    console.log();
    console.log(chalk.bold.underline(title));
    console.log();
  },
  divider: () => {
    console.log();
    ui.divider();
    console.log();
  },
  example: (label: string, content: string) => {
    paddedLog(label, content, PAD_WIDTH, 'info');
  },
  bulletList: (items: string[]) => {
    items.forEach(item => console.log(`• ${item}`));
  }
};

export default function runUiDemo() {
  console.log()
  // Info levels
  ui.info('This is an info message');
  ui.success('Operation completed successfully');
  ui.warn('This is a warning');
  ui.error('An error occurred');
  console.log()
  ui.headline('Headline Section');
  console.log()
  // Box display
  ui.box('This is a boxed message in green (default)');
  ui.box('Caution: Something is off!', 'yellow');
  // Multiline box
  ui.box(`Multiline box content:
  Line 1: Hello
  Line 2: World
  Line 3: 💬`, 'cyan');

  // Box with left alignment
  ui.box(`Left-aligned box\nLine A\nLine B`, 'orange', 'left');

  // Box with right alignment
  ui.box(`Right-aligned box\nLine X\nLine Y`, 'pink', 'right');

  // Box with custom hex border color
  ui.box(`Box with hex border color`, '#00CED1', 'center'); // dark turquoise

  // Example: Box with rounded border style (demonstrates borderStyle: 'round')
  ui.box('This box uses a rounded border style!', 'purple', 'center');

  // Example: Box with chalk.inverse() used for inline highlight
  // Box with inverse text inside
  const inverseText = chalk.inverse('Inverse Highlight');
  ui.box(`Message with ${inverseText} inside`, 'blue', 'center');
  ui.box('This is rounded', 'blue', 'center', 'round');
  ui.box('This is square', 'blue', 'center', 'single');
  console.log()

  // ────────────────
  // paddedLog EXPLANATION BLOCK
  // paddedLog(label, value, width = 12, level = 'info', labelPrefix?)
  //
  // ➤ width (3rd argument):
  //    - Controls the horizontal padding for both the label prefix and the indented value.
  //    - Default is 12 (PAD_WIDTH). Use 14 or 16 for nested log groups.
  //
  // ➤ level (4th argument):
  //    - success | info | warn | error | blue | orange | pink | purple | magenta
  //
  // ➤ labelPrefix (5th argument):
  //    - Optional emoji or label override.
  //
  // Examples:
  // paddedLog('Saved to', '/file/path');
  // paddedLog('Saved to', '/file/path', 16, 'info', '💾');
  // ────────────────

  console.log(chalk.gray('\n────────────────'));
  console.log(chalk.gray('paddedLog(label, value, width = 12, level = \'info\', labelPrefix?)'));
  console.log(chalk.gray('\n➤ width (3rd argument):'));
  console.log(chalk.white('   - Controls the horizontal padding for both the label prefix and the indented value.'));
  console.log(chalk.white('   - Default is 12 (PAD_WIDTH). Use 14 or 16 for nested log groups.'));
  console.log(chalk.gray('\n➤ level (4th argument):'));
  console.log(chalk.white('   - success | info | warn | error | blue | orange | pink | purple | magenta'));
  console.log(chalk.gray('\n➤ labelPrefix (5th argument):'));
  console.log(chalk.white('   - Optional emoji or label override.'));
  console.log(chalk.gray('\nExamples:'));
  console.log(chalk.white("  paddedLog('Saved to', '/file/path');"));
  console.log(chalk.white("  paddedLog('Saved to', '/file/path', 16, 'info', '💾');"));
  console.log(chalk.gray('────────────────\n'));
  console.log()
  // Padded Log
  paddedLog('Saved to', '/path/to/file.txt', 12, 'success', '💾');
  paddedLog('SHA Hash', 'abc123456789', 12, 'info');

  // Padded Subsection
  paddedSub('Agent Notes', 'Summarizes docs and updates cache\nHandles markdown input.');

  // Color palette demo
  paddedLog('success', 'green', 12, 'success');
  paddedLog('info', 'cyan', 12, 'info');
  paddedLog('warn', 'yellow', 12, 'warn');
  paddedLog('error', 'red', 12, 'error');
  paddedLog('blue', '#1E90FF', 12, 'blue');
  paddedLog('orange', '#FFA500', 12, 'orange');
  paddedLog('pink', '#FF69B4', 12, 'pink');
  paddedLog('purple', '#8A2BE2', 12, 'purple');
  paddedLog('magenta', 'default magenta', 12, 'magenta');

  // Color key legend
  console.log()
  console.log(chalk.bold.underline('Available Log Levels and Their Colors:'));
  console.log()
  console.log(chalk.green('  - success: green'));
  console.log(chalk.cyan('  - info: cyan'));
  console.log(chalk.yellow('  - warn: yellow'));
  console.log(chalk.red('  - error: red'));
  console.log(chalk.hex('#1E90FF')('  - blue: #1E90FF'));
  console.log(chalk.hex('#FFA500')('  - orange: #FFA500'));
  console.log(chalk.hex('#FF69B4')('  - pink: #FF69B4'));
  console.log(chalk.hex('#8A2BE2')('  - purple: #8A2BE2'));
  console.log(chalk.magenta('  - magenta: default magenta'));
  console.log()

  // Text Styling Options
  // Text Styles Examples
  console.log()
  console.log(chalk.bold('This is bold text'));
  console.log(chalk.underline('This is underlined text'));
  console.log(chalk.strikethrough('This is strikethrough text'));
  console.log(chalk.italic('This is italic text'));
  console.log(chalk.inverse('This is inverse text'));
  console.log(chalk.dim('This is dim text'));
  console.log(chalk.hidden('This text is hidden (you might not see it)'));
  console.log()

  // Glyphs examples
  ui.headline('Glyph Symbols Preview');
  console.log()
  paddedDefault(glyphs.arrowRight, 'ARROWRIGHT', PAD_WIDTH, 'info');
  Object.entries(glyphs).forEach(([name, symbol]) => {
    paddedDefault(symbol, name.toUpperCase(), PAD_WIDTH, 'info');
  });

  // Example: using a glyph in a paddedLog
  paddedLog('Favorite', 'summarybot', PAD_WIDTH, 'info', glyphs.starFilled + '1');

  // Example usage of padMsg and PAD_WIDTH
  paddedLog('padMsg', padMsg('Message aligned using padMsg()'), PAD_WIDTH, 'info');
  console.log()
  // Example usage of paddedCompact
  paddedCompact('Compact example', 'This version omits vertical spacing.', PAD_WIDTH, 'success');
  paddedCompact('Compact example', 'This version omits vertical spacing.', PAD_WIDTH, 'info');
  paddedCompact('Compact example', 'This version omits vertical spacing.', PAD_WIDTH, 'warn');
  console.log()
  // Example usage of 1 line paddedLog
  paddedLog("Single line paddedLog", "");
  paddedLog("Single line paddedLog", "");
  console.log()
  // Example usage of 1 line paddedCompact
  paddedCompact("Single line paddedCompact", "");
  paddedCompact("Single line paddedCompact", "");
  paddedCompact("Single line paddedCompact", "");
  console.log()
  // Example usage of paddedDefault (no dim label +wrapping)
  paddedDefault("Single line paddedDefault:", "Clean line");
  paddedDefault("Single line paddedDefault:", "Another one");
  // Example usage of paddedDefault (no label) and no colon
  paddedDefault("", "No dimming here");

  //   In paddedLog(label, value, width, color, tag), the color parameter (in this case 'info') acts as the ANSI color anchor or symbolic cue for visual formatting—like:
  // 	•	'info' → cyan or white (neutral)
  // 	•	'warn' → yellow
  // 	•	'error' → red
  // 	•	'success' → green

  // This tells the log formatter which color scheme to apply to the label and/or value. It’s not just for styling; it gives instant feedback at-a-glance about the message type
  // colorMap = {
  //   info: chalk.dim,
  //   warn: chalk.yellow,
  //   error: chalk.red,
  //   success: chalk.green,
  // };
  //
  // paddedLog('Dimmed label', 'the bida text in white', PAD_WIDTH, 'info', 'LEFT_TITLE');
  // Will:
  // 	•	Dim the "Dimmed label"
  // 	•	Keep "the bida text in white" bold or unstyled
  // 	•	Align and format it properly
  // 	•	Color tag 'LEFT_TITLE' based on the same theme


  // Example usage of padMsg
  console.log(padMsg(`Agent initialized with XX tokens.`));
  console.log()
  // Table
  const headers = ['Name', 'Status', 'Role'];
  const rows = [
    ['AgentA', 'Active', 'Summarizer'],
    ['AgentB', 'Inactive', 'Formatter'],
  ];
  printTable(headers, rows);
  console.log()
  // Another Table
  printTable(
    ['Name', 'Status', 'Role'],
    [
      ['AgentA', 'Very very long status that should wrap', 'Summarizer'],
      ['AgentB', 'OK', 'Formatter'],
    ]
  );
  // Menu List
  const projects = [
    { id: '1', name: 'Project Alpha', org: 'Acme Corp', region: 'us-west' },
    { id: '2', name: 'Beta Build', org: 'Beta Org', region: 'ap-southeast' },
  ];

  menuList(projects);

  // Divider example
  console.log()
  ui.divider();
  ui.divider(); // gray
  ui.divider('═', 50, chalk.blue); // blue line of ═, 50 chars long
  ui.divider('═', 100, chalk.magenta);
  console.log()

  // Step Logger Demo
  ui.headline('Step Logger Demo');
  console.log();

  ui.stepInfo('Preparing to run a sequence of tasks...');
  console.log(); // Add some space before the first actual step

  const step1 = ui.stepStart('Initializing system components');
  // Simulate work for step 1
  setTimeout(() => {
    ui.stepSuccess(step1, 'System components initialized');

    const step2 = ui.stepStart('Downloading required resources');
    // Simulate work for step 2
    setTimeout(() => {
      ui.stepSuccess(step2, 'Resources downloaded (5MB)');

      const step3 = ui.stepStart('Processing data batch');
      // Simulate work for step 3
      setTimeout(() => {
        ui.stepFail(step3, 'Data processing failed critically', 'Error: Invalid data format encountered in record #123.\nSchema validation failed for field "timestamp".');

        const step4 = ui.stepStart('Attempting to clean up temporary files');
        // Simulate work for step 4
        setTimeout(() => {
          ui.stepSuccess(step4, 'Cleanup complete');
          console.log();
          ui.stepInfo('All tasks processed. Review logs for details.');
          console.log(); // Final newline for Step Logger demo

          // Original spinner example, now placed after the async Step Logger demo
          const finalDemoSpinner = ui.spinner('Finalizing UI demo...');
          setTimeout(() => finalDemoSpinner.succeed('UI Demo concluded!'), 1500);

        }, 1500); // End of step 4 timeout
      }, 2000); // End of step 3 timeout
    }, 1500); // End of step 2 timeout
  }, 1000); // End of step 1 timeout

  // start change
  console.log()
  ui.divider();
  console.log()

  console.log('❌ No plan folder found.');
  paddedLog('Uh oh...', 'No plan directory found.', PAD_WIDTH, 'warn');
  paddedLog(
    'Wrapped Output',
    'This is a very long warning message intended to demonstrate line wrapping within the paddedLog output block. If the terminal width is small, this text should wrap cleanly while preserving indent and alignment.',
    PAD_WIDTH,
    'warn'
  );

  console.log(`\n📁 Plan Steps (0):\n`);
  paddedDefault("Available Plan Steps", `(0)`, PAD_WIDTH, 'magenta', 'PLANS');
  console.log()

  console.log(`  📂 f`);
  paddedSub('', glyphs.arrowRight);
  paddedSub('Arrow Glyph', glyphs.arrowRight);

  const folders = ['Folder A', 'Folder B'];
  paddedSub('', folders.map(f => `${glyphs.arrowRight} ${f}`).join('\n'));


  console.log('❌ No agents directory found.');
  paddedLog('Uh oh...', 'No agents directory found.', PAD_WIDTH, 'warn');

  // console.log();
  console.log()
  ui.divider();
  console.log()
  // end change

  ui.link(`${glyphs.infoInfo} Dokugent Docs`, 'https://dokugent.com/docs');
  ui.link(`${glyphs.linkAscii} Dokugent Docs`, 'https://dokugent.com/docs');
  ui.link(`${glyphs.protoHttp} Dokugent Docs`, 'https://dokugent.com/docs');
  console.log()

  ui.link(`${glyphs.arrowRight} https://dokugent.com`, 'https://dokugent.com/');
  ui.link(`${glyphs.info} https://dokugent.com/getting-started/`, 'https://dokugent.com/getting-started/');
  console.log()
  console.log()
  // Spinner (runs for 2 seconds)
  const spinner = ui.spinner('Loading...');
  setTimeout(() => spinner.succeed('Done'), 2000);
  console.log()

  console.log()
  paddedCompact('dokugent agent initialized...', '', PAD_WIDTH, 'info');

  paddedLog('Trace Completed.', '', 12, 'warn', 'TRACE');
  paddedSub('', 'Trace Result'); //indented white text
  paddedLog('To see a list available agents', `dokugent agent --ls`, PAD_WIDTH, 'blue', 'HELP');

  console.log()
  const PAD_WIDTH_INDENT = 12; // left margin/padding

  const longValue = `This is a long string meant to demonstrate a hanging indent inside a terminal. It wraps across multiple lines and each continuation line should align nicely under the value.This is a long string meant to demonstrate a hanging indent inside a terminal. It wraps across multiple lines and each continuation line should align nicely under the value.This is a long string meant to demonstrate a hanging indent inside a terminal. It wraps across multiple lines and each continuation line should align nicely under the value.This is a long string meant to demonstrate a hanging indent inside a terminal. It wraps across multiple lines and each continuation line should align nicely under the value.`;

  const keyLabel = '"description": ';

  // Include ANSI color codes if needed (optional)
  const prefix = `\x1b[32m${keyLabel}"`;

  const wrapped = wrapWithHangingIndent(longValue, prefix, undefined, PAD_WIDTH_INDENT)

  // Print it
  console.log(`${wrapped}"\x1b[0m`);
  console.log()

  paddedLongText('"description"', longValue, PAD_WIDTH, 'magenta');
  console.log()

  phaseHeader('1', 'Agent Identity Verification');
  phaseHeader('2', 'Security Checks', '#FFA500'); // uses orange hex
}

// --- ADDED: Write UI demo sample log file ---
import fs from 'fs-extra';
import path from 'path';
import { estimateTokensFromText } from '@utils/tokenizer';

const sample = {
  agentId: 'demo@2025-06-08_00-00-00-000',
  previewTimestamp: new Date().toISOString(),
  plan: {
    estimatedTokens: estimateTokensFromText('{}')
  },
  criteria: {
    estimatedTokens: estimateTokensFromText('{}')
  },
  conventions: {
    estimatedTokens: estimateTokensFromText('{}')
  }
};

fs.outputJsonSync(path.join('.omnimodal/ui-demo/uiPath.log.json'), sample, { spaces: 2 });
