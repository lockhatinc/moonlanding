import { get, update } from '@/engine';

export function registerRfiResponseHooks(hookEngine) {
  hookEngine.registerHook('create:rfi_response:after', async (ctx) => {
    const { data } = ctx;
    if (!data?.rfi_id) return;

    const rfi = get('rfi', data.rfi_id);
    if (rfi) {
      const currentCount = rfi.response_count || 0;
      update('rfi', data.rfi_id, {
        response_count: currentCount + 1,
        last_response_date: Math.floor(Date.now() / 1000)
      });
    }
  });
}
