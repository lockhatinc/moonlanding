import { getDatabase, beginTransaction, commit, rollback } from './database-init';

export class Transaction {
  constructor() {
    this.operations = [];
    this.started = false;
  }

  async begin() {
    if (this.started) {
      throw new Error('Transaction already started');
    }
    beginTransaction();
    this.started = true;
  }

  async rollback() {
    if (!this.started) {
      throw new Error('No transaction to rollback');
    }
    rollback();
    this.started = false;
    this.operations = [];
  }

  async commit() {
    if (!this.started) {
      throw new Error('No transaction to commit');
    }
    commit();
    this.started = false;
    this.operations = [];
  }

  recordOperation(operation) {
    this.operations.push(operation);
  }

  getOperations() {
    return [...this.operations];
  }

  async execute(callback) {
    try {
      await this.begin();
      const result = await callback(this);
      await this.commit();
      return result;
    } catch (error) {
      if (this.started) {
        await this.rollback();
      }
      throw error;
    }
  }
}

export async function withTransaction(callback) {
  const transaction = new Transaction();
  return await transaction.execute(callback);
}

export function createTransactionContext() {
  return new Transaction();
}

export async function executeInTransaction(operations) {
  return await withTransaction(async (tx) => {
    const results = [];

    for (const operation of operations) {
      const result = await operation();
      results.push(result);
      tx.recordOperation({
        type: operation.type,
        result,
        timestamp: Date.now(),
      });
    }

    return results;
  });
}

export async function executeWithRollback(operations, onError) {
  let results = [];
  let currentTx = null;

  try {
    currentTx = new Transaction();
    await currentTx.begin();

    for (const operation of operations) {
      const result = await operation();
      results.push(result);
      currentTx.recordOperation({
        type: operation.type,
        result,
        timestamp: Date.now(),
      });
    }

    await currentTx.commit();
    return { success: true, results };
  } catch (error) {
    if (currentTx && currentTx.started) {
      await currentTx.rollback();
    }

    if (onError) {
      await onError(error, results);
    }

    throw error;
  }
}
