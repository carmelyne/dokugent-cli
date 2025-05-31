import { runSimulateViaMistral } from '../../utils/simulate-runner';

export async function runSimulateCommand() {
  console.log('\n🧪 Starting Dokugent Simulation\n');

  try {
    await runSimulateViaMistral();
    console.log('\n✅ \x1b[1mSimulation complete. No LLMs were harmed.\x1b[22m\n');
  } catch (err: any) {
    console.error('\n❌ Simulation failed:', err.message);
  }
}
