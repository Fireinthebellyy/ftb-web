"use client";

import React from "react";
import CommentSection from "./CommentSection";

const CommentTest: React.FC = () => {
  // This is a test opportunity ID - replace with a real one from your database
  const testOpportunityId = "test-opportunity-id";

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Comment Section Test</h1>
      <div className="bg-white border rounded-lg shadow-sm">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Test Opportunity</h2>
          <p className="text-gray-600">This is a test opportunity to verify comment functionality.</p>
        </div>
        <CommentSection opportunityId={testOpportunityId} />
      </div>
    </div>
  );
};

export default CommentTest;
