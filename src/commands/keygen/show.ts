import fs from 'fs/promises';
import path from 'path';

export async function runShowKeygen(args: string[]): Promise<void> {
  const knownCommands = ['keygen'];
  const name = args.find(arg => !arg.startsWith('--') && !knownCommands.includes(arg));

  if (!name) {
    console.error(`\n❌ No identity name provided.\n`);
    console.error(`💡 Try: dokugent keygen <ownerName> --show\n`);
    return;
  }

  const basePath = path.resolve('.dokugent/keys/owners', name, 'latest');

  const publicKeyPath = path.join(basePath, `${name}.public.pem`);
  const privateKeyPath = path.join(basePath, `${name}.private.pem`);

  try {
    const publicKey = await fs.readFile(publicKeyPath, 'utf-8');
    const privateKey = await fs.readFile(privateKeyPath, 'utf-8');

    console.log(`\n📄 Public Key Content:\n${publicKey}`);
    console.log(`\n📄 Private Key Content:\n${privateKey}`);
  } catch (error) {
    console.error(`\n❌ Failed to load keys for "${name}".\n   Make sure an identity exists at ".dokugent/keys/owners/..."`);
    console.error(`\n💡 Try creating a new key using: dokugent keygen\n`);
  }
}
