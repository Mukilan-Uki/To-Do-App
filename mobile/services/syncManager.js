import { localTaskService } from "./localStorageService";
import { syncQueue } from "./syncQueue";

// Utility: merge local and online tasks with id mapping
async function mergeTasks(localTasks, onlineTasks) {
  const idMap = await syncQueue.getIdMap();
  const byServerId = new Map();

  // Index online tasks by server id
  (onlineTasks || []).forEach((t) => byServerId.set(t._id, t));

  const merged = [];

  // For each local task, if it maps to a server id, merge respecting timestamps
  for (const lt of localTasks || []) {
    const mapped = idMap[lt._id] || lt._id;
    if (mapped && byServerId.has(mapped)) {
      const server = byServerId.get(mapped);
      // determine last-updated timestamps
      const localTs = new Date(lt.updatedAt || lt.createdAt || 0).getTime();
      const serverTs = new Date(
        server.updatedAt || server.createdAt || 0,
      ).getTime();

      // If local is newer, prefer local fields but keep server id and authoritative fields
      if (localTs > serverTs) {
        const mergedTask = {
          ...server,
          ...lt,
          _id: server._id,
          isLocal: false,
        };
        merged.push(mergedTask);
      } else {
        // server is newer or equal: use server version
        merged.push(server);
      }
      byServerId.delete(mapped);
    } else {
      // no server mapping: keep local task (may be a new local-only task)
      merged.push(lt);
    }
  }

  // append remaining server-only tasks
  for (const t of byServerId.values()) merged.push(t);

  // sort by order then createdAt fallback
  merged.sort(
    (a, b) =>
      (a.order || 0) - (b.order || 0) ||
      new Date(b.createdAt) - new Date(a.createdAt),
  );
  return merged;
}
import { taskAPI } from "./apiService";

export const syncManager = {
  syncTasks: async () => {
    const localTasks = await localTaskService.getTasks();

    // attempt to process queue first (best-effort)
    try {
      await syncQueue.process();
    } catch (err) {
      /* noop */
    }

    try {
      const { data: onlineTasks } = await taskAPI.getTasks();
      const allTasks = await mergeTasks(localTasks, onlineTasks || []);
      return {
        allTasks,
        onlineTasks: onlineTasks || [],
        projects: (onlineTasks || []).filter((t) => t.type === "project"),
        isOffline: false,
      };
    } catch (e) {
      console.warn(
        "Server unreachable — using offline tasks only.",
        e?.message,
      );
      return {
        allTasks: localTasks,
        onlineTasks: [],
        projects: [],
        isOffline: true,
      };
    }
  },
};
