import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import minimist from 'minimist';
import inquirer from 'inquirer';
import { resolveCertIdentity } from '@utils/resolveCert';

/**git push
 * Runs the complete certification flow: preview, identity resolution, certification, and compilation.
 * @param argv Command-line arguments.
 */
export async function runCertifyFlow(argv: string[] = []) {
  const args = minimist(argv);

  // Dynamically import necessary commands to avoid circular dependencies
  const { runPreviewCommand } = await import('../preview');
  // Removed the import for runCertifyCommand from '../certify/index'
  const { runCompileCommand } = await import('../compile');

  await Promise.resolve()
    .then(async () => {
      // Step 1: Run the preview command
      await runPreviewCommand();

      // Prompt user for confirmation after preview
      const proceed = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'continue',
          message: '✅ Preview complete. Proceed with certification?',
          default: true,
        },
      ]);
      if (!proceed.continue) {
        throw new Error('⛔ Deployment aborted after preview.');
      }
    })
    .then(async () => {
      // Step 2: Resolve certification identity
      let id: string | undefined;
      let valid: string | undefined;

      const tempCertInfoPath = path.join('.dokugent', 'ops', 'temp', 'cert-info.json');

      // Attempt to load saved identity from temp file
      if (fsSync.existsSync(tempCertInfoPath)) {
        try {
          const saved = JSON.parse(await fs.readFile(tempCertInfoPath, 'utf8'));
          id = saved.id;
          valid = saved.valid;
        } catch (error) {
          // If file is corrupted, fallback to wizard. Log error for debugging.
          console.error(`Warning: Could not read cert-info.json, falling back to wizard: ${error}`);
        }
      }

      // If identity not found or corrupted, resolve using the wizard
      if (!id || !valid) {
        console.log('🔑 Resolving certification identity...');
        const resolved = await resolveCertIdentity(argv);
        id = resolved.id;
        valid = resolved.valid;
      }

      // If identity is successfully resolved, save it for future use
      if (id && valid) {
        const certInfo = JSON.stringify({ id, valid }, null, 2);
        await fs.mkdir(path.dirname(tempCertInfoPath), { recursive: true });
        await fs.writeFile(tempCertInfoPath, certInfo, 'utf8');
      } else {
        // This should ideally not happen if resolveCertIdentity always returns valid data
        throw new Error('⛔ Failed to resolve certification identity.');
      }

      // Step 3: Run the certify command, passing the resolved identity
      // Now calling the local runCertifyCommand defined in this file
      await runCertifyCommand(id, valid);
    })
    .then(async () => {
      // Step 4: Run the compile command
      await runCompileCommand();
    })
    .catch((error) => {
      console.error(`❌ Certification flow aborted: ${error.message}`);
      process.exit(1); // Exit with a non-zero code to indicate failure
    });
}

/**
 * Runs the certification command.
 * @param id The resolved identity ID (optional).
 * @param valid The resolved identity validity (optional).
 * @param argv Command-line arguments (optional, for backward compatibility if not using direct pass).
 */
export async function runCertifyCommand(
  id?: string,
  valid?: string,
  argv: string | string[] = ''
) {
  let selectedSigner: string | undefined = id;
  let validity: string | undefined = valid;

  // If ID or validity were not passed directly, try to load from temp file
  if (!selectedSigner || !validity) {
    const tempCertInfoPath = path.join('.dokugent', 'ops', 'temp', 'cert-info.json');
    if (fsSync.existsSync(tempCertInfoPath)) {
      try {
        const saved = JSON.parse(await fs.readFile(tempCertInfoPath, 'utf8'));
        selectedSigner = saved.id;
        validity = saved.valid;
      } catch (error) {
        console.error(`Warning: Could not read cert-info.json in runCertifyCommand: ${error}`);
        // Fallback to a default or error if identity cannot be determined
        selectedSigner = selectedSigner || 'Signer Unknown';
        validity = validity || 'Signer Unknown';
      }
    } else {
      selectedSigner = selectedSigner || 'Signer Not Found';
      validity = validity || 'Signer Not Found';
    }
  }

  console.log(`🔐 Using signer identity: ${selectedSigner}, validity: ${validity}`);
  // You can place cert execution logic here
  // For example: call an external certification service with selectedSigner and validity
}

export { runCertifyFlow as runDeployCommand };
