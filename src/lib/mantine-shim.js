/**
 * Mantine Import Shim
 * Redirects @mantine imports to compatibility layer during migration
 * 
 * Usage: Node will resolve @mantine/core imports to this shim module
 */

export * from './mantine-compat.jsx';
