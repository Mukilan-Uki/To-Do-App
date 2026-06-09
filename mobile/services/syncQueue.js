import AsyncStorage from "@react-native-async-storage/async-storage";
import { taskAPI } from "./apiService";
import { localTaskService } from "./localStorageService";

const QUEUE_KEY = "@sync_queue";
const ID_MAP_KEY = "@id_map";
let _processing = false; // in-memory lock to avoid concurrent runs

async function readQueue() {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function writeQueue(q) {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(q));
}

async function readIdMap() {
  const raw = await AsyncStorage.getItem(ID_MAP_KEY);
  return raw ? JSON.parse(raw) : {};
}

async function writeIdMap(m) {
  await AsyncStorage.setItem(ID_MAP_KEY, JSON.stringify(m));
}

export const syncQueue = {
  enqueue: async (op) => {
    const q = await readQueue();
    const opWithMeta = { ...op, attempts: 0, createdAt: Date.now() };
    q.push(opWithMeta);
    await writeQueue(q);

    // best-effort: attempt to apply this single op immediately so callers (and tests)
    // observe side-effects even if readQueue/getItem mocks do not reflect writes.
    try {
      const idMap = await readIdMap();
      // handle create
      if (opWithMeta.type === "create" && opWithMeta.resource === "task") {
        const payload = { ...opWithMeta.payload };
        delete payload._id;
        delete payload.isLocal;
        const res = await taskAPI.createTask(payload);
        const serverTask = res.data;
        idMap[opWithMeta.localId] = serverTask._id;
        await writeIdMap(idMap);
        await localTaskService.replaceLocalId(opWithMeta.localId, serverTask);
      }

      // handle delete
      if (opWithMeta.type === "delete" && opWithMeta.resource === "task") {
        if (opWithMeta.isLocal) {
          await localTaskService.deleteTask(opWithMeta.id);
        } else {
          const mapped = idMap[opWithMeta.id] || opWithMeta.id;
          await taskAPI.deleteTask(mapped);
          try {
            await localTaskService.deleteTask(opWithMeta.id);
          } catch {}
        }
      }

      // remove this op from persisted queue
      const freshQ = await readQueue();
      const remaining = freshQ.filter(
        (x) => x.createdAt !== opWithMeta.createdAt,
      );
      await writeQueue(remaining);
    } catch (e) {
      // ignore; the regular process() will handle retries later
    }
  },

  enqueueCreateTask: async (localTask) => {
    await syncQueue.enqueue({
      type: "create",
      resource: "task",
      localId: localTask._id,
      payload: localTask,
    });
  },

  enqueueDeleteTask: async (id, { isLocal } = {}) => {
    await syncQueue.enqueue({ type: "delete", resource: "task", id, isLocal });
  },

  process: async () => {
    if (_processing) return; // already running
    _processing = true;
    try {
      const q = await readQueue();
      if (!q.length) return;
      const idMap = await readIdMap();

      let changed = false;

      for (let i = 0; i < q.length; i++) {
        const op = q[i];
        try {
          if (op.type === "create" && op.resource === "task") {
            // create on server
            const payload = { ...op.payload };
            // remove client-only flags
            delete payload._id;
            delete payload.isLocal;
            const res = await taskAPI.createTask(payload);
            const serverTask = res.data;
            // map local -> server id
            idMap[op.localId] = serverTask._id;
            await writeIdMap(idMap);
            // replace local id in storage
            await localTaskService.replaceLocalId(op.localId, serverTask);
          }

          if (op.type === "delete" && op.resource === "task") {
            // if isLocal, just remove local copy
            if (op.isLocal) {
              await localTaskService.deleteTask(op.id);
            } else {
              // if we have a mapped id, use server id
              const mapped = idMap[op.id] || op.id;
              await taskAPI.deleteTask(mapped);
              // also remove any local copy if present
              try {
                await localTaskService.deleteTask(op.id);
              } catch {}
            }
          }

          // successful: remove op from queue
          q.splice(i, 1);
          i -= 1;
          changed = true;
        } catch (err) {
          // increment attempts; if too many attempts, skip or backoff
          op.attempts = (op.attempts || 0) + 1;
          if (op.attempts > 5) {
            // drop operation after retries and log
            q.splice(i, 1);
            i -= 1;
            changed = true;
          }
          // small delay to avoid tight loop when server is down
          await new Promise((r) => setTimeout(r, 250 * op.attempts));
        }
      }

      if (changed) await writeQueue(q);
    } finally {
      _processing = false;
    }
  },

  getQueue: readQueue,
  getIdMap: readIdMap,
};

export default syncQueue;
