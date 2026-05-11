import { useEffect, useState, useRef } from "react";
import { useLocation, useSearch } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Loader2, Sparkles, CheckCircle2, AlertCircle, ExternalLink, ArrowRight, ImageIcon, XCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TEMPLATE_CATALOG } from "@shared/templateCatalog";
import { INDUSTRIES, MESSAGE_TYPES } from "@shared/types";

/**
 * QuickCreate — URL-based thread creation
 * 
 * Reads query params from the URL, shows a preview of what will be created,
 * and lets the user review before creating the thread.
 * 
 * URL format:
 *   /create?name=...&template=...&prompt=...&businessName=...&businessUrl=...&industry=...&messageType=...&imageUrl=...
 * 
 * All params are optional except either `template` or `prompt`.
 */
export default function QuickCreate() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const hasStarted = useRef(false);

  // Parse query params
  const templateId = params.get("template") || "";
  const prompt = params.get("prompt") || "";
  const name = params.get("name") || "";
  const businessName = params.get("businessName") || "";
  const businessUrl = params.get("businessUrl") || "";
  const industry = params.get("industry") || "";
  const messageType = (params.get("messageType") as "marketing" | "utility" | "authentication") || "marketing";
  const imageUrl = params.get("imageUrl") || "";

  // Resolve template
  const template = templateId ? TEMPLATE_CATALOG.find(t => t.id === templateId) : null;
  const resolvedPrompt = template ? template.prompt : prompt;
  const resolvedIndustry = industry || (template ? template.industry : "");
  const resolvedMessageType = messageType || (template ? template.messageType : "marketing");
  const resolvedName = name || (template ? `${businessName || "Demo"} — ${template.title}` : (businessName ? `${businessName} Thread` : "New Thread"));

  // Validation
  const hasValidInput = !!(templateId || prompt);
  const templateNotFound = templateId && !template;

  const [status, setStatus] = useState<"preview" | "creating" | "done" | "error">("preview");
  const [errorMsg, setErrorMsg] = useState("");
  const [createdUrl, setCreatedUrl] = useState("");

  // Image accessibility check
  const [imageStatus, setImageStatus] = useState<"checking" | "accessible" | "inaccessible" | "none">(imageUrl ? "checking" : "none");

  useEffect(() => {
    if (!imageUrl) {
      setImageStatus("none");
      return;
    }
    setImageStatus("checking");
    const img = new Image();
    img.onload = () => setImageStatus("accessible");
    img.onerror = () => setImageStatus("inaccessible");
    img.src = imageUrl;
  }, [imageUrl]);

  const createThread = trpc.thread.create.useMutation();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      // Preserve the full URL so user comes back after login
      window.location.href = getLoginUrl();
    }
  }, [authLoading, user]);

  const handleCreate = async () => {
    if (hasStarted.current) return;
    hasStarted.current = true;
    setStatus("creating");

    try {
      const thread = await createThread.mutateAsync({
        name: resolvedName,
        industry: resolvedIndustry || undefined,
        messageType: resolvedMessageType,
        businessUrl: businessUrl || undefined,
      });

      // Build the builder URL with pre-fill params
      const builderParams = new URLSearchParams();
      if (resolvedPrompt) builderParams.set("prompt", resolvedPrompt);
      if (businessName) builderParams.set("businessName", businessName);
      if (businessUrl) builderParams.set("businessUrl", businessUrl);
      if (imageUrl) builderParams.set("imageUrl", imageUrl);
      builderParams.set("autoGenerate", "true");

      const builderUrl = `/builder/${thread.uid}?${builderParams.toString()}`;
      setCreatedUrl(builderUrl);
      setStatus("done");

      // Auto-navigate to builder
      navigate(builderUrl);
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err?.message || "Failed to create thread");
      hasStarted.current = false;
    }
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#25D366] mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#25D366] mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-[#25D366]/10 text-[#25D366] px-3 py-1 rounded-full text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            Quick Create
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Create WhatsApp Thread
          </h1>
          <p className="text-sm text-muted-foreground">
            Review the details below and click Create to generate your thread
          </p>
        </div>

        {/* Validation Errors */}
        {!hasValidInput && (
          <Card className="border-amber-200 bg-amber-50 mb-6">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Missing required parameter</p>
                  <p className="text-xs text-amber-700 mt-1">
                    Either <code className="bg-amber-100 px-1 rounded">template</code> or <code className="bg-amber-100 px-1 rounded">prompt</code> is required in the URL.
                  </p>
                  <p className="text-xs text-amber-700 mt-2">
                    Example: <code className="bg-amber-100 px-1 rounded text-[10px]">/create?template=retail-flash-sale&businessName=Nike</code>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {templateNotFound && (
          <Card className="border-red-200 bg-red-50 mb-6">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-800">Template not found</p>
                  <p className="text-xs text-red-700 mt-1">
                    Template ID <code className="bg-red-100 px-1 rounded">{templateId}</code> does not exist.
                    Browse available templates at <a href="/api/v1/templates" className="underline">/api/v1/templates</a>.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Preview Card */}
        <Card className="mb-6">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Thread Details</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Thread Name</label>
                <p className="text-sm font-medium text-gray-900">{resolvedName || "—"}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Message Type</label>
                <Badge
                  variant="secondary"
                  style={{ backgroundColor: MESSAGE_TYPES[resolvedMessageType]?.color + "20", color: MESSAGE_TYPES[resolvedMessageType]?.color }}
                >
                  {MESSAGE_TYPES[resolvedMessageType]?.label || resolvedMessageType}
                </Badge>
              </div>
              {businessName && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Business Name</label>
                  <p className="text-sm text-gray-900">{businessName}</p>
                </div>
              )}
              {resolvedIndustry && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Industry</label>
                  <p className="text-sm text-gray-900">{resolvedIndustry}</p>
                </div>
              )}
              {businessUrl && (
                <div className="col-span-2">
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Business Website</label>
                  <a href={businessUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                    {businessUrl} <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
              {imageUrl && (
                <div className="col-span-2">
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Business Profile Image</label>
                  <div className="mt-1 flex items-start gap-4">
                    {/* Image preview */}
                    <div className="w-16 h-16 rounded-lg border bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
                      {imageStatus === "checking" && (
                        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                      )}
                      {imageStatus === "accessible" && (
                        <img src={imageUrl} alt="Business profile" className="w-full h-full object-contain" />
                      )}
                      {imageStatus === "inaccessible" && (
                        <ImageIcon className="w-5 h-5 text-red-400" />
                      )}
                    </div>
                    {/* Status + URL */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        {imageStatus === "checking" && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" /> Checking image...
                          </span>
                        )}
                        {imageStatus === "accessible" && (
                          <span className="text-xs text-green-600 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Image accessible
                          </span>
                        )}
                        {imageStatus === "inaccessible" && (
                          <span className="text-xs text-red-600 flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> Image not accessible
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400 break-all leading-tight">{imageUrl}</p>
                    </div>
                  </div>
                  {imageStatus === "inaccessible" && (
                    <div className="mt-2 bg-red-50 border border-red-200 rounded-md p-2">
                      <p className="text-xs text-red-700">
                        The image URL could not be loaded. The thread will be created without a profile image. 
                        Please verify the URL is publicly accessible and try again.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {template && (
              <div className="border-t pt-4 mt-4">
                <label className="text-xs font-medium text-muted-foreground block mb-1">Template</label>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">{template.id}</Badge>
                  <span className="text-sm font-medium text-gray-900">{template.title}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
              </div>
            )}

            {!template && prompt && (
              <div className="border-t pt-4 mt-4">
                <label className="text-xs font-medium text-muted-foreground block mb-1">Custom Prompt</label>
                <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{prompt}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {status === "preview" && hasValidInput && !templateNotFound && (
            <Button
              onClick={handleCreate}
              className="flex-1 bg-[#25D366] hover:bg-[#1da851] h-12 text-base"
              size="lg"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Create & Generate Thread
            </Button>
          )}

          {status === "creating" && (
            <Button disabled className="flex-1 h-12 text-base" size="lg">
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Creating thread & generating flow...
            </Button>
          )}

          {status === "done" && (
            <Button
              onClick={() => navigate(createdUrl)}
              className="flex-1 bg-[#25D366] hover:bg-[#1da851] h-12 text-base"
              size="lg"
            >
              <CheckCircle2 className="w-5 h-5 mr-2" />
              Thread Created — Open Builder
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}

          {status === "error" && (
            <div className="flex-1 space-y-3">
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-red-800">Failed to create thread</p>
                      <p className="text-xs text-red-700 mt-1">{errorMsg}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Button
                onClick={() => { setStatus("preview"); }}
                variant="outline"
                className="w-full"
              >
                Try Again
              </Button>
            </div>
          )}
        </div>

        {/* Help text */}
        <p className="text-xs text-center text-muted-foreground mt-6">
          After creation, you'll be taken to the builder where the AI will auto-generate the conversation flow.
          You can edit any message before sharing.
        </p>
      </div>
    </div>
  );
}
