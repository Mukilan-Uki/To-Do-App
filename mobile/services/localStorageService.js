import AsyncStorage from "@react-native-async-storage/async-storage";

const TASKS_KEY = "@personal_tasks";

export const localTaskService = {
  getTasks: async () => {
    try {
      const jsonValue = await AsyncStorage.getItem(TASKS_KEY);
      return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (e) {
      console.error("Error fetching local tasks", e);
      return [];
    }
  },

  createTask: async (task) => {
    try {
      const tasks = await localTaskService.getTasks();
      const newTask = {
        ...task,
        _id: "local_" + Date.now().toString(),
        isLocal: true,
        createdAt: new Date().toISOString(),
      };
      tasks.push(newTask);
      await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
      return newTask;
    } catch (e) {
      console.error("Error creating local task", e);
      throw e;
    }
  },

  updateTask: async (id, updatedFields) => {
    try {
      const tasks = await localTaskService.getTasks();
      const taskIndex = tasks.findIndex((t) => t._id === id);
      if (taskIndex > -1) {
        tasks[taskIndex] = {
          ...tasks[taskIndex],
          ...updatedFields,
          updatedAt: new Date().toISOString(),
        };
        await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
        return tasks[taskIndex];
      }
      throw new Error("Task not found");
    } catch (e) {
      console.error("Error updating local task", e);
      throw e;
    }
  },

  deleteTask: async (id) => {
    try {
      const tasks = await localTaskService.getTasks();
      const filteredTasks = tasks.filter((t) => t._id !== id);
      await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(filteredTasks));
      return true;
    } catch (e) {
      console.error("Error deleting local task", e);
      throw e;
    }
  },
  // Replace a locally created task id with a server-provided task
  replaceLocalId: async (localId, serverTask) => {
    try {
      const tasks = await localTaskService.getTasks();
      const idx = tasks.findIndex((t) => t._id === localId);
      if (idx > -1) {
        // merge serverTask fields and keep local timestamps
        const merged = { ...serverTask, updatedAt: new Date().toISOString() };
        tasks[idx] = merged;
        await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
        return merged;
      }
      // if not found locally, append serverTask
      tasks.push(serverTask);
      await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
      return serverTask;
    } catch (e) {
      console.error("Error replacing local id", e);
      throw e;
    }
  },
};
