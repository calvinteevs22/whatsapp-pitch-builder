import { useState, useMemo, useEffect } from "react";
import { Link } from "wouter";
import { ArrowLeft, Copy, Check, Search, ChevronDown, ChevronRight, ExternalLink, Key, Zap, BookOpen, Code2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ==================== TYPES ====================

interface Template {
  id: string;
  title: string;
  description: string;
  industry: string;
  messageType: string;
  tags: string[];
  flowSteps: string[];
}

interface TemplatesResponse {
  count: number;
  industries: string[];
  messageTypes: string[];
  templates: Template[];
}

// ==================== CODE BLOCK COMPONENT ====================

function CodeBlock({ code, language = "bash" }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group rounded-lg overflow-hidden border border-gray-200 bg-gray-950">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800">
        <span className="text-xs text-gray-400 font-mono">{language}</span>
        <button
          onClick={handleCopy}
          className="text-gray-400 hover:text-white transition-colors flex items-center gap-1 text-xs"
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm leading-relaxed">
        <code className="text-gray-100 font-mono whitespace-pre">{code}</code>
      </pre>
    </div>
  );
}

// ==================== TEMPLATE EXPLORER ====================

function TemplateExplorer() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [industries, setIndustries] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterIndustry, setFilterIndustry] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/v1/templates")
      .then(r => r.json())
      .then((data: TemplatesResponse) => {
        setTemplates(data.templates);
        setIndustries(data.industries);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return templates.filter(t => {
      if (filterIndustry && t.industry !== filterIndustry) return false;
      if (filterType && t.messageType !== filterType) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.tags.some(tag => tag.toLowerCase().includes(q)) ||
          t.id.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [templates, filterIndustry, filterType, search]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search templates by name, tag, or ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 bg-white border-gray-200"
          />
        </div>
        <select
          value={filterIndustry}
          onChange={e => setFilterIndustry(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 min-w-[160px]"
        >
          <option value="">All Industries ({industries.length})</option>
          {industries.map(i => (
            <option key={i} value={i}>{i}</option>
          ))}
        </select>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 min-w-[140px]"
        >
          <option value="">All Types</option>
          <option value="marketing">Marketing</option>
          <option value="utility">Utility</option>
          <option value="authentication">Authentication</option>
        </select>
      </div>

      <p className="text-sm text-gray-500">{filtered.length} template{filtered.length !== 1 ? "s" : ""} found</p>

      {/* Template list */}
      <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
        {filtered.map(t => (
          <div
            key={t.id}
            className="border border-gray-200 rounded-lg bg-white hover:border-emerald-300 transition-colors"
          >
            <button
              onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
              className="w-full text-left px-4 py-3 flex items-start gap-3"
            >
              <div className="pt-0.5">
                {expandedId === t.id ? (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-gray-900 text-sm">{t.title}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    t.messageType === "marketing" ? "bg-blue-50 text-blue-700" :
                    t.messageType === "utility" ? "bg-amber-50 text-amber-700" :
                    "bg-purple-50 text-purple-700"
                  }`}>
                    {t.messageType}
                  </span>
                  <span className="text-xs text-gray-400">{t.industry}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1 line-clamp-1">{t.description}</p>
              </div>
              <code className="text-xs text-gray-400 font-mono shrink-0 hidden sm:block">{t.id}</code>
            </button>

            {expandedId === t.id && (
              <div className="px-4 pb-4 pt-0 border-t border-gray-100 ml-7">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Template ID</p>
                    <code className="text-sm text-emerald-700 bg-emerald-50 px-2 py-1 rounded font-mono">{t.id}</code>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Tags</p>
                    <div className="flex flex-wrap gap-1">
                      {t.tags.map(tag => (
                        <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-xs font-medium text-gray-500 mb-1">Description</p>
                  <p className="text-sm text-gray-700">{t.description}</p>
                </div>
                <div className="mt-3">
                  <p className="text-xs font-medium text-gray-500 mb-1">Flow Steps</p>
                  <div className="flex items-center gap-1 flex-wrap">
                    {t.flowSteps.map((step, i) => (
                      <span key={i} className="flex items-center gap-1">
                        <span className="text-xs bg-gray-50 border border-gray-200 text-gray-700 px-2 py-0.5 rounded">{step}</span>
                        {i < t.flowSteps.length - 1 && <span className="text-gray-300 text-xs">→</span>}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-xs font-medium text-gray-500 mb-2">Example API Call</p>
                  <CodeBlock
                    language="bash"
                    code={`curl -X POST ${window.location.origin}/api/v1/threads/create \\
  -H "Authorization: Bearer pk_YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "My ${t.title} Demo",
    "businessName": "Your Client Name",
    "businessUrl": "https://example.com",
    "templateId": "${t.id}"
  }'`}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ==================== MAIN API DOCS PAGE ====================

export default function ApiDocs() {
  const baseUrl = window.location.origin;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-gray-900">API Documentation</h1>
          </div>
          <Link to="/threads">
            <Button variant="outline" size="sm" className="gap-2">
              <ExternalLink className="w-3 h-3" />
              Open App
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-12">
        {/* Hero */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Code2 className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">WhatsApp Pitch Builder API</h2>
              <p className="text-gray-500">Programmatically create WhatsApp conversation demos for client pitches</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            <div className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 bg-white">
              <Zap className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-gray-900 text-sm">One-Shot Creation</p>
                <p className="text-xs text-gray-500 mt-1">Create a thread, crawl the website, generate AI conversation, and get back a shareable URL — all in one API call</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 bg-white">
              <BookOpen className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-gray-900 text-sm">230+ Templates</p>
                <p className="text-xs text-gray-500 mt-1">Pre-built conversation templates across 15 industries and 3 message types (marketing, utility, authentication)</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 bg-white">
              <Shield className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-gray-900 text-sm">API Key Auth</p>
                <p className="text-xs text-gray-500 mt-1">Secure Bearer token authentication. Generate keys from the app settings. Rate limited to 30 req/min</p>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Start */}
        <section className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            Quick Start
          </h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</span>
              <div>
                <p className="font-medium text-gray-900 text-sm">Generate an API key</p>
                <p className="text-xs text-gray-500">Go to <a href="/threads" className="text-emerald-600 underline">your dashboard</a> → Settings (gear icon) → API Keys → Create New Key</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</span>
              <div>
                <p className="font-medium text-gray-900 text-sm">Browse templates</p>
                <p className="text-xs text-gray-500">Use the template explorer below or call <code className="bg-gray-100 px-1 rounded text-xs">GET /api/v1/templates</code> to find the right template ID</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</span>
              <div>
                <p className="font-medium text-gray-900 text-sm">Create a thread</p>
                <p className="text-xs text-gray-500">Call <code className="bg-gray-100 px-1 rounded text-xs">POST /api/v1/threads/create</code> with the template ID and client details — get back a URL</p>
              </div>
            </div>
          </div>

          <CodeBlock
            language="bash"
            code={`# Create a WhatsApp demo for Nike using the flash sale template
curl -X POST ${baseUrl}/api/v1/threads/create \\
  -H "Authorization: Bearer pk_YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Nike Flash Sale Demo",
    "businessName": "Nike",
    "businessUrl": "https://nike.com",
    "industry": "Retail",
    "templateId": "retail-flash-sale"
  }'

# Response:
# {
#   "success": true,
#   "threadUid": "abc123xyz",
#   "url": "${baseUrl}/builder/abc123xyz",
#   "messageCount": 10,
#   "profileName": "Nike",
#   "industry": "Retail",
#   "messageType": "marketing"
# }`}
          />
        </section>

        {/* Authentication */}
        <section className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Key className="w-5 h-5 text-emerald-500" />
            Authentication
          </h3>
          <p className="text-sm text-gray-600">
            All write endpoints require an API key passed as a Bearer token in the <code className="bg-gray-100 px-1 rounded text-xs">Authorization</code> header.
            The templates listing endpoint is public and does not require authentication.
          </p>
          <CodeBlock
            language="bash"
            code={`# Include this header in all authenticated requests
Authorization: Bearer pk_YOUR_API_KEY`}
          />
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800">
              <strong>Security:</strong> API keys are hashed before storage — the raw key is only shown once at creation.
              If compromised, revoke the key immediately from the dashboard and generate a new one.
            </p>
          </div>
        </section>

        {/* Endpoints */}
        <section className="space-y-6">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Code2 className="w-5 h-5 text-blue-500" />
            Endpoints
          </h3>

          {/* GET /api/v1/templates */}
          <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded">GET</span>
              <code className="text-sm font-mono text-gray-900">/api/v1/templates</code>
              <span className="text-xs text-gray-400 ml-auto">Public — no auth required</span>
            </div>
            <div className="px-5 py-4 space-y-4">
              <p className="text-sm text-gray-600">List all available conversation templates. Supports filtering by industry, message type, and keyword search.</p>

              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Query Parameters</p>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-gray-100">
                      <th className="pb-2 font-medium text-gray-700 w-1/4">Parameter</th>
                      <th className="pb-2 font-medium text-gray-700 w-1/6">Type</th>
                      <th className="pb-2 font-medium text-gray-700">Description</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-600">
                    <tr className="border-b border-gray-50">
                      <td className="py-2"><code className="text-xs bg-gray-100 px-1 rounded">industry</code></td>
                      <td className="py-2 text-xs">string</td>
                      <td className="py-2 text-xs">Filter by industry name (e.g., "E-Commerce", "Healthcare")</td>
                    </tr>
                    <tr className="border-b border-gray-50">
                      <td className="py-2"><code className="text-xs bg-gray-100 px-1 rounded">messageType</code></td>
                      <td className="py-2 text-xs">string</td>
                      <td className="py-2 text-xs">Filter by type: "marketing", "utility", or "authentication"</td>
                    </tr>
                    <tr>
                      <td className="py-2"><code className="text-xs bg-gray-100 px-1 rounded">search</code></td>
                      <td className="py-2 text-xs">string</td>
                      <td className="py-2 text-xs">Keyword search across title, description, and tags</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <CodeBlock
                language="bash"
                code={`# List all healthcare marketing templates
curl "${baseUrl}/api/v1/templates?industry=Healthcare&messageType=marketing"

# Search for templates related to "cart"
curl "${baseUrl}/api/v1/templates?search=cart"`}
              />
            </div>
          </div>

          {/* POST /api/v1/threads/create */}
          <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded">POST</span>
              <code className="text-sm font-mono text-gray-900">/api/v1/threads/create</code>
              <span className="text-xs text-amber-600 ml-auto flex items-center gap-1">
                <Key className="w-3 h-3" /> Auth required
              </span>
            </div>
            <div className="px-5 py-4 space-y-4">
              <p className="text-sm text-gray-600">
                One-shot endpoint: creates a new thread, optionally crawls the business website for real product data,
                generates an AI-powered WhatsApp conversation, and returns the shareable thread URL.
              </p>

              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Request Body (JSON)</p>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-gray-100">
                      <th className="pb-2 font-medium text-gray-700 w-1/4">Field</th>
                      <th className="pb-2 font-medium text-gray-700 w-1/6">Type</th>
                      <th className="pb-2 font-medium text-gray-700 w-1/6">Required</th>
                      <th className="pb-2 font-medium text-gray-700">Description</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-600">
                    <tr className="border-b border-gray-50">
                      <td className="py-2"><code className="text-xs bg-gray-100 px-1 rounded">name</code></td>
                      <td className="py-2 text-xs">string</td>
                      <td className="py-2 text-xs text-red-600 font-medium">Yes</td>
                      <td className="py-2 text-xs">Display name for the thread (e.g., "Nike Spring Campaign")</td>
                    </tr>
                    <tr className="border-b border-gray-50">
                      <td className="py-2"><code className="text-xs bg-gray-100 px-1 rounded">businessName</code></td>
                      <td className="py-2 text-xs">string</td>
                      <td className="py-2 text-xs">No</td>
                      <td className="py-2 text-xs">Client's business name (used in the conversation)</td>
                    </tr>
                    <tr className="border-b border-gray-50">
                      <td className="py-2"><code className="text-xs bg-gray-100 px-1 rounded">businessUrl</code></td>
                      <td className="py-2 text-xs">string</td>
                      <td className="py-2 text-xs">No</td>
                      <td className="py-2 text-xs">Client's website URL — if provided, the AI will crawl it for real product data</td>
                    </tr>
                    <tr className="border-b border-gray-50">
                      <td className="py-2"><code className="text-xs bg-gray-100 px-1 rounded">industry</code></td>
                      <td className="py-2 text-xs">string</td>
                      <td className="py-2 text-xs">No</td>
                      <td className="py-2 text-xs">Industry for context (auto-detected from template if using templateId)</td>
                    </tr>
                    <tr className="border-b border-gray-50">
                      <td className="py-2"><code className="text-xs bg-gray-100 px-1 rounded">messageType</code></td>
                      <td className="py-2 text-xs">string</td>
                      <td className="py-2 text-xs">No</td>
                      <td className="py-2 text-xs">"marketing" (default), "utility", or "authentication"</td>
                    </tr>
                    <tr className="border-b border-gray-50">
                      <td className="py-2"><code className="text-xs bg-gray-100 px-1 rounded">templateId</code></td>
                      <td className="py-2 text-xs">string</td>
                      <td className="py-2 text-xs text-amber-600 font-medium">*</td>
                      <td className="py-2 text-xs">ID of a pre-built template (use GET /api/v1/templates to browse)</td>
                    </tr>
                    <tr>
                      <td className="py-2"><code className="text-xs bg-gray-100 px-1 rounded">prompt</code></td>
                      <td className="py-2 text-xs">string</td>
                      <td className="py-2 text-xs text-amber-600 font-medium">*</td>
                      <td className="py-2 text-xs">Custom prompt for AI generation (use instead of templateId for custom flows)</td>
                    </tr>
                  </tbody>
                </table>
                <p className="text-xs text-gray-400 mt-2">* Either <code className="bg-gray-100 px-1 rounded">templateId</code> or <code className="bg-gray-100 px-1 rounded">prompt</code> is required.</p>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Response (201 Created)</p>
                <CodeBlock
                  language="json"
                  code={`{
  "success": true,
  "threadUid": "abc123xyz",
  "url": "${baseUrl}/builder/abc123xyz",
  "messageCount": 10,
  "profileName": "Nike",
  "industry": "Retail",
  "messageType": "marketing",
  "templateUsed": {
    "id": "retail-flash-sale",
    "title": "Flash Sale Announcement"
  }
}`}
                />
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Error Responses</p>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-gray-100">
                      <th className="pb-2 font-medium text-gray-700 w-1/6">Status</th>
                      <th className="pb-2 font-medium text-gray-700">Description</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-600 text-xs">
                    <tr className="border-b border-gray-50">
                      <td className="py-2"><code className="bg-red-50 text-red-700 px-1 rounded">400</code></td>
                      <td className="py-2">Validation error — missing required fields or invalid templateId</td>
                    </tr>
                    <tr className="border-b border-gray-50">
                      <td className="py-2"><code className="bg-red-50 text-red-700 px-1 rounded">401</code></td>
                      <td className="py-2">Unauthorized — missing or invalid API key</td>
                    </tr>
                    <tr className="border-b border-gray-50">
                      <td className="py-2"><code className="bg-red-50 text-red-700 px-1 rounded">429</code></td>
                      <td className="py-2">Rate limit exceeded — max 30 requests per minute</td>
                    </tr>
                    <tr>
                      <td className="py-2"><code className="bg-red-50 text-red-700 px-1 rounded">500</code></td>
                      <td className="py-2">AI generation failed — try again</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* Usage Examples */}
        <section className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">Usage Examples</h3>

          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Using a template (recommended)</p>
              <CodeBlock
                language="bash"
                code={`curl -X POST ${baseUrl}/api/v1/threads/create \\
  -H "Authorization: Bearer pk_YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Starbucks Loyalty Program",
    "businessName": "Starbucks",
    "businessUrl": "https://starbucks.com",
    "industry": "Food & Beverage",
    "templateId": "food-loyalty-program"
  }'`}
              />
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Using a custom prompt</p>
              <CodeBlock
                language="bash"
                code={`curl -X POST ${baseUrl}/api/v1/threads/create \\
  -H "Authorization: Bearer pk_YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Custom Appointment Flow",
    "businessName": "HealthFirst Clinic",
    "industry": "Healthcare",
    "messageType": "utility",
    "prompt": "Create a WhatsApp flow for booking and confirming medical appointments with reminders and rescheduling options"
  }'`}
              />
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Python example</p>
              <CodeBlock
                language="python"
                code={`import requests

API_KEY = "pk_YOUR_API_KEY"
BASE_URL = "${baseUrl}"

# List templates for a specific industry
templates = requests.get(f"{BASE_URL}/api/v1/templates", params={
    "industry": "E-Commerce",
    "messageType": "marketing"
}).json()

print(f"Found {templates['count']} templates")

# Create a thread using a template
response = requests.post(
    f"{BASE_URL}/api/v1/threads/create",
    headers={"Authorization": f"Bearer {API_KEY}"},
    json={
        "name": "Nike Flash Sale Demo",
        "businessName": "Nike",
        "businessUrl": "https://nike.com",
        "templateId": "ecom-flash-sale"
    }
)

result = response.json()
print(f"Thread created: {result['url']}")`}
              />
            </div>
          </div>
        </section>

        {/* Template Explorer */}
        <section className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-500" />
            Template Explorer
          </h3>
          <p className="text-sm text-gray-600">
            Browse all available templates below. Click any template to see its details and a ready-to-use API call.
          </p>
          <TemplateExplorer />
        </section>

        {/* Rate Limits */}
        <section className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">Rate Limits</h3>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="py-2 font-medium text-gray-700 w-1/3">Rate limit</td>
                  <td className="py-2 text-gray-600">30 requests per minute per API key</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-2 font-medium text-gray-700">Thread creation time</td>
                  <td className="py-2 text-gray-600">10-30 seconds (includes AI generation and optional website crawl)</td>
                </tr>
                <tr>
                  <td className="py-2 font-medium text-gray-700">Template listing</td>
                  <td className="py-2 text-gray-600">No rate limit (public endpoint)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-gray-200 pt-6 pb-8">
          <p className="text-xs text-gray-400 text-center">
            WhatsApp Pitch Builder API v1 — Built for account managers and sales teams
          </p>
        </footer>
      </main>
    </div>
  );
}
