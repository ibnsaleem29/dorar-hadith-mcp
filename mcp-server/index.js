#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";
import { z } from "zod";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Configuration
const DEFAULT_BASE_URL = "http://localhost:5000/v1";
const BASE_URL = process.env.DORAR_API_BASE_URL || DEFAULT_BASE_URL;

// Grading glossary — fixed-vocabulary hadith grading terms, loaded once at startup.
// Only for recurring grading labels (e.g. "صحيح", "ضعيف"), not the free-text
// explainGrade sentences — those stay raw Arabic.
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const gradingGlossary = JSON.parse(
  readFileSync(join(__dirname, "gradingGlossary.json"), "utf-8")
);

// Extracts the leading term of a grade string, splitting on the first comma
// (ASCII or Arabic) or whitespace, and looks it up as an exact key in the
// grading glossary. Returns the English term, or null if there's no exact match
// (never fuzzy-matches).
function lookupGradeEnglish(grade) {
  if (!grade) return null;
  const splitIndex = grade.search(/[,،\s]/);
  const leadingTerm = (splitIndex === -1 ? grade : grade.slice(0, splitIndex)).trim();
  return gradingGlossary[leadingTerm]?.en ?? null;
}

// Create axios instance with base configuration
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Validation schemas
const HadithSearchSchema = z.object({
  value: z.string().min(1).describe("Search query for hadith text"),
  page: z.number().int().positive().optional().describe("Page number for pagination"),
  removehtml: z.boolean().optional().describe("Remove HTML tags from results"),
  specialist: z.boolean().optional().describe("Include specialist hadiths"),
  xclude: z.string().optional().describe("Words or phrases to exclude from search"),
  st: z.enum(['w', 'a', 'p']).optional().describe("Search type (w=all words, a=any word, p=exact phrase)"),
  t: z.enum(['*', '0', '1', '2', '3']).optional().describe("Search scope"),
  degree: z.array(z.string()).optional().describe("Hadith degree filters"),
  muhadith: z.array(z.string()).optional().describe("Muhadith (narrator) IDs"),
  books: z.array(z.string()).optional().describe("Book IDs"),
  rawi: z.array(z.string()).optional().describe("Rawi (transmitter) IDs"),
});

const HadithIdSchema = z.object({
  id: z.string().min(1).describe("Hadith ID"),
});

const HadithGradingConsensusSchema = z.object({
  query: z.string().min(1).describe("Search query for hadith text (matn)"),
  max_results: z.number().int().positive().default(15).describe("Maximum number of search results to analyze (default 15)"),
});

const SharhSearchSchema = z.object({
  value: z.string().min(1).describe("Search query for sharh text"),
  page: z.number().int().positive().optional().describe("Page number for pagination"),
});

const SharhIdSchema = z.object({
  id: z.string().min(1).describe("Sharh ID"),
});

const SharhTextSchema = z.object({
  text: z.string().min(1).describe("Text to search for sharh explanation"),
});

const BookIdSchema = z.object({
  id: z.string().min(1).describe("Book ID"),
});

const MohdithIdSchema = z.object({
  id: z.string().min(1).describe("Mohdith (narrator) ID"),
});

// Helper function to build query parameters
function buildQueryParams(params) {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        // Handle array parameters like d[], m[], s[], rawi[]
        value.forEach(item => {
          queryParams.append(`${key}[]`, item);
        });
      } else {
        queryParams.append(key, value.toString());
      }
    }
  });
  
  return queryParams.toString();
}

// API call helpers
async function makeApiCall(endpoint, params = {}) {
  try {
    const queryString = buildQueryParams(params);
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(`API Error (${error.response.status}): ${error.response.data?.message || error.response.statusText}`);
    } else if (error.request) {
      throw new Error(`Network Error: Unable to connect to API at ${BASE_URL}`);
    } else {
      throw new Error(`Request Error: ${error.message}`);
    }
  }
}

