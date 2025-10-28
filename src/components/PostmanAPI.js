// src/components/PostmanAPI.js
import axios from "axios";

const BASE_URL = "https://unit-4-project-app-24d5eea30b23.herokuapp.com";
const TEAM = 3;

/**
 * Get ALL saved records for your team.
 * Assumes backend supports GET /post/data?team=3
 * (If backend ignores the query param it will still return all, we filter in UI.)
 */
export const getAllRecords = async () => {
  const res = await axios.get(`${BASE_URL}/post/data`, {
    params: { team: TEAM },
  });
  // Expecting array like: [{ id, body: { name, temperature, weather, wind, AQI, favorite } }, ...]
  return Array.isArray(res.data) ? res.data : [];
};

/**
 * Create a new record
 */
export const createRecord = async (body) => {
  // body is the inner "body" object (name, temperature, weather, wind, AQI, favorite)
  const res = await axios.post(`${BASE_URL}/post/data`, {
    team: TEAM,
    body,
  });
  return res.data;
};

/**
 * Update an existing record by id
 */
export const updateRecord = async (id, body) => {
  const res = await axios.put(`${BASE_URL}/post/data/${id}`, {
    team: TEAM,
    body,
  });
  return res.data;
};

/**
 * Save (create or update) a city record. If id exists -> PUT, else POST.
 */
export const saveFavoriteCity = async ({ id, body }) => {
  if (id) {
    return updateRecord(id, body);
  }
  return createRecord(body);
};

/**
 * Delete record by id
 */
export const deleteRecordById = async (id) => {
  await axios.delete(`${BASE_URL}/post/data/${id}`);
};