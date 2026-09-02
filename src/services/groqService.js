/**
 * Groq AI Vision Service
 * Sends uploaded form images to Groq's Vision Models (e.g. LLaMA 3.2 Vision / Qwen)
 * and extracts a complete, structured Form JSON schema.
 */

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// Default API Key from environment or predefined config
export const DEFAULT_GROQ_API_KEY =
    import.meta.env.VITE_GROQ_API_KEY ||
    "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";

export const AVAILABLE_GROQ_MODELS = [
    {
        id: "llama-3.2-11b-vision-preview",
        name: "Llama 3.2 11B Vision (Recommended - Fast & Accurate)",
        description: "Optimized for high-speed document OCR and structured form generation."
    },
    {
        id: "llama-3.2-90b-vision-preview",
        name: "Llama 3.2 90B Vision (Highest Quality)",
        description: "Ultra high-accuracy vision model for complex multi-table and dense forms."
    },
    {
        id: "qwen/qwen3.8-27b",
        name: "qwen/qwen3.8-27b (Groq Qwen)",
        description: "Specialized for multilingual and technical form structures."
    }
];

const SYSTEM_PROMPT = `You are an expert Document Intelligence and Form Extraction AI.
Your task is to analyze the provided image of a form, document, checklist, inspection sheet, or application, and extract its entire layout and content into a clean, complete JSON Form Schema.

Rules for extraction:
1. Extract all document header metadata (title, company, address, document_number, revision, frequency, version).
2. Extract all form fields and inputs in chronological reading order.
3. Identify field types accurately:
   - "text" for single line inputs (names, IDs, text)
   - "number" for quantities, amounts, measurements, ages
   - "date" for date fields
   - "time" for time fields
   - "textarea" for multi-line remarks, descriptions, notes
   - "dropdown" or "radio" for choice selections (provide "options": ["Option 1", "Option 2"])
   - "checkbox" for yes/no, acknowledgments, agreements, or toggles
   - "table" for tables, checklists, grids, matrices, or itemized lists:
     * Provide "columns": [{"id": "col_id", "label": "Column Title", "type": "text"|"status"|"textarea"|"number"|"checkbox", "options": ["OK", "NOT OK"]}]
     * If the table is divided into named sections (e.g., ENTRANCE, PREMIXING, ASSEMBLY), provide "sections": [{"id": "sec_1", "name": "SECTION NAME", "rows": [{"id": "row_1", "check_point": "Description of item/task", "status": "", "remarks": ""}]}]
     * If it is a standard table without sections, provide "rows": [{"id": "row_1", ...}] or define standard columns for dynamic entry.
   - "signature" for signature boxes or sign-off lines (e.g. "Operator Signature", "Supervisor Sign-off")
   - "section" for major section headers dividing the form into groups
   - "label" for static informational instructions or notes

Output MUST be a single valid JSON object following this format:
{
  "form": {
    "name": "Exact Title of the Form",
    "document_number": "Doc ID / Code if visible",
    "revision": "Rev number if visible",
    "company": "Company / Organization Name if visible",
    "address": "Address if visible",
    "frequency": "Daily / Weekly / etc. if visible",
    "description": "Brief description or subtitle"
  },
  "elements": [
    {
      "id": "unique_field_id",
      "type": "text | number | date | time | textarea | dropdown | radio | checkbox | table | signature | section | label",
      "label": "Visible Field Label",
      "required": false,
      "placeholder": "",
      "options": ["Option A", "Option B"]
    }
  ]
}

Return ONLY raw, valid JSON. Do not include markdown preamble or conversational text outside the JSON.`;

/**
 * Convert a File object or DataURL to base64 DataURL
 */
export async function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
}

/**
 * Call Groq Vision API with form image and apiKey
 */
export async function generateFormFromImage({ imageBase64, apiKey, model = "llama-3.2-11b-vision-preview", customPrompt = "" }) {
    const keyToUse = (apiKey && apiKey.trim()) || DEFAULT_GROQ_API_KEY;

    if (!keyToUse || typeof keyToUse !== "string" || keyToUse.trim().length === 0) {
        throw new Error("No Groq API Key found. Please configure VITE_GROQ_API_KEY in .env.");
    }

    if (!imageBase64) {
        throw new Error("No form image provided.");
    }

    const userTextPrompt = customPrompt.trim()
        ? `Analyze this form image and convert it into a complete structured JSON form schema following the instructions. Additional instruction: ${customPrompt}`
        : "Analyze this form image and convert it into a complete structured JSON form schema. Extract all header info, sections, tables, checkpoints, inputs, dropdowns, checkboxes, and signature fields.";

    const requestPayload = {
        model: model || "llama-3.2-11b-vision-preview",
        messages: [
            {
                role: "system",
                content: SYSTEM_PROMPT
            },
            {
                role: "user",
                content: [
                    {
                        type: "text",
                        text: userTextPrompt
                    },
                    {
                        type: "image_url",
                        image_url: {
                            url: imageBase64
                        }
                    }
                ]
            }
        ],
        temperature: 0.1,
        max_tokens: 4096,
        response_format: { type: "json_object" }
    };

    let response;
    try {
        response = await fetch(GROQ_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${keyToUse.trim()}`
            },
            body: JSON.stringify(requestPayload)
        });
    } catch (networkErr) {
        throw new Error(`Network error connecting to Groq API: ${networkErr.message}. Check your internet connection.`);
    }

    if (!response.ok) {
        let errDetails = "";
        try {
            const errJson = await response.json();
            errDetails = errJson.error?.message || JSON.stringify(errJson);
        } catch {
            errDetails = await response.text();
        }

        if (response.status === 401) {
            throw new Error(`Invalid Groq API Key (401 Unauthorized): ${errDetails}`);
        } else if (response.status === 404) {
            throw new Error(`Model '${model}' not available on Groq (404 Not Found). Please select another model.`);
        } else if (response.status === 429) {
            throw new Error(`Groq API Rate limit reached (429 Too Many Requests): ${errDetails}`);
        } else {
            throw new Error(`Groq API Error (${response.status}): ${errDetails}`);
        }
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
        throw new Error("Groq API returned an empty response.");
    }

    // Extract JSON safely from response text
    let parsedJson;
    try {
        // Strip any markdown code fences (```json ... ```)
        const cleanedContent = content
            .replace(/^```json\s*/i, "")
            .replace(/^```\s*/i, "")
            .replace(/\s*```$/i, "")
            .trim();

        parsedJson = JSON.parse(cleanedContent);
    } catch (parseErr) {
        // Fallback: search for first '{' and last '}'
        const firstBrace = content.indexOf("{");
        const lastBrace = content.lastIndexOf("}");
        if (firstBrace !== -1 && lastBrace > firstBrace) {
            try {
                const subStr = content.substring(firstBrace, lastBrace + 1);
                parsedJson = JSON.parse(subStr);
            } catch (secondErr) {
                throw new Error(`Failed to parse AI response as JSON: ${parseErr.message}\nRaw content:\n${content.substring(0, 300)}...`);
            }
        } else {
            throw new Error(`AI response did not contain valid JSON: ${parseErr.message}`);
        }
    }

    return parsedJson;
}
