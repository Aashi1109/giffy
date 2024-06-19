import config from "@config";
import logger from "@logger";
import { ITask } from "@types";

const BASE_URL = config.jsonDBUrl + "tasks";
logger.info("URL for tasks: " + BASE_URL);

/**
 * Creates a new task.
 *
 * @param {ITask} data - The task data to be created.
 * @returns {Promise<ITask | null>} The created task data.
 * @throws {Error} If there is an error creating the task.
 */
export const createTask = async (data: ITask): Promise<ITask> => {
  try {
    const response = await fetch(BASE_URL, {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response.json();
  } catch (error) {
    logger.error(`Error creating task: ${error.message}`);
    throw error;
  }
};

/**
 * Retrieves a task by ID.
 *
 * @param {string} id - The ID of the task to retrieve.
 * @returns {Promise<ITask | null>} The retrieved task data.
 * @throws {Error} If there is an error retrieving the task.
 */
export const getTask = async (id: string): Promise<ITask | null> => {
  try {
    const response = await fetch(BASE_URL + `/${id}`);
    if (!response.ok) {
      return null;
    }
    return response.json();
  } catch (error) {
    logger.error(`Error getting task: ${error.message}`);
    throw error;
  }
};

/**
 * Updates an existing task.
 *
 * @param {string} id - The ID of the task to update.
 * @param {Partial<ITask>} updateData - The task data to be updated.
 * @returns {Promise<ITask | null>} The updated task data if exists.
 * @throws {Error} If there is an error updating the task.
 */
export const updateTask = async (
  id: string,
  updateData: Partial<ITask>
): Promise<ITask | null> => {
  try {
    const response = await fetch(BASE_URL + `/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updateData),
    });
    if (!response.ok) {
      return null;
    }
    return response.json();
  } catch (error) {
    logger.error(`Error updating task: ${error.message}`);
    throw error;
  }
};

/**
 * Deletes a task by ID.
 *
 * @param {string} id - The ID of the task to delete.
 * @returns {Promise<Object>} The deleted task data.
 * @throws {Error} If there is an error deleting the task.
 */
export const deleteTask = async (id: string): Promise<ITask | null> => {
  try {
    const response = await fetch(BASE_URL + `/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      return null;
    }
    return response.json();
  } catch (error) {
    logger.error(`Error deleting task: ${error.message}`);
    throw error;
  }
};
