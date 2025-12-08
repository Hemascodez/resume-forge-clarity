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
      // For PDFs, use a simple text extraction approach
      // Read the PDF and extract text between stream markers
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      
      // Convert to string, handling binary data
      let pdfContent = '';
      for (let i = 0; i < bytes.length; i++) {
        const char = bytes[i];
        if (char >= 32 && char <= 126) {
          pdfContent += String.fromCharCode(char);
        } else if (char === 10 || char === 13) {
          pdfContent += '\n';
        } else {
          pdfContent += ' ';
        }
      }
      
      // Extract text content from PDF structure
      // Look for text between parentheses (PDF text objects) and clean it
      const textMatches = pdfContent.match(/\(([^)]+)\)/g) || [];
      const extractedTexts: string[] = [];
      
      for (const match of textMatches) {
        const cleaned = match.slice(1, -1)
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '')
          .replace(/\\t/g, ' ')
          .replace(/\\\(/g, '(')
          .replace(/\\\)/g, ')')
          .replace(/\\\\/g, '\\')
          .trim();
        
        if (cleaned.length > 2 && !/^[0-9\s.]+$/.test(cleaned)) {
          extractedTexts.push(cleaned);
        }
      }
      
      // Also look for BT/ET blocks (text blocks in PDF)
      const btEtMatches = pdfContent.match(/BT[\s\S]*?ET/g) || [];
      for (const block of btEtMatches) {
        const tjMatches = block.match(/\[([^\]]+)\]\s*TJ/g) || [];
        for (const tj of tjMatches) {
          const parts = tj.match(/\(([^)]+)\)/g) || [];
          for (const part of parts) {
            const cleaned = part.slice(1, -1).trim();
            if (cleaned.length > 1) {
              extractedTexts.push(cleaned);
            }
          }
        }
      }
      
      text = extractedTexts.join(' ').replace(/\s+/g, ' ').trim();
      
      // If extraction failed, provide a fallback message
      if (text.length < 50) {
        text = 'PDF content could not be fully extracted. Please paste your resume text directly or use a .txt or .docx file for best results.';
      }
      
    } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      text = await file.text();
    } else if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
      // For DOCX, extract text from XML
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      
      // DOCX is a ZIP file, try to find document.xml content
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
      
      text = extractedTexts.join(' ').replace(/\s+/g, ' ').trim();
      
      if (text.length < 50) {
        text = 'Document content could not be fully extracted. Please paste your resume text directly for best results.';
      }
    } else {
      // Try to read as text
      text = await file.text();
    }

    console.log('Extracted text length:', text.length);
    console.log('Extracted text preview:', text.substring(0, 200));

    // Parse the extracted text to find resume components
    const skills: string[] = [];
    const experience: { title: string; company: string; bullets: string[] }[] = [];
    let candidateName = '';
    let candidateTitle = '';
    
    // Extract name - usually at the beginning of the resume
    // Look for a name pattern (2-4 capitalized words at the start)
    const lines = text.split('\n').filter(l => l.trim());
    for (let i = 0; i < Math.min(lines.length, 5); i++) {
      const line = lines[i].trim();
      // Name is usually 2-4 words, all capitalized or title case, no numbers
      const nameMatch = line.match(/^([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){1,3})$/);
      if (nameMatch && !candidateName) {
        candidateName = nameMatch[1];
        continue;
      }
      // Title often follows the name - look for job-related words
      const titleKeywords = ['developer', 'designer', 'engineer', 'manager', 'lead', 'director', 'analyst', 'consultant', 'specialist', 'architect', 'coordinator', 'product', 'senior', 'junior', 'associate'];
      if (!candidateTitle && line.length > 5 && line.length < 60) {
        const lowerLine = line.toLowerCase();
        if (titleKeywords.some(k => lowerLine.includes(k))) {
          candidateTitle = line;
        }
      }
    }
    
    // If no name found via pattern, try first non-empty short line
    if (!candidateName && lines.length > 0) {
      for (const line of lines.slice(0, 3)) {
        const trimmed = line.trim();
        if (trimmed.length > 3 && trimmed.length < 50 && !trimmed.includes('@') && !trimmed.includes('http')) {
          // Check if it looks like a name (no special characters except spaces)
          if (/^[A-Za-z\s'-]+$/.test(trimmed)) {
            candidateName = trimmed;
            break;
          }
        }
      }
    }
    
    // Extract skills
    const skillPatterns = [
      /(?:skills?|technologies|tech stack|technical skills)[\s:]*([^]*?)(?:experience|education|projects|$)/i,
    ];
    
    for (const pattern of skillPatterns) {
      const match = text.match(pattern);
      if (match) {
        const skillsText = match[1];
        const techKeywords = skillsText.match(/\b(React|Angular|Vue|Node\.?js|Python|Java|JavaScript|TypeScript|SQL|PostgreSQL|MongoDB|AWS|Azure|GCP|Docker|Kubernetes|GraphQL|REST|API|Git|CI\/CD|Agile|Scrum|Machine Learning|AI|Data Science|Redux|Next\.?js|Express|Django|Flask|Spring|Ruby|Rails|PHP|Laravel|Swift|Kotlin|Flutter|React Native|HTML|CSS|SASS|Tailwind|Bootstrap|Figma|Sketch|UI\/UX|DevOps|Linux|Terraform|Jenkins|Ansible|Product Design|User Research|Prototyping|Wireframing|Design Systems|Adobe XD|Framer)\b/gi);
        if (techKeywords) {
          skills.push(...[...new Set(techKeywords.map(s => s.toLowerCase()))]);
        }
      }
    }
    
    // Also extract from full text
    const allTechKeywords = text.match(/\b(React|Angular|Vue|Node\.?js|Python|Java|JavaScript|TypeScript|SQL|PostgreSQL|MongoDB|AWS|Azure|GCP|Docker|Kubernetes|GraphQL|REST|API|Git|CI\/CD|Agile|Scrum|Machine Learning|AI|Data Science|Redux|Next\.?js|Express|Django|Flask|Spring|Ruby|Rails|PHP|Laravel|Swift|Kotlin|Flutter|React Native|HTML|CSS|SASS|Tailwind|Bootstrap|Figma|Sketch|UI\/UX|DevOps|Linux|Terraform|Jenkins|Ansible|Product Design|User Research|Prototyping|Wireframing|Design Systems|Adobe XD|Framer)\b/gi);
    if (allTechKeywords) {
      skills.push(...[...new Set(allTechKeywords.map(s => s.toLowerCase()))]);
    }
    
    // Deduplicate skills
    const uniqueSkills = [...new Set(skills)];
    
    // Extract experience bullets
    const bullets: string[] = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      if ((trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('*')) && trimmed.length > 20) {
        bullets.push(trimmed.replace(/^[-•*]\s*/, '').slice(0, 500));
      } else if (trimmed.length > 30 && trimmed.length < 500 && 
                 (trimmed.includes('develop') || trimmed.includes('design') || 
                  trimmed.includes('lead') || trimmed.includes('manage') ||
                  trimmed.includes('create') || trimmed.includes('build') ||
                  trimmed.includes('implement'))) {
        bullets.push(trimmed.slice(0, 500));
      }
    }
    
    if (bullets.length > 0) {
      experience.push({
        title: candidateTitle || 'Professional Experience',
        company: 'Various',
        bullets: bullets.slice(0, 10),
      });
    }

    return new Response(JSON.stringify({
      success: true,
      text: text.slice(0, 50000),
      skills: uniqueSkills.slice(0, 30),
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
