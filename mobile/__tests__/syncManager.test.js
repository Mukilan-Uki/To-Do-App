import { syncManager } from "../services/syncManager";
import { syncQueue } from "../services/syncQueue";
import { taskAPI } from "../services/apiService";
import { localTaskService } from "../services/localStorageService";

jest.mock("../services/syncQueue", () => ({
  syncQueue: { getIdMap: jest.fn(), process: jest.fn() },
}));
jest.mock("../services/apiService", () => ({
  taskAPI: { getTasks: jest.fn() },
}));
jest.mock("../services/localStorageService", () => ({
  localTaskService: { getTasks: jest.fn() },
}));

describe("syncManager merge behavior", () => {
  beforeEach(() => {
    syncQueue.getIdMap.mockReset();
    syncQueue.process.mockReset();
    taskAPI.getTasks.mockReset();
    localTaskService.getTasks.mockReset();
  });

  test("server collaborators override local when server newer", async () => {
    const local = [
      {
        _id: "local_1",
        title: "Task",
        collaborators: [{ _id: "u1", name: "Alice" }],
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T01:00:00.000Z",
      },
    ];

    const server = [
      {
        _id: "srv_1",
        title: "Task",
        collaborators: [{ _id: "u2", name: "Bob" }],
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T02:00:00.000Z",
        type: "task",
      },
    ];

    // id map maps local_1 -> srv_1
    syncQueue.getIdMap.mockResolvedValue({ local_1: "srv_1" });
    taskAPI.getTasks.mockResolvedValue({ data: server });
    localTaskService.getTasks.mockResolvedValue(local);

    const res = await syncManager.syncTasks();
    const all = res.allTasks;
    expect(all.find((t) => t._id === "srv_1").collaborators[0]._id).toBe("u2");
  });

  test("local newer wins and preserves local fields", async () => {
    const local = [
      {
        _id: "local_2",
        title: "Local edit",
        notes: "edited locally",
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-02T05:00:00.000Z",
      },
    ];

    const server = [
      {
        _id: "srv_2",
        title: "Old title",
        notes: "server note",
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-02T00:00:00.000Z",
      },
    ];

    syncQueue.getIdMap.mockResolvedValue({ local_2: "srv_2" });
    taskAPI.getTasks.mockResolvedValue({ data: server });
    localTaskService.getTasks.mockResolvedValue(local);

    const res = await syncManager.syncTasks();
    const merged = res.allTasks.find((t) => t._id === "srv_2");
    expect(merged.notes).toBe("edited locally");
    // ensure server id retained
    expect(merged._id).toBe("srv_2");
  });
});
