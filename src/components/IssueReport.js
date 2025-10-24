import React, { useState } from "react";

const IssueReport = () => {
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
        <h3>Report an Issue</h3>
        <p>Thank you for your feedback! Your issue has been recorded.</p>
      </div>
    );
  }

  return (
    <div className="issue-report-box-container fade-in">
      <h3>Report an Issue</h3>
    <p> You can describe the current conditions at your location to help improve forecasts.</p>
      <form onSubmit={handleSubmit}>
        <textarea value={issueDescription} onChange={(e) => setIssueDescription(e.target.value)} placeholder="Describe the issue..." required />
        <button type="submit">Submit Issue</button>
      </form>
    </div>
  );
};

export default IssueReport;