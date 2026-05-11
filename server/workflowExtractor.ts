/**
 * Workflow Extractor Module
 * 
 * Classifies uploaded images as either:
 * 1. Workflow/journey diagrams → extracts flow steps for conversation generation
 * 2. Product/brand images → passes through for normal asset injection
 * 
 * Uses LLM vision to analyze images and extract structured workflow data.
 */

import { invokeLLM } from "./_core/llm";

export interface WorkflowStep {
  stepNumber: number;
  title: string;
  timing: string;       // e.g., "Day 0", "2 weeks before due", "~3 months"
  description: string;  // What happens at this touchpoint
  messageContent: string; // Suggested message text
  messageType: "marketing" | "utility" | "authentication";
}

export interface WorkflowExtractionResult {
  isWorkflow: boolean;
  confidence: number;  // 0-1
  journeyTitle?: string;
  totalTouchpoints?: number;
  steps?: WorkflowStep[];
  rawDescription?: string;
  brandName?: string;
  industry?: string;
}

export interface ClassifiedAsset {
  url: string;
  name: string;
  type: "image" | "video";
  classification: "workflow" | "product" | "unknown";
  workflowData?: WorkflowExtractionResult;
  thumbnail?: string;
}

/**
 * Classify a single image as workflow diagram or product image using LLM vision.
 * Returns classification result with confidence score.
 */
export async function classifyImage(imageUrl: string, fileName: string): Promise<{
  classification: "workflow" | "product";
  confidence: number;
  reasoning: string;
}> {
  try {
    const result = await invokeLLM({
      messages: [
        {
          role: "system" as const,
          content: `You are an image classifier for a WhatsApp messaging template builder. Your job is to determine if an uploaded image is:

1. A WORKFLOW/JOURNEY DIAGRAM - An image that describes a messaging flow, customer journey, touchpoint sequence, funnel stages, or process steps. These typically contain:
   - Numbered steps or stages
   - Arrows or flow connections
   - Text boxes describing actions/messages
   - Timeline or sequence indicators
   - Words like "journey", "flow", "touchpoints", "stages", "funnel", "workflow", "sequence"
   - Flowcharts, swimlane diagrams, process maps

2. A PRODUCT/BRAND IMAGE - A photo or graphic of actual products, services, people, places, or branding materials meant to be used AS content in the conversation.

Respond with ONLY a JSON object, no other text.`
        },
        {
          role: "user" as const,
          content: [
            { type: "image_url" as const, image_url: { url: imageUrl, detail: "high" as const } },
            { type: "text" as const, text: `Classify this image (filename: "${fileName}"). Is it a workflow/journey diagram describing a messaging flow, or a product/brand image? Respond with JSON: {"classification": "workflow" or "product", "confidence": 0.0-1.0, "reasoning": "brief explanation"}` }
          ]
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "image_classification",
          strict: true,
          schema: {
            type: "object",
            properties: {
              classification: { type: "string", enum: ["workflow", "product"], description: "Whether the image is a workflow diagram or product image" },
              confidence: { type: "number", description: "Confidence score from 0.0 to 1.0" },
              reasoning: { type: "string", description: "Brief explanation of why this classification was chosen" }
            },
            required: ["classification", "confidence", "reasoning"],
            additionalProperties: false
          }
        }
      }
    });

    const content = result.choices?.[0]?.message?.content;
    if (!content) {
      return { classification: "product", confidence: 0.5, reasoning: "No response from vision API" };
    }

    const parsed = JSON.parse(typeof content === "string" ? content : JSON.stringify(content));
    return {
      classification: parsed.classification === "workflow" ? "workflow" : "product",
      confidence: Math.min(1, Math.max(0, parsed.confidence || 0.5)),
      reasoning: parsed.reasoning || "No reasoning provided"
    };
  } catch (err: any) {
    console.warn(`[WorkflowExtractor] Classification failed for "${fileName}":`, err.message?.substring(0, 100));
    return { classification: "product", confidence: 0.3, reasoning: `Classification error: ${err.message?.substring(0, 50)}` };
  }
}

/**
 * Extract workflow steps from a journey/flow diagram image using LLM vision.
 * Returns structured workflow data that can be used to generate a conversation flow.
 */
