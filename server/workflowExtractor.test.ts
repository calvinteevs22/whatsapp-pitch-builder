import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildWorkflowPromptContext, type WorkflowExtractionResult, type WorkflowStep } from "./workflowExtractor";

// Mock the LLM module to avoid real API calls in tests
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(),
}));

describe("workflowExtractor", () => {
  describe("buildWorkflowPromptContext", () => {
    it("should return empty string for non-workflow results", () => {
      const result: WorkflowExtractionResult = {
        isWorkflow: false,
        confidence: 0,
      };
      expect(buildWorkflowPromptContext(result)).toBe("");
    });

    it("should return empty string when no steps are provided", () => {
      const result: WorkflowExtractionResult = {
        isWorkflow: true,
        confidence: 0.9,
        journeyTitle: "Test Journey",
        totalTouchpoints: 0,
        steps: [],
      };
      expect(buildWorkflowPromptContext(result)).toBe("");
    });

    it("should build a comprehensive prompt context for a valid workflow", () => {
      const steps: WorkflowStep[] = [
        {
          stepNumber: 1,
          title: "Registration",
          timing: "Day 0",
          description: "Welcome message and data collection",
          messageContent: "Welcome to our brand! When is your baby due?",
          messageType: "marketing",
        },
        {
          stepNumber: 2,
          title: "Pregnancy Tips",
          timing: "Weeks 12-36",
          description: "Weekly milestone tips and product recommendations",
          messageContent: "Your baby is growing! Here are tips for week {{week}}",
          messageType: "marketing",
        },
        {
          stepNumber: 3,
          title: "Pre-Birth Prep",
          timing: "2 weeks before due",
          description: "Stock-up offer on newborn diapers",
          messageContent: "Getting ready for baby? Stock up on newborn diapers!",
          messageType: "marketing",
        },
      ];

      const result: WorkflowExtractionResult = {
        isWorkflow: true,
        confidence: 0.95,
        journeyTitle: "Journey Message Flow: 8 Touchpoints",
        totalTouchpoints: 3,
        steps,
        brandName: "Huggies",
        industry: "FMCG",
        rawDescription: "A customer lifecycle journey for baby care products",
      };

      const context = buildWorkflowPromptContext(result);

      // Should contain the workflow header
      expect(context).toContain("WORKFLOW DIAGRAM DETECTED");
      expect(context).toContain("BUILD CONVERSATION BASED ON THIS JOURNEY");

      // Should contain journey metadata
      expect(context).toContain("Journey Message Flow: 8 Touchpoints");
      expect(context).toContain("Brand: Huggies");
      expect(context).toContain("Industry: FMCG");
      expect(context).toContain("Total Touchpoints: 3");

      // Should contain all steps
      expect(context).toContain("Registration");
      expect(context).toContain("Day 0");
      expect(context).toContain("Welcome to our brand!");
      expect(context).toContain("Pregnancy Tips");
      expect(context).toContain("Weeks 12-36");
      expect(context).toContain("Pre-Birth Prep");
      expect(context).toContain("2 weeks before due");

      // Should contain instructions
      expect(context).toContain("INSTRUCTIONS FOR BUILDING THE CONVERSATION");
      expect(context).toContain("This is NOT a product image");
      expect(context).toContain("END WORKFLOW CONTEXT");
    });

    it("should handle workflow without brand name", () => {
      const result: WorkflowExtractionResult = {
        isWorkflow: true,
        confidence: 0.8,
        journeyTitle: "Customer Onboarding Flow",
        totalTouchpoints: 2,
        steps: [
          {
            stepNumber: 1,
            title: "Welcome",
            timing: "Day 0",
            description: "Initial greeting",
            messageContent: "Welcome!",
            messageType: "marketing",
          },
          {
            stepNumber: 2,
            title: "Follow-up",
            timing: "Day 3",
            description: "Check-in message",
            messageContent: "How are you finding our service?",
            messageType: "utility",
          },
        ],
      };

      const context = buildWorkflowPromptContext(result);
      expect(context).toContain("Customer Onboarding Flow");
      expect(context).not.toContain("Brand:");
      expect(context).not.toContain("Industry:");
      expect(context).toContain("Welcome");
      expect(context).toContain("Follow-up");
    });

    it("should include message type for each step", () => {
      const result: WorkflowExtractionResult = {
        isWorkflow: true,
        confidence: 0.9,
        journeyTitle: "Test",
        totalTouchpoints: 1,
        steps: [
          {
            stepNumber: 1,
            title: "Auth Step",
            timing: "Immediate",
            description: "OTP verification",
            messageContent: "Your code is 123456",
            messageType: "authentication",
          },
        ],
      };

      const context = buildWorkflowPromptContext(result);
      expect(context).toContain("Message type: authentication");
    });

    it("should handle a large number of touchpoints", () => {
      const steps: WorkflowStep[] = Array.from({ length: 10 }, (_, i) => ({
        stepNumber: i + 1,
        title: `Stage ${i + 1}`,
        timing: `Day ${i * 7}`,
        description: `Description for stage ${i + 1}`,
        messageContent: `Message for stage ${i + 1}`,
        messageType: "marketing" as const,
      }));

      const result: WorkflowExtractionResult = {
        isWorkflow: true,
        confidence: 0.95,
        journeyTitle: "10-Stage Journey",
        totalTouchpoints: 10,
        steps,
      };

      const context = buildWorkflowPromptContext(result);
      expect(context).toContain("Total Touchpoints: 10");
      expect(context).toContain("Stage 1");
      expect(context).toContain("Stage 10");
      // Should mention combining touchpoints for large journeys
      expect(context).toContain("8+ touchpoints");
    });
  });

  describe("classifyImage (mocked)", () => {
    let classifyImage: typeof import("./workflowExtractor").classifyImage;
    let invokeLLM: ReturnType<typeof vi.fn>;

    beforeEach(async () => {
      vi.resetModules();
      const llmModule = await import("./_core/llm");
      invokeLLM = llmModule.invokeLLM as ReturnType<typeof vi.fn>;
      const module = await import("./workflowExtractor");
      classifyImage = module.classifyImage;
    });

    it("should classify a workflow image correctly", async () => {
      invokeLLM.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify({
              classification: "workflow",
              confidence: 0.95,
              reasoning: "Image contains numbered stages connected by arrows showing a customer journey"
            })
          }
        }]
      });

      const result = await classifyImage("https://example.com/workflow.png", "journey-flow.png");
      expect(result.classification).toBe("workflow");
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    it("should classify a product image correctly", async () => {
      invokeLLM.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify({
              classification: "product",
              confidence: 0.88,
              reasoning: "Image shows a product photograph of a massage chair"
            })
          }
        }]
      });

      const result = await classifyImage("https://example.com/chair.jpg", "massage-chair.jpg");
      expect(result.classification).toBe("product");
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it("should default to product on API error", async () => {
      invokeLLM.mockRejectedValueOnce(new Error("API timeout"));

      const result = await classifyImage("https://example.com/broken.png", "broken.png");
      expect(result.classification).toBe("product");
      expect(result.confidence).toBeLessThan(0.5);
    });

    it("should default to product on empty response", async () => {
      invokeLLM.mockResolvedValueOnce({
        choices: [{ message: { content: null } }]
      });

      const result = await classifyImage("https://example.com/empty.png", "empty.png");
      expect(result.classification).toBe("product");
    });
  });

  describe("extractWorkflowFromImage (mocked)", () => {
    let extractWorkflowFromImage: typeof import("./workflowExtractor").extractWorkflowFromImage;
    let invokeLLM: ReturnType<typeof vi.fn>;

    beforeEach(async () => {
      vi.resetModules();
      const llmModule = await import("./_core/llm");
      invokeLLM = llmModule.invokeLLM as ReturnType<typeof vi.fn>;
      const module = await import("./workflowExtractor");
      extractWorkflowFromImage = module.extractWorkflowFromImage;
    });

    it("should extract workflow steps from a journey diagram", async () => {
      invokeLLM.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify({
              journeyTitle: "Baby Care Journey: 8 Touchpoints",
              totalTouchpoints: 3,
              brandName: "Huggies",
              industry: "FMCG",
              steps: [
                { stepNumber: 1, title: "Registration", timing: "Day 0", description: "Welcome and data collection", messageContent: "Welcome to Huggies MY!", messageType: "marketing" },
                { stepNumber: 2, title: "Pregnancy Tips", timing: "Weeks 12-36", description: "Weekly tips", messageContent: "Your baby milestone update", messageType: "marketing" },
                { stepNumber: 3, title: "Pre-Birth Prep", timing: "2 weeks before due", description: "Stock-up offer", messageContent: "Stock up on diapers!", messageType: "marketing" },
              ],
              rawDescription: "A lifecycle journey for baby care"
            })
          }
        }]
      });

      const result = await extractWorkflowFromImage("https://example.com/flow.png", "flow.png");
      expect(result.isWorkflow).toBe(true);
      expect(result.journeyTitle).toBe("Baby Care Journey: 8 Touchpoints");
      expect(result.totalTouchpoints).toBe(3);
      expect(result.brandName).toBe("Huggies");
      expect(result.steps).toHaveLength(3);
      expect(result.steps![0].title).toBe("Registration");
      expect(result.steps![1].timing).toBe("Weeks 12-36");
    });

    it("should return non-workflow result on API error", async () => {
      invokeLLM.mockRejectedValueOnce(new Error("Vision API failed"));

      const result = await extractWorkflowFromImage("https://example.com/broken.png", "broken.png");
      expect(result.isWorkflow).toBe(false);
      expect(result.confidence).toBe(0);
    });
  });

  describe("classifyAndExtractAssets (mocked)", () => {
    let classifyAndExtractAssets: typeof import("./workflowExtractor").classifyAndExtractAssets;
    let invokeLLM: ReturnType<typeof vi.fn>;

    beforeEach(async () => {
      vi.resetModules();
      const llmModule = await import("./_core/llm");
      invokeLLM = llmModule.invokeLLM as ReturnType<typeof vi.fn>;
      const module = await import("./workflowExtractor");
      classifyAndExtractAssets = module.classifyAndExtractAssets;
    });

    it("should pass through video assets as product assets", async () => {
      const result = await classifyAndExtractAssets([
        { url: "https://example.com/video.mp4", name: "demo.mp4", type: "video" },
      ]);

      expect(result.productAssets).toHaveLength(1);
      expect(result.productAssets[0].classification).toBe("product");
      expect(result.workflowAssets).toHaveLength(0);
      expect(result.extractedWorkflow).toBeNull();
    });

    it("should return empty results for no assets", async () => {
      const result = await classifyAndExtractAssets([]);
      expect(result.productAssets).toHaveLength(0);
      expect(result.workflowAssets).toHaveLength(0);
      expect(result.extractedWorkflow).toBeNull();
    });

    it("should separate workflow and product images", async () => {
      // First call: classify workflow image
      invokeLLM.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify({
              classification: "workflow",
              confidence: 0.95,
              reasoning: "Journey diagram"
            })
          }
        }]
      });
      // Second call: classify product image
      invokeLLM.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify({
              classification: "product",
              confidence: 0.9,
              reasoning: "Product photo"
            })
          }
        }]
      });
      // Third call: extract workflow from the workflow image
      invokeLLM.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify({
              journeyTitle: "Test Journey",
              totalTouchpoints: 2,
              brandName: "TestBrand",
              industry: "Retail",
              steps: [
                { stepNumber: 1, title: "Step 1", timing: "Day 0", description: "First step", messageContent: "Hello!", messageType: "marketing" },
                { stepNumber: 2, title: "Step 2", timing: "Day 7", description: "Second step", messageContent: "Follow up!", messageType: "marketing" },
              ],
              rawDescription: "A test journey"
            })
          }
        }]
      });

      const result = await classifyAndExtractAssets([
        { url: "https://example.com/flow.png", name: "flow.png", type: "image" },
        { url: "https://example.com/product.jpg", name: "product.jpg", type: "image" },
      ]);

      expect(result.workflowAssets).toHaveLength(1);
      expect(result.workflowAssets[0].name).toBe("flow.png");
      expect(result.productAssets).toHaveLength(1);
      expect(result.productAssets[0].name).toBe("product.jpg");
      expect(result.extractedWorkflow).not.toBeNull();
      expect(result.extractedWorkflow!.journeyTitle).toBe("Test Journey");
      expect(result.extractedWorkflow!.steps).toHaveLength(2);
    });

    it("should reclassify as product if workflow extraction fails", async () => {
      // Classify as workflow
      invokeLLM.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify({
              classification: "workflow",
              confidence: 0.7,
              reasoning: "Might be a workflow"
            })
          }
        }]
      });
      // Extraction fails
      invokeLLM.mockRejectedValueOnce(new Error("Extraction failed"));

      const result = await classifyAndExtractAssets([
        { url: "https://example.com/ambiguous.png", name: "ambiguous.png", type: "image" },
      ]);

      // Should be reclassified as product
      expect(result.workflowAssets).toHaveLength(0);
      expect(result.productAssets).toHaveLength(1);
      expect(result.extractedWorkflow).toBeNull();
    });

    it("should skip classification for low-confidence workflow images", async () => {
      // Classify with low confidence
      invokeLLM.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify({
              classification: "workflow",
              confidence: 0.4, // Below 0.6 threshold
              reasoning: "Uncertain"
            })
          }
        }]
      });

      const result = await classifyAndExtractAssets([
        { url: "https://example.com/uncertain.png", name: "uncertain.png", type: "image" },
      ]);

      // Should be treated as product (below confidence threshold)
      expect(result.workflowAssets).toHaveLength(0);
      expect(result.productAssets).toHaveLength(1);
      expect(result.extractedWorkflow).toBeNull();
    });
  });
});
