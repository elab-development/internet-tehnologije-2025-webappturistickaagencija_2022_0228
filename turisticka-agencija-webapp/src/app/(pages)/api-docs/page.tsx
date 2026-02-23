"use client";

import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

export default function ApiDocsPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <SwaggerUI url="/api/docs" />
    </div>
  );
}