// Tool definitions
const TOOLS = [
  {
    name: "search_hadith_api",
    description: "Search for hadiths using the Dorar.net API endpoint. This provides comprehensive hadith search with various filters.",
    inputSchema: {
      type: "object",
      properties: {
        value: { type: "string", description: "Search query for hadith text" },
        page: { type: "number", description: "Page number for pagination" },
        removehtml: { type: "boolean", description: "Remove HTML tags from results" },
        specialist: { type: "boolean", description: "Include specialist hadiths" },
        xclude: { type: "string", description: "Words or phrases to exclude from search" },
        st: { type: "string", enum: ["w", "a", "p"], description: "Search type (w=all words, a=any word, p=exact phrase)" },
        t: { type: "string", enum: ["*", "0", "1", "2", "3"], description: "Search scope" },
        degree: { type: "array", items: { type: "string" }, description: "Hadith degree filters" },
        muhadith: { type: "array", items: { type: "string" }, description: "Muhadith (narrator) IDs" },
        books: { type: "array", items: { type: "string" }, description: "Book IDs" },
        rawi: { type: "array", items: { type: "string" }, description: "Rawi (transmitter) IDs" },
      },
      required: ["value"],
    },
  },
  {
    name: "search_hadith_site",
    description: "Search for hadiths using the site data endpoint. Similar to API search but using different data source.",
    inputSchema: {
      type: "object", 
      properties: {
        value: { type: "string", description: "Search query for hadith text" },
        page: { type: "number", description: "Page number for pagination" },
        removehtml: { type: "boolean", description: "Remove HTML tags from results" },
        specialist: { type: "boolean", description: "Include specialist hadiths" },
        xclude: { type: "string", description: "Words or phrases to exclude from search" },
        st: { type: "string", enum: ["w", "a", "p"], description: "Search type (w=all words, a=any word, p=exact phrase)" },
        t: { type: "string", enum: ["*", "0", "1", "2", "3"], description: "Search scope" },
        degree: { type: "array", items: { type: "string" }, description: "Hadith degree filters" },
        muhadith: { type: "array", items: { type: "string" }, description: "Muhadith (narrator) IDs" },
        books: { type: "array", items: { type: "string" }, description: "Book IDs" },
        rawi: { type: "array", items: { type: "string" }, description: "Rawi (transmitter) IDs" },
      },
      required: ["value"],
    },
  },
  {
    name: "get_hadith_by_id",
    description: "Get a specific hadith by its ID.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Hadith ID" },
      },
      required: ["id"],
    },
  },
  {
    name: "get_similar_hadiths",
    description: "Get similar hadiths for a given hadith ID.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Hadith ID" },
      },
      required: ["id"],
    },
  },
  {
    name: "get_alternate_hadith",
    description: "Get alternate sahih hadith for a given hadith ID.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Hadith ID" },
      },
      required: ["id"],
    },
  },
  {
    name: "get_usul_hadith",
    description: "Get the original/root hadith for a given hadith ID.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Hadith ID" },
      },
      required: ["id"],
    },
  },
  {
    name: "get_hadith_sources",
    description: "Get the original/root sources (usul) for a given hadith ID. Same data as get_usul_hadith, provided under a sources-focused name.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Hadith ID" },
      },
      required: ["id"],
    },
  },
  {
    name: "get_hadith_grading",
    description: "Get a focused grading summary (hadith text, grade, explainGrade, hadithId) for a given hadith ID. Also attaches gradeEnglish, resolved by looking up the grade string's leading term against the fixed hadith-grading glossary; gradeEnglish is null when there's no exact match (never guessed).",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Hadith ID" },
      },
      required: ["id"],
    },
  },
  {
    name: "get_hadith_commentary",
    description: "Get the sharh (commentary/explanation) for a given hadith ID by resolving its sharhMetadata and fetching the full commentary. Returns { hasCommentary: false } if the hadith has no commentary.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Hadith ID" },
      },
      required: ["id"],
    },
  },
  {
    name: "get_hadith_grading_consensus",
    description: "Search for a hadith phrase (specialist search, all-words match) and return each matching result from dorar.net's site search, faithfully, in dorar's own order. Each entry carries every relevant field (hadith, rawi, mohdith, book, numberOrPage, grade, explainGrade, takhrij, categories, hadithId, hasSimilarHadith, hasAlternateHadithSahih, hasUsulHadith, hasSharhMetadata) plus gradeEnglish resolved via the grading glossary (exact leading-term match only; null if no match). totalResults is the count dorar returned before any max_results slicing; returnedResults is how many are actually included. This tool performs no grouping, bucketing, or consensus/corroboration computation of any kind — it is pure retrieval and translation. Any observation about results relating to each other belongs in conversation, from reading the entries.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query for hadith text (matn)" },
        max_results: { type: "number", description: "Maximum number of results to analyze (default 15)" },
      },
      required: ["query"],
    },
  },
  {
    name: "search_sharh",
    description: "Search for sharh (explanations) of hadiths.",
    inputSchema: {
      type: "object",
      properties: {
        value: { type: "string", description: "Search query for sharh text" },
        page: { type: "number", description: "Page number for pagination" },
      },
      required: ["value"],
    },
  },
  {
    name: "get_sharh_by_id",
    description: "Get sharh (explanation) for a hadith by ID.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Sharh ID" },
      },
      required: ["id"],
    },
  },
  {
    name: "get_sharh_by_text",
    description: "Get sharh (explanation) for a hadith by searching for specific text.",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string", description: "Text to search for sharh explanation" },
      },
      required: ["text"],
    },
  },
  {
    name: "get_mohdith_info",
    description: "Get information about a muhadith (hadith narrator) by ID.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Mohdith (narrator) ID" },
      },
      required: ["id"],
    },
  },
  {
    name: "get_book_info",
    description: "Get information about a hadith book by ID.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Book ID" },
      },
      required: ["id"],
    },
  },
  {
    name: "get_books_data",
    description: "Get list of all available hadith books with their IDs and names.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_degrees_data",
    description: "Get list of all hadith degrees (authenticity levels) with their IDs and names.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_method_search_data",
    description: "Get method search data for hadith filtering.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_mohdith_data",
    description: "Get list of all muhaddithun (hadith narrators) with their IDs and names.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_rawi_data",
    description: "Get list of all rawi (hadith transmitters) with their IDs and names.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_zone_search_data",
    description: "Get zone search data for geographic hadith filtering.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
];

