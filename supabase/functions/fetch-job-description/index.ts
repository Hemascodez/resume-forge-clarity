import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function callLovableAI(prompt: string): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  
  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY is not configured');
  }

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Lovable AI error:', response.status, errorText);
    
    if (response.status === 429) {
      throw new Error('RATE_LIMIT');
    }
    if (response.status === 402) {
      throw new Error('PAYMENT_REQUIRED');
    }
    
    throw new Error(`Lovable AI error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

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

    // Check for login walls or blocked content
    const loginIndicators = [
      'sign in to view',
      'login to view',
      'join to view',
      'sign up to view',
      'authwall',
      'login-modal',
      'signin-modal'
    ];
    
    const htmlLower = html.toLowerCase();
    const hasLoginWall = loginIndicators.some(indicator => htmlLower.includes(indicator));
    
    if (hasLoginWall) {
      console.log('Detected login wall or blocked content');
      return new Response(
        JSON.stringify({ error: 'This job posting requires login to view. Please paste the job description text directly instead of using the URL.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use Lovable AI to extract job description from HTML
    const prompt = `You are a job description extractor. Extract the complete job description from the provided HTML content.
            
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
If you cannot find a job description, return an empty string.

Extract the job description from this HTML:

${html.slice(0, 50000)}`;

    const jobDescription = await callLovableAI(prompt);

    console.log('Extracted job description length:', jobDescription.length);

    if (!jobDescription || jobDescription.length < 50) {
      return new Response(
        JSON.stringify({ error: 'Could not extract job description from this URL' }),
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
    
    if (errorMessage === 'RATE_LIMIT') {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (errorMessage === 'PAYMENT_REQUIRED') {
      return new Response(
        JSON.stringify({ error: 'API credits exhausted. Please add credits to continue.' }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
