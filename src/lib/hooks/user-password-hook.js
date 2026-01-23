import { hookEngine } from '@/lib/hook-engine';
import { hashPassword } from '@/engine';

export function registerUserPasswordHook() {
  hookEngine.register('update:user:before', async (ctx) => {
    const { data } = ctx;
    if (!data || typeof data !== 'object') return ctx;

    const updateData = data.data || data;

    if (updateData.new_password && updateData.new_password.trim()) {
      const hashedPassword = await hashPassword(updateData.new_password);
      updateData.password_hash = hashedPassword;
      delete updateData.new_password;
    } else {
      delete updateData.new_password;
    }

    return ctx;
  }, { priority: 100, description: 'Hash new password on user update' });

  hookEngine.register('create:user:before', async (ctx) => {
    const data = ctx.data || ctx;

    if (data.new_password && data.new_password.trim()) {
      const hashedPassword = await hashPassword(data.new_password);
      data.password_hash = hashedPassword;
      delete data.new_password;
    } else if (data.password && data.password.trim()) {
      const hashedPassword = await hashPassword(data.password);
      data.password_hash = hashedPassword;
      delete data.password;
    }

    return { data };
  }, { priority: 100, description: 'Hash password on user creation' });

  console.log('[UserPasswordHook] Registered');
}
