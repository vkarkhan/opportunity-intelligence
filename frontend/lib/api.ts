export type Analysis = {
  opportunity_title: string;
  opportunity_type: "job" | "consulting" | "hackathon" | "other";
  summary: string;
  requirements: {
    description: string;
    category: "technical" | "delivery" | "general";
    priority: "required" | "preferred" | "unspecified";
  }[];
  constraints: string[];
  assumptions: string[];
  missing_information: string[];
  clarification_questions: string[];
  risks: { description: string; severity: "low" | "medium" | "high" }[];
  recommended_next_actions: string[];
  analyzer: "deterministic-local-v1";
};

export async function analyzeOpportunity(text: string): Promise<Analysis> {
  const base = (
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"
  ).replace(/\/$/, "");
  let response: Response;
  try {
    response = await fetch(`${base}/api/v1/opportunities/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new Error(
      "Could not reach the analysis service. Check that the backend is running on port 8000, then try again.",
    );
  }
  if (response.status === 422)
    throw new Error(
      "Enter 30–20,000 characters with at least five words and 20 letters.",
    );
  if (!response.ok)
    throw new Error(
      "The analysis service returned an error. Your brief is still here; please try again.",
    );
  return response.json() as Promise<Analysis>;
}
