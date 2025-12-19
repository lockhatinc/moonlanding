import { migrate, genId, now, getDatabase } from '@/lib/database-core';
import { list, listWithPagination, search, searchWithPagination, count, get, getBy, create, update, remove, withTransaction, getChildren, batchGetChildren } from '@/lib/query-engine';
import { validateField, validateEntity, validateUpdate, hasErrors } from '@/lib/validate';
import bcrypt from 'bcrypt';

export { migrate, genId, now, getDatabase, list, listWithPagination, search, searchWithPagination, count, get, getBy, create, update, remove, withTransaction, getChildren, batchGetChildren, validateField, validateEntity, validateUpdate, hasErrors };

export default getDatabase();

export const hashPassword = async (password) => await bcrypt.hash(password, 12);
export const verifyPassword = async (password, hash) => await bcrypt.compare(password, hash);
