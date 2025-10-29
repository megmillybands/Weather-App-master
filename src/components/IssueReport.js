// src/components/IssueReport.js
import React, { useState } from "react";
import { saveRecord } from "./PostmanAPI";

/**
 * Writes simple issue reports to the class API so you can review later.
 * Saves: { type: 'issue', user, city, description, timestamp }
 */
const IssueReport = ({ user, city }) => {
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [issueDescription, setIssueDescription] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!issueDescription.trim()) return;
    setSending(true);
    setError("");

    try {
      await saveRecord({
        body: {
          type: "issue",
          user: user || "anonymous",
          city: city || "",
          description: issueDescription.trim(),
          timestamp: new Date().toISOString(),
        },
      });
      setSubmitted(true);
    } catch (err) {
      console.error("Issue submit failed:", err);
      setError("Failed to submit issue. Please try again.");
    } finally {
      setSending(false);
    }
  };

  if (submitted) {
    return (
      <div className="issue-report-box-container fade-in">
        <p>Thank you for your feedback! Your issue has been recorded.</p>
      </div>
    );
  }

  return (
    <div className="issue-report-section">
      <div
        className={`report-issue-toggle ${showForm ? "open" : ""}`}
        onClick={() => setShowForm(!showForm)}
      >
        {showForm ? "Close" : "Report an Issue"}
      </div>

      {showForm && (
        <div className="issue-report-box-container fade-in">
          <p>Describe the current conditions at your location to help improve forecasts.</p>
          <form onSubmit={handleSubmit}>
            <textarea
              value={issueDescription}
              onChange={(e) => setIssueDescription(e.target.value)}
              placeholder="Describe the issue..."
              required
            />
            <button type="submit" className="report-issue-toggle" disabled={sending}>
              {sending ? "Submitting..." : "Submit Issue"}
            </button>
            {error && <p className="error-text">{error}</p>}
          </form>
        </div>
      )}
    </div>
  );
};

export default IssueReport;