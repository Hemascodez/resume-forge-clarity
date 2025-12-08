import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    
    if (!url || typeof url !== 'string') {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching job description from URL:', url);

    // Fetch the webpage content
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`);
    }

    const html = await response.text();
    console.log('Fetched HTML length:', html.length);

    // Check for common login/block indicators
    const lowerHtml = html.toLowerCase();
    const isBlocked = lowerHtml.includes('sign in') && lowerHtml.includes('linkedin') && !lowerHtml.includes('job-description');
    
    if (isBlocked) {
      console.log('Detected login wall or blocked content');
      return new Response(
        JSON.stringify({ error: 'This job posting requires login to view. Please paste the job description text directly instead of using the URL.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    // Use Gemini AI to extract job description from HTML
    const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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
- Any other relevant job details

Format the output as clean, readable text (not HTML). Remove any navigation, ads, or unrelated content.
If the page appears to be a login page, access denied page, or you cannot find a job description, return exactly: NO_JOB_FOUND

Extract the job description from this HTML:

${html.slice(0, 50000)}`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 4000,
        }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Gemini API error:', errorText);
      throw new Error('Failed to extract job description');
    }

    const aiData = await aiResponse.json();
    const jobDescription = aiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    console.log('Extracted job description length:', jobDescription.length);
    console.log('Job description preview:', jobDescription.slice(0, 200));

    if (!jobDescription || jobDescription.length < 50 || jobDescription.includes('NO_JOB_FOUND')) {
      return new Response(
        JSON.stringify({ error: 'Could not extract job description from this URL. The page may require login or the job posting may have expired. Please paste the job description text directly.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ jobDescription }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in fetch-job-description:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch job description';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
