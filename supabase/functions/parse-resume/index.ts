import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function callGemini(prompt: string, base64Data: string, mimeType: string): Promise<string> {
  const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
  
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Data
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 4096,
      }
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Gemini API error:', response.status, errorText);
    
    if (response.status === 429) {
      throw new Error('RATE_LIMIT');
    }
    
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Parsing file:', file.name, 'type:', file.type, 'size:', file.size);

    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    
    // Convert to base64
    let binary = '';
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    const base64 = btoa(binary);

    console.log('Sending resume to Gemini for parsing...');

    const mimeType = file.type || 'application/pdf';

    const prompt = `You are a resume parser. Extract structured information from this resume document.
            
ALWAYS respond with a valid JSON object with these exact fields:
{
  "name": "Full name of the candidate",
  "title": "Current or target job title",
  "email": "Email if found or empty string",
  "phone": "Phone if found or empty string",
  "location": "Location if found or empty string",
  "summary": "Professional summary/about section if present",
  "skills": ["array", "of", "skills"],
  "experience": [
    {
      "title": "Job title",
      "company": "Company name",
      "duration": "Date range",
      "bullets": ["Achievement 1", "Achievement 2"]
    }
  ],
  "education": [
    {
      "degree": "Degree name",
      "institution": "School/University name",
      "year": "Graduation year"
    }
  ],
  "projects": [
    {
      "name": "Project name",
      "description": "Brief description",
      "technologies": ["tech1", "tech2"]
    }
  ]
}

Be thorough in extracting ALL skills, experience items, and achievements from the document.
If information is not available, use empty strings or empty arrays.
ONLY respond with the JSON object, no other text.`;

    const content = await callGemini(prompt, base64, mimeType);

    console.log('AI response received, length:', content.length);
    console.log('AI response preview:', content.substring(0, 500));

    let parsedResume;
    try {
      let cleanContent = content.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.slice(7);
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith('```')) {
        cleanContent = cleanContent.slice(0, -3);
      }
      cleanContent = cleanContent.trim();
      
      parsedResume = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.error('Raw content:', content);
      
      parsedResume = {
        name: extractName(content),
        title: extractTitle(content),
        skills: extractSkills(content),
        experience: [],
        education: [],
        projects: [],
        summary: '',
        email: '',
        phone: '',
        location: ''
      };
    }

    const rawText = buildRawText(parsedResume);

    console.log('Parsed resume - Name:', parsedResume.name, 'Title:', parsedResume.title, 'Skills:', parsedResume.skills?.length || 0);

    return new Response(JSON.stringify({
      success: true,
      text: rawText,
      skills: parsedResume.skills || [],
      experience: parsedResume.experience || [],
      education: parsedResume.education || [],
      projects: parsedResume.projects || [],
      name: parsedResume.name || 'Candidate',
      title: parsedResume.title || 'Professional',
      email: parsedResume.email || '',
      phone: parsedResume.phone || '',
      location: parsedResume.location || '',
      summary: parsedResume.summary || '',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error parsing resume:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to parse resume';
    
    if (errorMessage === 'RATE_LIMIT') {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function buildRawText(resume: any): string {
  const parts: string[] = [];
  
  if (resume.name) parts.push(`Name: ${resume.name}`);
  if (resume.title) parts.push(`Title: ${resume.title}`);
  if (resume.email) parts.push(`Email: ${resume.email}`);
  if (resume.phone) parts.push(`Phone: ${resume.phone}`);
  if (resume.location) parts.push(`Location: ${resume.location}`);
  if (resume.summary) parts.push(`\nSummary:\n${resume.summary}`);
  
  if (resume.skills?.length > 0) {
    parts.push(`\nSkills: ${resume.skills.join(', ')}`);
  }
  
  if (resume.experience?.length > 0) {
    parts.push('\nExperience:');
    for (const exp of resume.experience) {
      parts.push(`\n${exp.title} at ${exp.company} (${exp.duration || 'N/A'})`);
      if (exp.bullets?.length > 0) {
        for (const bullet of exp.bullets) {
          parts.push(`• ${bullet}`);
        }
      }
    }
  }
  
  if (resume.education?.length > 0) {
    parts.push('\nEducation:');
    for (const edu of resume.education) {
      parts.push(`${edu.degree} - ${edu.institution} (${edu.year || 'N/A'})`);
    }
  }

  if (resume.projects?.length > 0) {
    parts.push('\nProjects:');
    for (const proj of resume.projects) {
      parts.push(`${proj.name}: ${proj.description || ''}`);
      if (proj.technologies?.length > 0) {
        parts.push(`Technologies: ${proj.technologies.join(', ')}`);
      }
    }
  }
  
  return parts.join('\n');
}

function extractName(text: string): string {
  const nameMatch = text.match(/"name"\s*:\s*"([^"]+)"/i);
  if (nameMatch) return nameMatch[1];
  
  const lines = text.split('\n').filter(l => l.trim());
  for (const line of lines.slice(0, 5)) {
    if (/^[A-Z][a-z]+\s+[A-Z][a-z]+/.test(line.trim())) {
      return line.trim();
    }
  }
  return '';
}

function extractTitle(text: string): string {
  const titleMatch = text.match(/"title"\s*:\s*"([^"]+)"/i);
  if (titleMatch) return titleMatch[1];
  return '';
}

function extractSkills(text: string): string[] {
  const skillsMatch = text.match(/"skills"\s*:\s*\[([^\]]+)\]/i);
  if (skillsMatch) {
    return skillsMatch[1].split(',').map(s => s.replace(/"/g, '').trim()).filter(s => s);
  }
  return [];
}
