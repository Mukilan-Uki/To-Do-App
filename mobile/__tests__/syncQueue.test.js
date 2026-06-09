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
const { localTaskService } = require("../services/localStorageService");
const { taskAPI } = require("../services/apiService");

describe("syncQueue create/delete flows", () => {
  beforeEach(async () => {
    AsyncStorage.getItem.mockReset();
    AsyncStorage.setItem.mockReset();
    // fresh queue
    AsyncStorage.getItem.mockImplementation(async (key) => {
      if (key === "@sync_queue") return JSON.stringify([]);
      if (key === "@id_map") return JSON.stringify({});
      if (key === "@personal_tasks") return JSON.stringify([]);
      return null;
    });
    AsyncStorage.setItem.mockImplementation(async () => {});
  });

  test("enqueue create and process maps id and replaces local", async () => {
    // prepare a local task
    const local = { _id: "local_1", title: "Local Task", isLocal: true };
    // emulate creating local task stored
    AsyncStorage.getItem.mockImplementationOnce(async (k) => {
      if (k === "@personal_tasks") return JSON.stringify([local]);
      return JSON.stringify([]);
    });

    // mock API createTask response
    taskAPI.createTask.mockResolvedValueOnce({
      data: { _id: "srv_1", title: "Local Task" },
    });

    // spy on replaceLocalId to ensure we merged the server task into local store
    const replaceSpy = jest.spyOn(localTaskService, "replaceLocalId");

    // enqueue create and wait for processing
    await syncQueue.enqueueCreateTask(local);

    expect(taskAPI.createTask).toHaveBeenCalled();
    expect(replaceSpy).toHaveBeenCalledWith("local_1", {
      _id: "srv_1",
      title: "Local Task",
    });
    replaceSpy.mockRestore();
  });

  test("enqueue delete for server id calls API.deleteTask", async () => {
    // ensure getItem returns queue with one delete op
    AsyncStorage.getItem.mockImplementation(async (k) => {
      if (k === "@sync_queue")
        return JSON.stringify([
          { type: "delete", resource: "task", id: "srv_del", isLocal: false },
        ]);
      if (k === "@id_map") return JSON.stringify({});
      if (k === "@personal_tasks") return JSON.stringify([]);
      return null;
    });
    taskAPI.deleteTask.mockResolvedValueOnce({
      data: { message: "Task removed" },
    });

    await syncQueue.process();

    expect(taskAPI.deleteTask).toHaveBeenCalledWith("srv_del");
  });
});
