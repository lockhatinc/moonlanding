import promiseContainerMod from '/config/workspace/moonlanding/src/lib/hot-reload/promise-container.js';
import { Mutex, MutexManager, globalManager } from '/config/workspace/moonlanding/src/lib/hot-reload/mutex.js';
import supervisorMod from '/config/workspace/moonlanding/src/lib/hot-reload/supervisor.js';
import checkpointMod from '/config/workspace/moonlanding/src/lib/hot-reload/checkpoint.js';
import timeoutMod from '/config/workspace/moonlanding/src/lib/hot-reload/timeout-wrapper.js';
import safeErrorMod from '/config/workspace/moonlanding/src/lib/hot-reload/safe-error.js';
import cacheInvalidatorMod from '/config/workspace/moonlanding/src/lib/hot-reload/cache-invalidator.js';
import directoryWatcherMod from '/config/workspace/moonlanding/src/lib/hot-reload/directory-watcher.js';
import routeWrapperMod from '/config/workspace/moonlanding/src/lib/hot-reload/route-wrapper.js';
import debugExposureMod from '/config/workspace/moonlanding/src/lib/hot-reload/debug-exposure.js';

const { PromiseContainer, globalContainer, contain } = promiseContainerMod;
const { Supervisor, SupervisorTree, globalTree } = supervisorMod;
const { CheckpointManager, globalCheckpoint } = checkpointMod;
const { TimeoutError, withTimeout, withAbortableTimeout, retry } = timeoutMod;
const { safeError, safeStringify } = safeErrorMod;
const { CacheInvalidator, globalInvalidator } = cacheInvalidatorMod;
const { DirectoryWatcher, globalWatcher } = directoryWatcherMod;
const { wrapRouteHandler, wrapRouteHandlers } = routeWrapperMod;
const { DebugExposure, globalDebug, expose } = debugExposureMod;

expose('hotReload', {
  promises: globalContainer,
  mutexes: globalManager,
  supervisors: globalTree,
  checkpoints: globalCheckpoint,
  cache: globalInvalidator,
  watcher: globalWatcher,
  debug: globalDebug
}, 'Hot reload infrastructure');

export {
  PromiseContainer, globalContainer, contain,
  Mutex, MutexManager, globalManager,
  Supervisor, SupervisorTree, globalTree,
  CheckpointManager, globalCheckpoint,
  TimeoutError, withTimeout, withAbortableTimeout, retry,
  safeError, safeStringify,
  CacheInvalidator, globalInvalidator,
  DirectoryWatcher, globalWatcher,
  wrapRouteHandler, wrapRouteHandlers,
  DebugExposure, globalDebug, expose
};
