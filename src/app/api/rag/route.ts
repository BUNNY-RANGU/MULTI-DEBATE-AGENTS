// ============================================================
// RAG API ENDPOINT — Retrieval-Augmented Generation query route
// POST /api/rag
// Searches the in-memory vector store for relevant legal knowledge.
// ============================================================

import { NextRequest } from "next/server";
import { knowledgeBase } from "@/lib/rag/vector-store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, topK, category, mode } = body as {
      query?: string;
      topK?: number;
      category?: string;
      mode?: "search" | "context";
    };

    // Validate query
    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "A non-empty 'query' string is required." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const k = typeof topK === "number" && topK > 0 ? Math.min(topK, 20) : 5;
    const trimmedQuery = query.trim();

    // Mode: "context" returns a ready-to-inject string for prompts
    if (mode === "context") {
      const maxTokens =
        typeof body.maxTokens === "number" && body.maxTokens > 0
          ? Math.min(body.maxTokens, 8000)
          : 2000;
      const contextString = knowledgeBase.getContext(trimmedQuery, maxTokens);

      return new Response(
        JSON.stringify({
          context: contextString,
          documentCount: knowledgeBase.getDocumentCount(),
          categories: knowledgeBase.getAllCategories(),
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Mode: "search" (default) — return individual results
    let results;
    if (category && typeof category === "string") {
      results = knowledgeBase.searchByCategory(trimmedQuery, category, k);
    } else {
      results = knowledgeBase.search(trimmedQuery, k);
    }

    return new Response(
      JSON.stringify({
        results: results.map(({ document, score }) => ({
          id: document.id,
          content: document.content,
          score: Math.round(score * 10000) / 10000, // 4 decimal places
          metadata: document.metadata,
        })),
        totalAvailable: knowledgeBase.getDocumentCount(),
        categories: knowledgeBase.getAllCategories(),
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[RAG API] Error processing query:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process RAG query." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// GET /api/rag — return metadata about the knowledge base
export async function GET() {
  return new Response(
    JSON.stringify({
      documentCount: knowledgeBase.getDocumentCount(),
      categories: knowledgeBase.getAllCategories(),
      description:
        "In-memory RAG vector store for Indian legal knowledge, AI/tech law, and debate strategy.",
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}