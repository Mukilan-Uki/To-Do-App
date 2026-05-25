import Routine from "../models/Routine.js";

const todayKey = () => new Date().toISOString().slice(0, 10);

export const getRoutine = async (req, res) => {
  try {
    let routine = await Routine.findOne({ owner: req.user._id });
    if (!routine) {
      routine = await Routine.create({
        owner: req.user._id,
        title: "My Daily Routine",
        items: [],
      });
    }
    res.json(routine);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateRoutine = async (req, res) => {
  try {
    const { title, items, isRecurring } = req.body;
    let routine = await Routine.findOne({ owner: req.user._id });
    if (!routine) {
      routine = new Routine({ owner: req.user._id });
    }
    if (title !== undefined) routine.title = title;
    if (isRecurring !== undefined) routine.isRecurring = isRecurring;
    if (items !== undefined) routine.items = items;
    await routine.save();
    res.json(routine);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const toggleItemComplete = async (req, res) => {
  try {
    const { itemId } = req.params;
    const routine = await Routine.findOne({ owner: req.user._id });
    if (!routine) return res.status(404).json({ message: "Routine not found" });

    const item = routine.items.id(itemId);
    if (!item) return res.status(404).json({ message: "Item not found" });

    const key = todayKey();
    const idx = item.completedDates.indexOf(key);
    if (idx >= 0) item.completedDates.splice(idx, 1);
    else item.completedDates.push(key);

    await routine.save();
    res.json(routine);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addRoutineItem = async (req, res) => {
  try {
    const routine = await Routine.findOne({ owner: req.user._id });
    if (!routine) {
      const created = await Routine.create({
        owner: req.user._id,
        items: [req.body],
      });
      return res.status(201).json(created);
    }
    routine.items.push(req.body);
    await routine.save();
    res.status(201).json(routine);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteRoutineItem = async (req, res) => {
  try {
    const routine = await Routine.findOne({ owner: req.user._id });
    if (!routine) return res.status(404).json({ message: "Routine not found" });
    routine.items.pull(req.params.itemId);
    await routine.save();
    res.json(routine);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
