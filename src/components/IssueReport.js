import React, { useState } from "react";

const IssueReport = () => {
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [issueDescription, setIssueDescription] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Issue reported:", issueDescription);
    setSubmitted(true);
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
            <textarea value={issueDescription} onChange={(e) => setIssueDescription(e.target.value)} placeholder="Describe the issue..." required />
            <button type="submit" className="report-issue-toggle">Submit Issue</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default IssueReport;