// Create MCP server
const server = new Server(
  {
    name: "dorar-hadith-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: TOOLS,
  };
});

// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "search_hadith_api": {
        const params = HadithSearchSchema.parse(args);
        // Map parameter names to match API expectations
        const apiParams = {
          value: params.value,
          page: params.page,
          removehtml: params.removehtml,
          specialist: params.specialist,
          xclude: params.xclude,
          st: params.st,
          t: params.t,
          d: params.degree,
          m: params.muhadith,
          s: params.books,
          rawi: params.rawi,
        };
        const result = await makeApiCall("/api/hadith/search", apiParams);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "search_hadith_site": {
        const params = HadithSearchSchema.parse(args);
        const apiParams = {
          value: params.value,
          page: params.page,
          removehtml: params.removehtml,
          specialist: params.specialist,
          xclude: params.xclude,
          st: params.st,
          t: params.t,
          d: params.degree,
          m: params.muhadith,
          s: params.books,
          rawi: params.rawi,
        };
        const result = await makeApiCall("/site/hadith/search", apiParams);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "get_hadith_by_id": {
        const { id } = HadithIdSchema.parse(args);
        const result = await makeApiCall(`/site/hadith/${id}`);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "get_similar_hadiths": {
        const { id } = HadithIdSchema.parse(args);
        const result = await makeApiCall(`/site/hadith/similar/${id}`);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "get_alternate_hadith": {
        const { id } = HadithIdSchema.parse(args);
        const result = await makeApiCall(`/site/hadith/alternate/${id}`);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "get_usul_hadith": {
        const { id } = HadithIdSchema.parse(args);
        const result = await makeApiCall(`/site/hadith/usul/${id}`);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "get_hadith_sources": {
        const { id } = HadithIdSchema.parse(args);
        const result = await makeApiCall(`/site/hadith/usul/${id}`);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "get_hadith_grading": {
        const { id } = HadithIdSchema.parse(args);
        const result = await makeApiCall(`/site/hadith/${id}`);
        const hadithData = result.data ?? {};
        const projected = {
          hadith: hadithData.hadith,
          grade: hadithData.grade,
          explainGrade: hadithData.explainGrade,
          hadithId: hadithData.hadithId,
          gradeEnglish: lookupGradeEnglish(hadithData.grade),
        };
        return { content: [{ type: "text", text: JSON.stringify(projected, null, 2) }] };
      }

      case "get_hadith_commentary": {
        const { id } = HadithIdSchema.parse(args);
        const hadithResult = await makeApiCall(`/site/hadith/${id}`);
        const sharhId = hadithResult.data?.sharhMetadata?.id;
        if (!sharhId) {
          return { content: [{ type: "text", text: JSON.stringify({ hasCommentary: false }, null, 2) }] };
        }
        const sharhResult = await makeApiCall(`/site/sharh/${sharhId}`);
        const commentary = { hasCommentary: true, ...sharhResult.data };
        return { content: [{ type: "text", text: JSON.stringify(commentary, null, 2) }] };
      }

      case "get_hadith_grading_consensus": {
        const { query, max_results } = HadithGradingConsensusSchema.parse(args);
        const result = await makeApiCall("/site/hadith/search", {
          value: query,
          specialist: true,
          st: "w",
        });
        const allResults = result.data ?? [];
        const rawResults = allResults.slice(0, max_results);

        const entries = rawResults.map((h) => ({
          hadith: h.hadith,
          rawi: h.rawi,
          mohdith: h.mohdith,
          book: h.book,
          numberOrPage: h.numberOrPage,
          grade: h.grade,
          explainGrade: h.explainGrade,
          takhrij: h.takhrij,
          categories: h.categories,
          hadithId: h.hadithId,
          hasSimilarHadith: h.hasSimilarHadith,
          hasAlternateHadithSahih: h.hasAlternateHadithSahih,
          hasUsulHadith: h.hasUsulHadith,
          hasSharhMetadata: h.hasSharhMetadata,
          gradeEnglish: lookupGradeEnglish(h.grade),
        }));

        const summary = {
          totalResults: allResults.length,
          returnedResults: entries.length,
          entries,
        };
        return { content: [{ type: "text", text: JSON.stringify(summary, null, 2) }] };
      }

      case "search_sharh": {
        const params = SharhSearchSchema.parse(args);
        const result = await makeApiCall("/site/sharh/search", params);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "get_sharh_by_id": {
        const { id } = SharhIdSchema.parse(args);
        const result = await makeApiCall(`/site/sharh/${id}`);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "get_sharh_by_text": {
        const { text } = SharhTextSchema.parse(args);
        const result = await makeApiCall(`/site/sharh/text/${encodeURIComponent(text)}`);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "get_mohdith_info": {
        const { id } = MohdithIdSchema.parse(args);
        const result = await makeApiCall(`/site/mohdith/${id}`);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "get_book_info": {
        const { id } = BookIdSchema.parse(args);
        const result = await makeApiCall(`/site/book/${id}`);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "get_books_data": {
        const result = await makeApiCall("/data/book");
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "get_degrees_data": {
        const result = await makeApiCall("/data/degree");
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "get_method_search_data": {
        const result = await makeApiCall("/data/methodSearch");
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "get_mohdith_data": {
        const result = await makeApiCall("/data/mohdith");
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "get_rawi_data": {
        const result = await makeApiCall("/data/rawi");
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "get_zone_search_data": {
        const result = await makeApiCall("/data/zoneSearch");
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid arguments: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
    }
    throw error;
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Dorar Hadith MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});