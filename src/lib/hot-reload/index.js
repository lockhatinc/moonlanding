const { PromiseContainer, globalContainer, contain } = require('/config/workspace/moonlanding/src/lib/hot-reload/promise-container.js');
const { Mutex, MutexManager, globalManager } = require('/config/workspace/moonlanding/src/lib/hot-reload/mutex.js');
const { Supervisor, SupervisorTree, globalTree } = require('/config/workspace/moonlanding/src/lib/hot-reload/supervisor.js');
const { CheckpointManager, globalCheckpoint } = require('/config/workspace/moonlanding/src/lib/hot-reload/checkpoint.js');
const { TimeoutError, withTimeout, withAbortableTimeout, retry } = require('/config/workspace/moonlanding/src/lib/hot-reload/timeout-wrapper.js');
const { safeError, safeStringify } = require('/config/workspace/moonlanding/src/lib/hot-reload/safe-error.js');
const { CacheInvalidator, globalInvalidator } = require('/config/workspace/moonlanding/src/lib/hot-reload/cache-invalidator.js');
const { DirectoryWatcher, globalWatcher } = require('/config/workspace/moonlanding/src/lib/hot-reload/directory-watcher.js');
const { wrapRouteHandler, wrapRouteHandlers } = require('/config/workspace/moonlanding/src/lib/hot-reload/route-wrapper.js');
const { DebugExposure, globalDebug, expose } = require('/config/workspace/moonlanding/src/lib/hot-reload/debug-exposure.js');

expose('hotReload', {
  promises: globalContainer,
  mutexes: globalManager,
  supervisors: globalTree,
  checkpoints: globalCheckpoint,
  cache: globalInvalidator,
  watcher: globalWatcher,
  debug: globalDebug
}, 'Hot reload infrastructure');

module.exports = {
  PromiseContainer,
  globalContainer,
  contain,

  Mutex,
  MutexManager,
  globalManager,

  Supervisor,
  SupervisorTree,
  globalTree,

  CheckpointManager,
  globalCheckpoint,

  TimeoutError,
  withTimeout,
  withAbortableTimeout,
  retry,

  safeError,
  safeStringify,

  CacheInvalidator,
  globalInvalidator,

  DirectoryWatcher,
  globalWatcher,

  wrapRouteHandler,
  wrapRouteHandlers,

  DebugExposure,
  globalDebug,
  expose
};
