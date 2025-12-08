// 1. REMOVE the "xhr" import. It breaks Deno's native fetch.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { url } = body;

    if (!url || typeof url !== "string") {
      return new Response(JSON.stringify({ error: "URL is required in the request body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Fetching job description from URL:", url);

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch target URL. Status: ${response.status}`);
    }

    const html = await response.text();
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    // 2. USE YOUR CORRECT MODEL ID
    // Since it's Dec 2025, 'gemini-2.5-flash' is the correct stable ID.
    const MODEL_ID = "gemini-2.5-flash";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:generateContent?key=${GEMINI_API_KEY}`;

    console.log(`Calling Gemini API: ${MODEL_ID}`);

    const aiResponse = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `You are a job description extractor. Extract the complete job description from the provided HTML content.
            
Extract and return ONLY the job posting content including:
- Job title
- Company name
- Location
- Job description/summary
- Responsibilities
- Requirements/Qualifications
- Skills needed

Format the output as clean, readable text.
If you cannot find a job description, return "No job description found".

HTML Content:
${html.slice(0, 40000)}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 2048,
        },
      }),
    });

    // 3. CAPTURE THE REAL ERROR
    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("Gemini API Error Detail:", errorText);
      // This will show you if your API key specifically doesn't have access to 2.5
      throw new Error(`Gemini API Error: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const jobDescription = aiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!jobDescription) {
      return new Response(JSON.stringify({ error: "Gemini returned no content." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ jobDescription }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in edge function:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