export async function extractWorkflowFromImage(imageUrl: string, fileName: string): Promise<WorkflowExtractionResult> {
  try {
    const result = await invokeLLM({
      messages: [
        {
          role: "system" as const,
          content: `You are a workflow extraction specialist for WhatsApp business messaging. Your job is to analyze journey/flow diagram images and extract structured workflow data.

Extract ALL touchpoints/stages from the diagram. For each step, identify:
- The step number (in sequence order)
- The title/name of the stage
- The timing (when this happens - e.g., "Day 0", "Week 12-36", "~3 months", "60 days inactive")
- A description of what happens at this touchpoint
- Suggested WhatsApp message content for this touchpoint
- Whether this is a marketing, utility, or authentication message

Also identify:
- The overall journey title
- Any brand name mentioned
- The industry vertical

Be thorough - extract EVERY touchpoint visible in the diagram, even if partially visible.
Respond with ONLY a JSON object, no other text.`
        },
        {
          role: "user" as const,
          content: [
            { type: "image_url" as const, image_url: { url: imageUrl, detail: "high" as const } },
            { type: "text" as const, text: `Extract the complete workflow/journey from this diagram (filename: "${fileName}"). Identify all touchpoints, their sequence, timing, and suggested message content. Respond with JSON matching the schema.` }
          ]
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "workflow_extraction",
          strict: true,
          schema: {
            type: "object",
            properties: {
              journeyTitle: { type: "string", description: "The overall title of the journey/workflow" },
              totalTouchpoints: { type: "integer", description: "Total number of touchpoints extracted" },
              brandName: { type: "string", description: "Brand name if visible in the diagram, or empty string" },
              industry: { type: "string", description: "Industry vertical (e.g., Retail, Healthcare, FMCG, Automotive)" },
              steps: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    stepNumber: { type: "integer", description: "Sequential step number" },
                    title: { type: "string", description: "Title of this touchpoint/stage" },
                    timing: { type: "string", description: "When this touchpoint occurs (e.g., Day 0, Week 12)" },
                    description: { type: "string", description: "What happens at this touchpoint" },
                    messageContent: { type: "string", description: "Suggested WhatsApp message text for this touchpoint" },
                    messageType: { type: "string", enum: ["marketing", "utility", "authentication"], description: "Type of WhatsApp message" }
                  },
                  required: ["stepNumber", "title", "timing", "description", "messageContent", "messageType"],
                  additionalProperties: false
                }
              },
              rawDescription: { type: "string", description: "A plain-text summary of the entire workflow" }
            },
            required: ["journeyTitle", "totalTouchpoints", "brandName", "industry", "steps", "rawDescription"],
            additionalProperties: false
          }
        }
      }
    });

    const content = result.choices?.[0]?.message?.content;
    if (!content) {
      return { isWorkflow: false, confidence: 0 };
    }

    const parsed = JSON.parse(typeof content === "string" ? content : JSON.stringify(content));
    
    return {
      isWorkflow: true,
      confidence: 0.9,
      journeyTitle: parsed.journeyTitle || "Extracted Workflow",
      totalTouchpoints: parsed.totalTouchpoints || parsed.steps?.length || 0,
      steps: (parsed.steps || []).map((s: any) => ({
        stepNumber: s.stepNumber || 0,
        title: s.title || "Untitled Step",
        timing: s.timing || "",
        description: s.description || "",
        messageContent: s.messageContent || "",
        messageType: s.messageType || "marketing"
      })),
      rawDescription: parsed.rawDescription || "",
      brandName: parsed.brandName || "",
      industry: parsed.industry || ""
    };
  } catch (err: any) {
    console.warn(`[WorkflowExtractor] Extraction failed for "${fileName}":`, err.message?.substring(0, 100));
    return { isWorkflow: false, confidence: 0 };
  }
}

/**
 * Classify and process all uploaded client assets.
 * Separates workflow diagrams from product images.
 * Returns classified assets with workflow data extracted from any detected diagrams.
 */
