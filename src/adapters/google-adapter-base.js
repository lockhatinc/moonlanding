export class GoogleAdapter {
  constructor(serviceName, getClientFn) {
    this.serviceName = serviceName;
    this.getClientFn = getClientFn;
  }

  async withClient(callback) {
    const client = await this.getClientFn();
    if (!client) throw new Error(`${this.serviceName} client not available`);
    return callback(client);
  }

  async safeExecute(callback, errorContext = 'operation') {
    return this.withClient(async (client) => {
      try {
        return await callback(client);
      } catch (e) {
        console.error(`[${this.serviceName}] ${errorContext} error:`, e.message);
        throw e;
      }
    });
  }
}

export const createAdapterMethod = (adapter, handler, errorContext) =>
  (...args) => adapter.safeExecute((client) => handler(client, ...args), errorContext);
