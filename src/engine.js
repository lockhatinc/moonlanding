import { migrate, genId, now, getDatabase } from '@/lib/database-core';
import { list, listWithPagination, search, count, get, getBy, create, update, remove, withTransaction } from '@/lib/query-engine';
import { validateField, validateEntity, validateUpdate, hasErrors } from '@/lib/validate';

export { migrate, genId, now, getDatabase, list, listWithPagination, search, count, get, getBy, create, update, remove, withTransaction, validateField, validateEntity, validateUpdate, hasErrors };

export default getDatabase();

export const hashPassword = (password) => require('crypto').createHash('sha256').update(password).digest('hex');
export const verifyPassword = (password, hash) => hashPassword(password) === hash;
