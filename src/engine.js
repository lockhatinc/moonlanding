import { migrate, genId, now, getDatabase, closeDatabase } from '@/lib/database/database-init';
import { list, listWithPagination, search, count } from '@/lib/database/crud-list';
import { get, getBy, getWithRelations, getChildren } from '@/lib/database/crud-get';
import { create, createMany } from '@/lib/database/crud-create';
import { update, updateFields, updateMany } from '@/lib/database/crud-update';
import { remove, softDelete, hardDelete, restore, deleteMany } from '@/lib/database/crud-delete';
import { withTransaction, Transaction, executeInTransaction } from '@/lib/database/transactions';

export {
  migrate,
  genId,
  now,
  getDatabase,
  closeDatabase,
  list,
  listWithPagination,
  search,
  count,
  get,
  getBy,
  getWithRelations,
  getChildren,
  create,
  createMany,
  update,
  updateFields,
  updateMany,
  remove,
  softDelete,
  hardDelete,
  restore,
  deleteMany,
  withTransaction,
  Transaction,
  executeInTransaction,
};

export default getDatabase();

export function hashPassword(password) {
  return require('crypto').createHash('sha256').update(password).digest('hex');
}

export function verifyPassword(password, hash) {
  return hashPassword(password) === hash;
}