export async function classifyAndExtractAssets(
  assets: Array<{ url: string; name: string; type: "image" | "video" }>
): Promise<{
  workflowAssets: ClassifiedAsset[];
  productAssets: ClassifiedAsset[];
  extractedWorkflow: WorkflowExtractionResult | null;
}> {
  const workflowAssets: ClassifiedAsset[] = [];
  const productAssets: ClassifiedAsset[] = [];
  let extractedWorkflow: WorkflowExtractionResult | null = null;

  // Videos are always product assets
  const imageAssets = assets.filter(a => a.type === "image");
  const videoAssets = assets.filter(a => a.type === "video");

  // Pass through videos as product assets
  for (const v of videoAssets) {
    productAssets.push({ ...v, classification: "product" });
  }

  // If no images, return early
  if (imageAssets.length === 0) {
    return { workflowAssets, productAssets, extractedWorkflow };
  }

  // Classify all images in parallel
  console.log(`[WorkflowExtractor] Classifying ${imageAssets.length} image(s)...`);
  const classificationResults = await Promise.all(
    imageAssets.map(async (asset) => {
      const result = await classifyImage(asset.url, asset.name);
      console.log(`[WorkflowExtractor] "${asset.name}" → ${result.classification} (${(result.confidence * 100).toFixed(0)}%): ${result.reasoning}`);
      return { asset, result };
    })
  );

  // Separate workflow images from product images
  for (const { asset, result } of classificationResults) {
    if (result.classification === "workflow" && result.confidence >= 0.6) {
      workflowAssets.push({
        ...asset,
        classification: "workflow"
      });
    } else {
      productAssets.push({
        ...asset,
        classification: "product"
      });
    }
  }

  // Extract workflow data from the first (highest confidence) workflow image
  if (workflowAssets.length > 0) {
    const primaryWorkflow = workflowAssets[0];
    console.log(`[WorkflowExtractor] Extracting workflow from "${primaryWorkflow.name}"...`);
    extractedWorkflow = await extractWorkflowFromImage(primaryWorkflow.url, primaryWorkflow.name);
    
    if (extractedWorkflow.isWorkflow && extractedWorkflow.steps && extractedWorkflow.steps.length > 0) {
      primaryWorkflow.workflowData = extractedWorkflow;
      console.log(`[WorkflowExtractor] Extracted ${extractedWorkflow.totalTouchpoints} touchpoints: "${extractedWorkflow.journeyTitle}"`);
      
      // If there are additional workflow images, they might be detail views of specific steps
      // For now, we only use the first one as the primary workflow
      if (workflowAssets.length > 1) {
        console.log(`[WorkflowExtractor] Note: ${workflowAssets.length - 1} additional workflow image(s) detected but only using primary`);
      }
    } else {
      // Extraction failed - reclassify as product image
      console.log(`[WorkflowExtractor] Workflow extraction failed for "${primaryWorkflow.name}", treating as product image`);
      primaryWorkflow.classification = "product";
      productAssets.push(primaryWorkflow);
      workflowAssets.splice(0, 1);
      extractedWorkflow = null;
    }
  }

  console.log(`[WorkflowExtractor] Result: ${workflowAssets.length} workflow(s), ${productAssets.length} product image(s)`);
  return { workflowAssets, productAssets, extractedWorkflow };
}

/**
 * Build a workflow context string for the AI prompt.
 * This tells the AI to follow the extracted workflow structure when generating the conversation.
 */
export function buildWorkflowPromptContext(workflow: WorkflowExtractionResult): string {
  if (!workflow.isWorkflow || !workflow.steps || workflow.steps.length === 0) {
    return "";
  }

  let context = `\n\n=== WORKFLOW DIAGRAM DETECTED - BUILD CONVERSATION BASED ON THIS JOURNEY ===`;
  context += `\nThe user uploaded a workflow/journey diagram. You MUST build the WhatsApp conversation to demonstrate this exact journey flow.`;
  context += `\nJourney: "${workflow.journeyTitle}"`;
  if (workflow.brandName) context += `\nBrand: ${workflow.brandName}`;
  if (workflow.industry) context += `\nIndustry: ${workflow.industry}`;
  context += `\nTotal Touchpoints: ${workflow.totalTouchpoints}`;
  context += `\n\nTouchpoint Sequence:`;
  
  for (const step of workflow.steps) {
    context += `\n  ${step.stepNumber}. [${step.timing}] "${step.title}" - ${step.description}`;
    context += `\n     Suggested message: "${step.messageContent}"`;
    context += `\n     Message type: ${step.messageType}`;
  }

  context += `\n\nINSTRUCTIONS FOR BUILDING THE CONVERSATION:`;
  context += `\n- Create a WhatsApp conversation that demonstrates ONE of these touchpoints in full detail (pick the most impactful one, or the first touchpoint if unclear)`;
  context += `\n- The conversation should show the COMPLETE interaction for that touchpoint: business sends message → customer engages → follow-up`;
  context += `\n- Reference the journey context: mention the stage name, timing, and purpose in the conversation`;
  context += `\n- If the journey has 8+ touchpoints, you may combine 2-3 related touchpoints into one rich conversation`;
  context += `\n- Use the suggested message content as inspiration but adapt it to WhatsApp format with interactive elements`;
  context += `\n- Include rich media (images, carousels) relevant to the touchpoint content`;
  context += `\n- The first template message should reference the journey stage (e.g., "Welcome to [Brand]!" for registration, or "Your baby is growing!" for milestone updates)`;
  context += `\n\nIMPORTANT: This is NOT a product image - do NOT use this image in the conversation. Instead, build the conversation BASED ON the workflow described in the image.`;
  context += `\n=== END WORKFLOW CONTEXT ===\n`;

  return context;
}
