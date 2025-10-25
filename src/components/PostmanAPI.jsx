import React, { useState } from "react";
import axios from "axios";
import "../App.css";

function PostmanAPI() {
  const [postmanData, setPostmanData] = useState(null);
  const [loading, setLoading] = useState(false);

  const baseUrl = "https://unit-4-project-app-24d5eea30b23.herokuapp.com";
  const teamId = 3;

  // GET ALL RECORDS
  const getAllRecords = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${baseUrl}/get/all?teamId=${teamId}`);
      setPostmanData(res.data);
    } catch (err) {
      console.error("Error fetching all records:", err);
    } finally {
      setLoading(false);
    }
  };

  // GET INDIVIDUAL RECORD
  const getRecord = async (id) => {
    try {
      const res = await axios.get(`${baseUrl}/get/${id}?teamId=${teamId}`);
      console.log("Individual Record:", res.data);
      alert("Fetched record — check console for details!");
    } catch (err) {
      console.error("Error fetching record:", err);
    }
  };

  // CREATE NEW RECORD
  const createRecord = async () => {
    const newData = {
      name: "New City Entry",
      temperature: 25,
      condition: "Sunny",
    };
    try {
      const res = await axios.post(`${baseUrl}/create?teamId=${teamId}`, newData);
      console.log("Record Created:", res.data);
      alert("Record created successfully!");
    } catch (err) {
      console.error("Error creating record:", err);
    }
  };

  // UPDATE RECORD
  const updateRecord = async (id) => {
    const updatedData = {
      name: "Updated City Entry",
      temperature: 28,
      condition: "Partly Cloudy",
    };
    try {
      const res = await axios.put(`${baseUrl}/update/${id}?teamId=${teamId}`, updatedData);
      console.log("Record Updated:", res.data);
      alert("Record updated successfully!");
    } catch (err) {
      console.error("Error updating record:", err);
    }
  };

  // DELETE RECORD
  const deleteRecord = async (id) => {
    try {
      const res = await axios.delete(`${baseUrl}/delete/${id}?teamId=${teamId}`);
      console.log("Record Deleted:", res.data);
      alert("Record deleted successfully!");
    } catch (err) {
      console.error("Error deleting record:", err);
    }
  };

  return (
    <div className="postman-section fade-in">
      <h3>Postman API Integration</h3>

      <div className="api-controls">
        <button onClick={getAllRecords}>Get All Records</button>
        <button onClick={() => getRecord(1)}>Get Record #1</button>
        <button onClick={createRecord}>Create Record</button>
        <button onClick={() => updateRecord(1)}>Update Record #1</button>
        <button onClick={() => deleteRecord(1)}>Delete Record #1</button>
      </div>

      {loading && <p>Loading Postman API data...</p>}

      {postmanData && (
        <div className="postman-data">
          <h4>Response Data:</h4>
          <pre>{JSON.stringify(postmanData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default PostmanAPI;