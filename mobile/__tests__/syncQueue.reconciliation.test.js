import AsyncStorage from "@react-native-async-storage/async-storage";

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

// mock taskAPI
jest.mock("../services/apiService", () => ({
  taskAPI: {
    createTask: jest.fn(),
    deleteTask: jest.fn(),
    getTasks: jest.fn(),
  },
}));

const { syncQueue } = require("../services/syncQueue");
const { taskAPI } = require("../services/apiService");

describe("syncQueue reconciliation scenarios", () => {
  beforeEach(() => {
    AsyncStorage.getItem.mockReset();
    AsyncStorage.setItem.mockReset();
    AsyncStorage.getItem.mockImplementation(async (key) => {
      if (key === "@sync_queue") return JSON.stringify([]);
      if (key === "@id_map") return JSON.stringify({});
      if (key === "@personal_tasks") return JSON.stringify([]);
      return null;
    });
    AsyncStorage.setItem.mockImplementation(async () => {});
    taskAPI.createTask.mockReset();
    taskAPI.deleteTask.mockReset();
  });

  test("create then delete (same local id) leads to server delete", async () => {
    const local = { _id: "local_42", title: "Transient", isLocal: true };

    // queue contains a create op followed by a delete op for same local id
    const q = [
      { type: "create", resource: "task", localId: "local_42", payload: local },
      { type: "delete", resource: "task", id: "local_42", isLocal: false },
    ];

    AsyncStorage.getItem.mockImplementation(async (k) => {
      if (k === "@sync_queue") return JSON.stringify(q);
      if (k === "@id_map") return JSON.stringify({});
      if (k === "@personal_tasks") return JSON.stringify([local]);
      return null;
    });

    taskAPI.createTask.mockResolvedValueOnce({
      data: { _id: "srv_42", title: "Transient" },
    });
    taskAPI.deleteTask.mockResolvedValueOnce({ data: { message: "deleted" } });

    await syncQueue.process();

    // create should have been called, then delete should be called with server id
    expect(taskAPI.createTask).toHaveBeenCalled();
    expect(taskAPI.deleteTask).toHaveBeenCalledWith("srv_42");
  });

  test("delete referencing id_map uses mapped id when available", async () => {
    const q = [
      { type: "delete", resource: "task", id: "local_9", isLocal: false },
    ];
    AsyncStorage.getItem.mockImplementation(async (k) => {
      if (k === "@sync_queue") return JSON.stringify(q);
      if (k === "@id_map") return JSON.stringify({ local_9: "srv_9" });
      if (k === "@personal_tasks") return JSON.stringify([]);
      return null;
    });
    taskAPI.deleteTask.mockResolvedValueOnce({ data: { message: "removed" } });

    await syncQueue.process();

    expect(taskAPI.deleteTask).toHaveBeenCalledWith("srv_9");
  });
});
