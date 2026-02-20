import { IntegrationTestHarness } from './integration-harness.js';
import { registerInputEdgeCases } from './edge-case-input-tests.js';
import { registerRuntimeEdgeCases } from './edge-case-runtime-tests.js';

export async function runEdgeCaseTests() {
  const harness = new IntegrationTestHarness();

  registerInputEdgeCases(harness);
  registerRuntimeEdgeCases(harness);

  return harness.summary();
}
