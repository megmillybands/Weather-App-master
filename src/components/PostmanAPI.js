// src/components/PostmanAPI.js
import axios from "axios";

const BASE_URL = "https://unit-4-project-app-24d5eea30b23.herokuapp.com";
const TEAM = 3;

/**
 * The backend in class has a few styles. To be robust:
 * - Read:  GET /get/all?teamId=3  -> { response: [...] }
 * - Create: POST /post/data       -> { id, body, ... }
 * - Update: PUT  /post/data/:id   -> { id, body, ... }
 * - Delete: DELETE /post/data/:id -> 204 or { ok: true }
 */

export const getAllRecords = async () => {
  const res = await axios.get(`${BASE_URL}/get/all`, {
    params: { teamId: TEAM },
  });
  const payload = res?.data?.response ?? res?.data ?? [];
  return Array.isArray(payload) ? payload : [];
};

export const createRecord = async (body) => {
  const res = await axios.post(`${BASE_URL}/post/data`, {
    team: TEAM,
    body,
  });
  return res?.data;
};

export const updateRecord = async (id, body) => {
  const res = await axios.put(`${BASE_URL}/post/data/${id}`, {
    team: TEAM,
    body,
  });
  return res?.data;
};

export const saveRecord = async ({ id, body }) => {
  return id ? updateRecord(id, body) : createRecord(body);
};

export const deleteRecordById = async (id) => {
  await axios.delete(`${BASE_URL}/post/data/${id}`);
};

export async function getWeatherByCoords(lat, lon) {
  try {
    const res = await fetch(
      `${BASE_URL}/weather/${TEAM}?lat=${lat}&lon=${lon}`
    );
    if (!res.ok) throw new Error("Unable to fetch weather for your location");
    return res.json();
  } catch (err) {
    console.error(err);
    return null;
  }
}
