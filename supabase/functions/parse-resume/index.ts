import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function callOpenAI(prompt: string, fileContent: string): Promise<string> {
  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
  
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-5',
      messages: [
        {
          role: 'system',
          content: 'You are a resume parser that extracts structured information from resume text. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: `${prompt}\n\n--- RESUME CONTENT ---\n${fileContent}`
        }
      ],
      max_completion_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OpenAI API error:', response.status, errorText);
    
    if (response.status === 429) {
      throw new Error('RATE_LIMIT');
    }
    
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

// Extract text from PDF bytes (basic extraction)
function extractTextFromPDF(bytes: Uint8Array): string {
  try {
    const text = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
    
    // Extract text between stream markers in PDF
    const textParts: string[] = [];
    const streamRegex = /stream\s*([\s\S]*?)\s*endstream/gi;
    let match;
    
    while ((match = streamRegex.exec(text)) !== null) {
      const content = match[1];
      // Extract readable text (printable ASCII and common characters)
      const readable = content.replace(/[^\x20-\x7E\n\r\t]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (readable.length > 20) {
        textParts.push(readable);
      }
    }
    
    // Also try to extract text objects (Tj, TJ operators)
    const tjRegex = /\(([^)]+)\)\s*Tj/g;
    while ((match = tjRegex.exec(text)) !== null) {
      textParts.push(match[1]);
    }
    
    // Extract any readable text content
    const lines = text.split('\n');
    for (const line of lines) {
      const cleanLine = line.replace(/[^\x20-\x7E]/g, '').trim();
      if (cleanLine.length > 30 && !cleanLine.includes('obj') && !cleanLine.includes('endobj')) {
        textParts.push(cleanLine);
      }
    }
    
    const extractedText = textParts.join('\n').trim();
    
    if (extractedText.length < 100) {
      // Fallback: just get all readable content
      return text.replace(/[^\x20-\x7E\n\r\t]/g, ' ')
        .replace(/\s+/g, ' ')
        .substring(0, 15000)
        .trim();
    }
    
    return extractedText.substring(0, 15000);
  } catch (e) {
    console.error('PDF text extraction error:', e);
    return '';
  }
}

// Extract text from DOCX (basic XML extraction)
function extractTextFromDOCX(bytes: Uint8Array): string {
  try {
    const text = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
    
    // DOCX is a ZIP file, but we can try to extract readable XML content
    const textParts: string[] = [];
    
    // Look for XML text content patterns
    const textRegex = /<w:t[^>]*>([^<]+)<\/w:t>/g;
    let match;
    while ((match = textRegex.exec(text)) !== null) {
      textParts.push(match[1]);
    }
    
    // If we found XML content, join it
    if (textParts.length > 0) {
      return textParts.join(' ').substring(0, 15000);
    }
    
    // Fallback: extract any readable content
    return text.replace(/[^\x20-\x7E\n\r\t]/g, ' ')
      .replace(/\s+/g, ' ')
      .substring(0, 15000)
      .trim();
  } catch (e) {
    console.error('DOCX text extraction error:', e);
    return '';
  }
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
    
    // Extract text based on file type
    let extractedText = '';
    const mimeType = file.type || 'application/pdf';
    
    if (mimeType.includes('pdf')) {
      extractedText = extractTextFromPDF(bytes);
    } else if (mimeType.includes('docx') || mimeType.includes('openxmlformats')) {
      extractedText = extractTextFromDOCX(bytes);
    } else {
      // Try both methods
      extractedText = extractTextFromPDF(bytes) || extractTextFromDOCX(bytes);
    }
    
    console.log('Extracted text length:', extractedText.length);
    console.log('Extracted text preview:', extractedText.substring(0, 500));

    console.log('Sending resume to OpenAI GPT-5 for parsing...');

    const prompt = `You are a resume parser. Extract structured information from this resume.
            
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

Be thorough in extracting ALL skills, experience items, and achievements.
If information is not available, use empty strings or empty arrays.
ONLY respond with the JSON object, no other text.

Parse this resume (${file.name}):`;

    const content = await callOpenAI(prompt, extractedText);

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
