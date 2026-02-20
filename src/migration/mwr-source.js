// MyWorkReview source - reads from live HTTP export endpoint
const MWR_URL = 'https://us-central1-audit-7ec47.cloudfunctions.net/exportDataForStaging';
const MWR_KEY = '528c1f314f3d9817f88e27cb0d6154bc206016d4d52bcff95c14b25258ebd90f';

export async function fetchMwrData() {
  console.log('  Fetching MWR data from HTTP endpoint...');
  const res = await fetch(MWR_URL, {
    headers: { 'x-firestore-sync-key': MWR_KEY },
    signal: AbortSignal.timeout(60000),
  });
  if (!res.ok) throw new Error(`MWR fetch failed: ${res.status} ${await res.text()}`);
  const raw = await res.json();

  const result = {};
  for (const [key, arr] of Object.entries(raw)) {
    result[key] = Array.isArray(arr) ? arr : [];
    console.log(`  MWR ${key}: ${result[key].length} docs`);
  }
  return result;
}
