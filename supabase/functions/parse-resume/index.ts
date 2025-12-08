import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    let text = '';
    
    // Handle different file types
    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      const arrayBuffer = await file.arrayBuffer();
      text = await extractPdfText(arrayBuffer);
      
    } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      text = await file.text();
    } else if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
      text = await extractDocxText(await file.arrayBuffer());
    } else {
      text = await file.text();
    }

    console.log('Extracted text length:', text.length);
    console.log('Extracted text preview:', text.substring(0, 400));

    // Parse the extracted text to find resume components
    const { skills, experience, candidateName, candidateTitle } = parseResumeText(text);

    console.log('Parsed resume - Name:', candidateName, 'Title:', candidateTitle, 'Skills:', skills.length);

    return new Response(JSON.stringify({
      success: true,
      text: text.slice(0, 50000),
      skills: skills.slice(0, 30),
      experience,
      name: candidateName || 'Your Name',
      title: candidateTitle || 'Professional',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error parsing resume:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Failed to parse resume' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Improved PDF text extraction
async function extractPdfText(arrayBuffer: ArrayBuffer): Promise<string> {
  const bytes = new Uint8Array(arrayBuffer);
  
  // Method 1: Extract from CMap encoded text (common in Google Docs PDFs)
  let pdfString = '';
  for (let i = 0; i < bytes.length; i++) {
    pdfString += String.fromCharCode(bytes[i]);
  }
  
  const extractedTexts: string[] = [];
  
  // Method 2: Look for text in ToUnicode CMap (handles Google Docs/Skia PDFs better)
  // Extract beginbfchar mappings
  const bfcharMatches = pdfString.matchAll(/beginbfchar\s*([\s\S]*?)endbfchar/g);
  const charMap = new Map<string, string>();
  
  for (const match of bfcharMatches) {
    const lines = match[1].split('\n').filter(l => l.trim());
    for (const line of lines) {
      const parts = line.match(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/);
      if (parts) {
        const fromCode = parts[1];
        const toCode = parts[2];
        // Convert hex to character
        try {
          const charCode = parseInt(toCode, 16);
          if (charCode > 31 && charCode < 65536) {
            charMap.set(fromCode.toLowerCase(), String.fromCharCode(charCode));
          }
        } catch {}
      }
    }
  }
  
  // Method 3: Extract text from BT/ET blocks using the CMap
  const btEtBlocks = pdfString.matchAll(/BT[\s\S]*?ET/g);
  
  for (const block of btEtBlocks) {
    const blockText = block[0];
    
    // Look for Tj operators (single text)
    const tjMatches = blockText.matchAll(/\(([^)]*)\)\s*Tj/g);
    for (const tj of tjMatches) {
      const textContent = decodeEscapedString(tj[1]);
      if (textContent.length > 0) {
        extractedTexts.push(textContent);
      }
    }
    
    // Look for TJ operators (array of text with positioning)
    const tjArrayMatches = blockText.matchAll(/\[((?:[^[\]]*|\[[^\]]*\])*)\]\s*TJ/gi);
    for (const tjArray of tjArrayMatches) {
      const content = tjArray[1];
      const textParts = content.matchAll(/\(([^)]*)\)/g);
      for (const part of textParts) {
        const textContent = decodeEscapedString(part[1]);
        if (textContent.length > 0) {
          extractedTexts.push(textContent);
        }
      }
    }
    
    // Look for hex encoded strings <hex>
    const hexMatches = blockText.matchAll(/<([0-9A-Fa-f]+)>\s*Tj/g);
    for (const hex of hexMatches) {
      const decoded = decodeHexString(hex[1], charMap);
      if (decoded.length > 0) {
        extractedTexts.push(decoded);
      }
    }
  }
  
  // Method 4: Fallback - extract all printable strings from PDF
  if (extractedTexts.length < 5) {
    const printableMatches = pdfString.matchAll(/\(([A-Za-z][A-Za-z\s\.,\-\']{2,})\)/g);
    for (const match of printableMatches) {
      const text = match[1].trim();
      if (text.length > 2 && !/^\d+$/.test(text)) {
        extractedTexts.push(text);
      }
    }
  }
  
  // Method 5: Look for stream content and extract readable text
  const streamMatches = pdfString.matchAll(/stream\s*([\s\S]*?)endstream/g);
  for (const stream of streamMatches) {
    // Try to find readable text in streams
    const streamContent = stream[1];
    const readableText = streamContent.match(/[A-Za-z]{3,}(?:\s+[A-Za-z]{2,})*/g);
    if (readableText) {
      for (const text of readableText) {
        if (text.length > 5 && !text.includes('BT') && !text.includes('ET') && 
            !text.includes('Tj') && !text.includes('TJ') && !text.includes('Tf')) {
          // Only add if it looks like real content
          if (/^[A-Z]/.test(text) || text.length > 10) {
            extractedTexts.push(text);
          }
        }
      }
    }
  }
  
  // Join and clean up
  let result = extractedTexts.join(' ')
    .replace(/\s+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space between camelCase
    .trim();
  
  console.log('PDF extraction found', extractedTexts.length, 'text segments');
  
  return result;
}

// Decode PDF escaped strings
function decodeEscapedString(str: string): string {
  return str
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\\\\/g, '\\')
    .replace(/\\([0-7]{1,3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)));
}

// Decode hex string using character map
function decodeHexString(hex: string, charMap: Map<string, string>): string {
  let result = '';
  for (let i = 0; i < hex.length; i += 4) {
    const code = hex.substring(i, i + 4).toLowerCase();
    if (charMap.has(code)) {
      result += charMap.get(code);
    } else {
      // Try 2-char code
      const code2 = hex.substring(i, i + 2).toLowerCase();
      if (charMap.has(code2)) {
        result += charMap.get(code2);
        i -= 2;
      } else {
        // Fallback: try to decode as UTF-16
        const charCode = parseInt(code || code2, 16);
        if (charCode > 31 && charCode < 127) {
          result += String.fromCharCode(charCode);
        }
      }
    }
  }
  return result;
}

// Extract text from DOCX files
async function extractDocxText(arrayBuffer: ArrayBuffer): Promise<string> {
  const bytes = new Uint8Array(arrayBuffer);
  
  let docContent = '';
  for (let i = 0; i < bytes.length; i++) {
    const char = bytes[i];
    if (char >= 32 && char <= 126) {
      docContent += String.fromCharCode(char);
    } else if (char === 10 || char === 13) {
      docContent += '\n';
    }
  }
  
  // Extract text from XML tags
  const textMatches = docContent.match(/<w:t[^>]*>([^<]+)<\/w:t>/g) || [];
  const extractedTexts = textMatches.map(match => {
    const content = match.replace(/<[^>]+>/g, '');
    return content;
  });
  
  return extractedTexts.join(' ').replace(/\s+/g, ' ').trim();
}

// Parse resume text to extract structured data
function parseResumeText(text: string): {
  skills: string[];
  experience: { title: string; company: string; bullets: string[] }[];
  candidateName: string;
  candidateTitle: string;
} {
  const skills: string[] = [];
  const experience: { title: string; company: string; bullets: string[] }[] = [];
  let candidateName = '';
  let candidateTitle = '';
  
  const lines = text.split(/[\n\r]+/).map(l => l.trim()).filter(l => l && l.length > 1);
  
  console.log('Parsing', lines.length, 'lines. First 5:', lines.slice(0, 5));
  
  // Name extraction - try multiple strategies
  for (let i = 0; i < Math.min(lines.length, 15); i++) {
    const line = lines[i].trim();
    
    if (!line || line.length > 60 || line.length < 2) continue;
    if (line.includes('@') || line.includes('http') || line.includes('www.')) continue;
    if (/^(summary|experience|education|skills|objective|about|professional|contact|phone|email|address|linkedin)/i.test(line)) continue;
    
    // Pattern 1: Full name (First Last or First Middle Last)
    if (!candidateName && /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}$/.test(line)) {
      candidateName = line;
      console.log('Found name pattern 1:', candidateName);
      continue;
    }
    
    // Pattern 2: Single capitalized name (common in some cultures)
    if (!candidateName && /^[A-Z][a-z]{2,20}$/.test(line)) {
      candidateName = line;
      console.log('Found name pattern 2:', candidateName);
      continue;
    }
    
    // Pattern 3: ALL CAPS name
    if (!candidateName && /^[A-Z]{2,}(?:\s+[A-Z]{2,}){0,3}$/.test(line) && line.length < 40) {
      candidateName = line.split(' ').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
      console.log('Found name pattern 3 (CAPS):', candidateName);
      continue;
    }
    
    // Pattern 4: Name in first clean line (letters, spaces, hyphens only)
    if (!candidateName && i < 5 && /^[A-Za-z\s'-]+$/.test(line) && line.length >= 3 && line.length <= 40) {
      candidateName = line;
      console.log('Found name pattern 4 (clean line):', candidateName);
      continue;
    }
    
    // Title detection
    const titleKeywords = ['developer', 'designer', 'engineer', 'manager', 'lead', 'director', 
      'analyst', 'consultant', 'specialist', 'architect', 'coordinator', 'product', 
      'senior', 'junior', 'associate', 'ux', 'ui', 'frontend', 'backend', 'full stack',
      'data', 'software', 'web', 'mobile', 'devops', 'qa', 'tester', 'researcher'];
    
    if (!candidateTitle && line.length > 5 && line.length < 60) {
      const lowerLine = line.toLowerCase();
      if (titleKeywords.some(k => lowerLine.includes(k))) {
        candidateTitle = line;
        console.log('Found title:', candidateTitle);
      }
    }
  }
  
  // Extract skills
  const techKeywords = text.match(/\b(React|Angular|Vue|Node\.?js|Python|Java|JavaScript|TypeScript|SQL|PostgreSQL|MySQL|MongoDB|AWS|Azure|GCP|Docker|Kubernetes|GraphQL|REST|API|Git|GitHub|GitLab|CI\/CD|Agile|Scrum|Machine Learning|ML|AI|Artificial Intelligence|Data Science|Data Analysis|Redux|Next\.?js|Express|Django|Flask|Spring|Ruby|Rails|PHP|Laravel|Swift|Kotlin|Flutter|React Native|HTML|HTML5|CSS|CSS3|SASS|SCSS|Less|Tailwind|Bootstrap|Material UI|MUI|Figma|Sketch|Adobe XD|InVision|Framer|UI\/UX|UX|UI|User Experience|User Interface|Product Design|User Research|Prototyping|Wireframing|Design Systems|Design Thinking|Information Architecture|Usability Testing|A\/B Testing|Analytics|Google Analytics|Mixpanel|Hotjar|DevOps|Linux|Unix|Terraform|Jenkins|Ansible|Puppet|Chef|AWS Lambda|Serverless|Microservices|Jira|Confluence|Notion|Slack|Trello|Asana|Microsoft Office|Excel|PowerPoint|Word|Photoshop|Illustrator|After Effects|Premiere|Final Cut|Canva|InDesign|Balsamiq|Zeplin|Miro|Lucidchart|Visio|Tableau|Power BI|Looker|Metabase|Superset|Clarity|CleverTap|Amplitude|Segment|Heap|Pendo|FullStory|LogRocket|Sentry|New Relic|Datadog|Splunk|Elastic|Kibana|Grafana|Prometheus)\b/gi);
  
  if (techKeywords) {
    const uniqueSkills = [...new Set(techKeywords.map(s => s.toLowerCase()))];
    skills.push(...uniqueSkills);
  }
  
  // Extract experience bullets
  const bullets: string[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if ((trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('*') || trimmed.startsWith('●') || trimmed.startsWith('○')) && trimmed.length > 20) {
      bullets.push(trimmed.replace(/^[-•*●○]\s*/, '').slice(0, 500));
    } 
    else if (trimmed.length > 40 && trimmed.length < 500) {
      const actionWords = ['developed', 'designed', 'led', 'managed', 'created', 'built', 
        'implemented', 'improved', 'increased', 'reduced', 'optimized', 'launched',
        'coordinated', 'collaborated', 'established', 'analyzed', 'conducted',
        'spearheaded', 'initiated', 'streamlined', 'enhanced', 'delivered'];
      const lowerTrimmed = trimmed.toLowerCase();
      if (actionWords.some(w => lowerTrimmed.startsWith(w) || lowerTrimmed.includes(' ' + w + ' '))) {
        bullets.push(trimmed.slice(0, 500));
      }
    }
  }
  
  if (bullets.length > 0) {
    experience.push({
      title: candidateTitle || 'Professional Experience',
      company: 'Various',
      bullets: bullets.slice(0, 15),
    });
  }
  
  return { skills, experience, candidateName, candidateTitle };
}
