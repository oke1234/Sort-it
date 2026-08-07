const deletingUserIds = new Set();
const activeSyncCounts = new Map();
const syncIdleWaiters = new Map();

export const beginAccountDeletion = (userId) => {
  if (userId) deletingUserIds.add(userId);
};

export const endAccountDeletion = (userId) => {
  if (userId) deletingUserIds.delete(userId);
};

export const isAccountDeletionInProgress = (userId) =>
  Boolean(userId && deletingUserIds.has(userId));

export const registerAccountSyncStart = (userId) => {
  if (!userId) return;

  activeSyncCounts.set(
    userId,
    (activeSyncCounts.get(userId) ?? 0) + 1
  );
};

export const registerAccountSyncEnd = (userId) => {
  if (!userId) return;

  const nextCount = Math.max(
    0,
    (activeSyncCounts.get(userId) ?? 1) - 1
  );

  if (nextCount > 0) {
    activeSyncCounts.set(userId, nextCount);
    return;
  }

  activeSyncCounts.delete(userId);
  const waiters = syncIdleWaiters.get(userId) ?? [];
  syncIdleWaiters.delete(userId);
  waiters.forEach((resolve) => resolve());
};

export const waitForAccountSyncIdle = (userId) => {
  if (!userId || (activeSyncCounts.get(userId) ?? 0) === 0) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const waiters = syncIdleWaiters.get(userId) ?? [];
    waiters.push(resolve);
    syncIdleWaiters.set(userId, waiters);
  });
};
