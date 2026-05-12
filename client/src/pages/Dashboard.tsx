import { useState, useCallback } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";
import {
   Plus, MoreHorizontal, Edit3, Copy, Share2, Trash2, MessageSquare,
   Search, Clock, Sparkles, ArrowRight, Loader2, LogOut, User, BookOpen, Home,
   Save, ChevronDown, ChevronUp, CheckSquare, X, Tag, Calculator, Key, Code2, Eye, EyeOff, Trash, Globe, FolderOpen
} from "lucide-react";
import { INDUSTRIES, MESSAGE_TYPES } from "@shared/types";
import MyThreadsDropdown from "@/components/MyThreadsDropdown";

export default function Dashboard() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [newThreadName, setNewThreadName] = useState("");
  const [newThreadIndustry, setNewThreadIndustry] = useState("");
  const [newThreadType, setNewThreadType] = useState<"marketing" | "utility" | "authentication">("marketing");
  const [renameUid, setRenameUid] = useState<string | null>(null);
  const [renameName, setRenameName] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Multi-select state
  const [selectedUids, setSelectedUids] = useState<Set<string>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [bulkEditDialogOpen, setBulkEditDialogOpen] = useState(false);
  const [bulkIndustry, setBulkIndustry] = useState("");
  const [bulkMessageType, setBulkMessageType] = useState("");

  // API Key management state
  const [apiKeysDialogOpen, setApiKeysDialogOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);

  const { data: apiKeys, refetch: refetchApiKeys } = trpc.apiKey.list.useQuery(undefined, {
    enabled: isAuthenticated && apiKeysDialogOpen,
  });

  const createApiKey = trpc.apiKey.create.useMutation({
    onSuccess: (result) => {
      setNewlyCreatedKey(result.key);
      setNewKeyName("");
      refetchApiKeys();
      toast.success("API key created! Copy it now — it won't be shown again.");
    },
    onError: () => toast.error("Failed to create API key"),
  });

  const revokeApiKey = trpc.apiKey.revoke.useMutation({
    onSuccess: () => {
      refetchApiKeys();
      toast.success("API key revoked");
    },
    onError: () => toast.error("Failed to revoke API key"),
  });

  const { data: threads, isLoading, refetch } = trpc.thread.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: savedTemplates, refetch: refetchTemplates } = trpc.savedTemplate.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const [showTemplates, setShowTemplates] = useState(false);
  const deleteTemplate = trpc.savedTemplate.delete.useMutation({
    onSuccess: () => { refetchTemplates(); toast.success("Template deleted"); },
  });
  const useTemplate = trpc.savedTemplate.useTemplate.useMutation({
    onSuccess: (thread) => {
      refetchTemplates();
      toast.success("Template ready for editing!");
      navigate(`/builder/${thread.uid}`);
    },
  });

  const createThread = trpc.thread.create.useMutation({
    onSuccess: (thread) => {
      toast.success("Thread created!");
      setCreateDialogOpen(false);
      setNewThreadName("");
      navigate(`/builder/${thread.uid}`);
    },
  });

  const deleteThread = trpc.thread.delete.useMutation({
    onSuccess: () => { refetch(); toast.success("Thread deleted"); },
  });

  const duplicateThread = trpc.thread.duplicate.useMutation({
    onSuccess: () => { refetch(); toast.success("Thread duplicated"); },
  });

  const updateThread = trpc.thread.update.useMutation({
    onSuccess: () => { refetch(); setRenameUid(null); toast.success("Thread renamed"); },
  });

  const toggleShare = trpc.thread.toggleShare.useMutation({
    onSuccess: (result) => {
      refetch();
      if (result?.isPublic) {
        const shareUrl = `${window.location.origin}/shared/${result.shareToken}`;
        navigator.clipboard.writeText(shareUrl);
        toast.success("Share link copied to clipboard!");
      } else {
        toast.success("Sharing disabled");
      }
    },
  });

  const bulkDelete = trpc.thread.bulkDelete.useMutation({
    onSuccess: (result) => {
      refetch();
      setSelectedUids(new Set());
      setIsSelectMode(false);
      toast.success(`${result.deleted} thread${result.deleted !== 1 ? "s" : ""} deleted`);
    },
  });

  const bulkUpdate = trpc.thread.bulkUpdate.useMutation({
    onSuccess: (result) => {
      refetch();
      setBulkEditDialogOpen(false);
      setBulkIndustry("");
      setBulkMessageType("");
      toast.success(`${result.updated} thread${result.updated !== 1 ? "s" : ""} updated`);
    },
  });

  const toggleSelect = useCallback((uid: string) => {
    setSelectedUids(prev => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (!filteredThreads) return;
    if (selectedUids.size === filteredThreads.length) {
      setSelectedUids(new Set());
    } else {
      setSelectedUids(new Set(filteredThreads.map(t => t.uid)));
    }
  }, [selectedUids.size]);

  const exitSelectMode = useCallback(() => {
    setIsSelectMode(false);
    setSelectedUids(new Set());
  }, []);

  const handleBulkDelete = () => {
    if (selectedUids.size === 0) return;
    if (confirm(`Delete ${selectedUids.size} thread${selectedUids.size !== 1 ? "s" : ""}? This cannot be undone.`)) {
      bulkDelete.mutate({ uids: Array.from(selectedUids) });
    }
  };

  const handleBulkEdit = () => {
    if (selectedUids.size === 0) return;
    const updates: any = {};
    if (bulkIndustry) updates.industry = bulkIndustry;
    if (bulkMessageType) updates.messageType = bulkMessageType;
    if (!updates.industry && !updates.messageType) {
      toast.error("Select at least one field to update");
      return;
    }
    bulkUpdate.mutate({ uids: Array.from(selectedUids), ...updates });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#25D366]" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#075E54]/5 to-[#25D366]/5">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#25D366]/10 flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-[#25D366]" />
            </div>
            <h2 className="text-xl font-bold mb-2">Sign in to continue</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Create and manage your WhatsApp conversation flows
            </p>
            <Button asChild className="w-full bg-[#25D366] hover:bg-[#1da851]">
              <a href={getLoginUrl()}>Sign In</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredThreads = threads?.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.businessName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.industry?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleCreate = () => {
    if (!newThreadName.trim()) {
      toast.error("Please enter a thread name");
      return;
    }
    createThread.mutate({
      name: newThreadName,
      industry: newThreadIndustry || undefined,
      messageType: newThreadType,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="sticky top-0 z-50 bg-white/85 backdrop-blur-xl border-b">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate("/")}>
              <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663344446488/YocM5kPJZcUQjCCGhq86Jj/whatsapp-logo_55bb387d.png" alt="WhatsApp" className="w-7 h-7" />
              <span className="font-semibold text-[15px] tracking-tight hidden sm:inline">WhatsApp Pitch Builder</span>
            </div>
            <div className="h-5 w-px bg-border hidden sm:block" />
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className="text-sm text-[#25D366] font-medium h-8 bg-[#25D366]/5">
                <FolderOpen className="w-3.5 h-3.5 mr-1.5" /> My Threads
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate("/templates")} className="text-sm text-muted-foreground hover:text-foreground h-8">
                <BookOpen className="w-3.5 h-3.5 mr-1.5" /> Industry Templates
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate("/roi-calculator")} className="text-sm text-muted-foreground hover:text-foreground h-8">
                <Calculator className="w-3.5 h-3.5 mr-1.5" /> ROI Calculator
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 h-8">
                  <div className="w-6 h-6 rounded-full bg-[#25D366]/10 flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-[#25D366]" />
                  </div>
                  <span className="text-sm hidden sm:inline">{user?.name || "User"}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setApiKeysDialogOpen(true)}>
                  <Key className="w-4 h-4 mr-2" /> API Keys
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/api-docs")}>
                  <Globe className="w-4 h-4 mr-2" /> API Docs
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => { logout(); navigate("/"); }}>
                  <LogOut className="w-4 h-4 mr-2" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>

      <div className="container py-8 max-w-4xl">
        {/* Top section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">My Threads</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {filteredThreads.length} conversation {filteredThreads.length === 1 ? "flow" : "flows"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isSelectMode && filteredThreads.length > 0 && (
              <Button variant="outline" size="sm" onClick={() => setIsSelectMode(true)} className="h-8">
                <CheckSquare className="w-4 h-4 mr-1.5" /> Select
              </Button>
            )}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#25D366] hover:bg-[#1da851]">
                  <Plus className="w-4 h-4 mr-1.5" /> New Thread
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Thread</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Thread Name</label>
                    <Input
                      value={newThreadName}
                      onChange={e => setNewThreadName(e.target.value)}
                      placeholder="e.g., FoodArt Store Marketing Campaign"
                      onKeyDown={e => e.key === "Enter" && handleCreate()}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Message Type</label>
                    <Select value={newThreadType} onValueChange={(v) => setNewThreadType(v as any)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="marketing">Marketing Messages</SelectItem>
                        <SelectItem value="utility">Utility Messages</SelectItem>
                        <SelectItem value="authentication">Authentication Messages</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      {MESSAGE_TYPES[newThreadType].description}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Industry (Optional)</label>
                    <Select value={newThreadIndustry} onValueChange={setNewThreadIndustry}>
                      <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
                      <SelectContent>
                        {INDUSTRIES.map(ind => (
                          <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleCreate} disabled={createThread.isPending} className="w-full bg-[#25D366] hover:bg-[#1da851]">
                    {createThread.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-2" />
                    )}
                    Create Thread
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Multi-select action bar */}
        {isSelectMode && (
          <div className="mb-4 p-3 rounded-lg bg-primary/5 border border-primary/20 flex items-center justify-between gap-3 animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={selectedUids.size === filteredThreads.length && filteredThreads.length > 0}
                onCheckedChange={selectAll}
                className="data-[state=checked]:bg-[#25D366] data-[state=checked]:border-[#25D366]"
              />
              <span className="text-sm font-medium">
                {selectedUids.size === 0
                  ? "Select threads"
                  : `${selectedUids.size} selected`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                disabled={selectedUids.size === 0}
                onClick={() => setBulkEditDialogOpen(true)}
              >
                <Tag className="w-3 h-3 mr-1" /> Edit Tags
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                disabled={selectedUids.size === 0 || bulkDelete.isPending}
                onClick={handleBulkDelete}
              >
                {bulkDelete.isPending ? (
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                ) : (
                  <Trash2 className="w-3 h-3 mr-1" />
                )}
                Delete
              </Button>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={exitSelectMode}>
                <X className="w-3 h-3 mr-1" /> Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Bulk Edit Dialog */}
        <Dialog open={bulkEditDialogOpen} onOpenChange={setBulkEditDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit {selectedUids.size} Thread{selectedUids.size !== 1 ? "s" : ""}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Change Industry</label>
                <Select value={bulkIndustry} onValueChange={setBulkIndustry}>
                  <SelectTrigger><SelectValue placeholder="Keep current industry" /></SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map(ind => (
                      <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Change Message Type</label>
                <Select value={bulkMessageType} onValueChange={setBulkMessageType}>
                  <SelectTrigger><SelectValue placeholder="Keep current type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="marketing">Marketing Messages</SelectItem>
                    <SelectItem value="utility">Utility Messages</SelectItem>
                    <SelectItem value="authentication">Authentication Messages</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleBulkEdit}
                disabled={bulkUpdate.isPending || (!bulkIndustry && !bulkMessageType)}
                className="w-full bg-[#25D366] hover:bg-[#1da851]"
              >
                {bulkUpdate.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckSquare className="w-4 h-4 mr-2" />
                )}
                Apply to {selectedUids.size} Thread{selectedUids.size !== 1 ? "s" : ""}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Search */}
        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search threads..."
            className="pl-9"
          />
        </div>

        {/* My Saved Templates Section */}
        {savedTemplates && savedTemplates.length > 0 && (
          <div className="mb-6">
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="flex items-center gap-2 text-sm font-semibold text-amber-700 hover:text-amber-900 transition-colors mb-3"
            >
              <Save className="w-4 h-4" />
              My Saved Templates ({savedTemplates.length})
              {showTemplates ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showTemplates && (
              <div className="grid gap-2 mb-4">
                {savedTemplates.map((template: any) => (
                  <Card
                    key={template.id}
                    className="group border-amber-200 bg-amber-50/50 hover:bg-amber-50 hover:border-amber-300 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => {
                      if (template.sourceThreadUid) {
                        navigate(`/builder/${template.sourceThreadUid}`);
                      } else {
                        useTemplate.mutate({ templateId: template.id });
                      }
                    }}
                  >
                    <CardContent className="py-3 px-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                            <Save className="w-5 h-5 text-amber-600" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-sm truncate">{template.name}</h3>
                              <Badge variant="secondary" className="text-[9px] h-4 bg-amber-100 text-amber-700 border-amber-200 shrink-0">
                                Saved Template
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              {template.industry && (
                                <Badge variant="outline" className="text-[10px] h-4 border-amber-200 text-amber-600">{template.industry}</Badge>
                              )}
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(template.updatedAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                          <Button
                            size="sm"
                            className="h-7 text-xs bg-amber-500 hover:bg-amber-600 text-white"
                            onClick={() => {
                              if (template.sourceThreadUid) {
                                navigate(`/builder/${template.sourceThreadUid}`);
                              } else {
                                useTemplate.mutate({ templateId: template.id });
                              }
                            }}
                            disabled={useTemplate.isPending}
                          >
                            {useTemplate.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Edit3 className="w-3 h-3 mr-1" />}
                            Edit
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
                                <MoreHorizontal className="w-3.5 h-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => useTemplate.mutate({ templateId: template.id })}>
                                <Copy className="w-4 h-4 mr-2" /> Create Copy
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => {
                                  if (confirm("Delete this saved template?")) deleteTemplate.mutate({ id: template.id });
                                }}
                              >
                                <Trash2 className="w-4 h-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Thread list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-[#25D366]" />
          </div>
        ) : filteredThreads.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-7 h-7 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-1">
                {searchQuery ? "No threads found" : "No threads yet"}
              </h3>
              <p className="text-sm text-muted-foreground mb-5">
                {searchQuery
                  ? "Try a different search term"
                  : "Create your first WhatsApp conversation flow or start from a template"}
              </p>
              {!searchQuery && (
                <div className="flex items-center justify-center gap-3">
                  <Button onClick={() => setCreateDialogOpen(true)} className="bg-[#25D366] hover:bg-[#1da851]">
                    <Plus className="w-4 h-4 mr-1.5" /> Create Thread
                  </Button>
                  <Button variant="outline" onClick={() => navigate("/templates")}>
                    <BookOpen className="w-4 h-4 mr-1.5" /> Browse Templates
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-2">
            {filteredThreads.map(thread => {
              const isSelected = selectedUids.has(thread.uid);
              const typeColor = thread.messageType === "marketing" ? "#25D366" :
                thread.messageType === "utility" ? "#34B7F1" : "#fb923c";
              return (
                <div
                  key={thread.uid}
                  className={`group relative flex items-center gap-0 rounded-xl border bg-card hover:shadow-md transition-all cursor-pointer overflow-hidden ${
                    isSelected ? "border-[#25D366] shadow-sm ring-1 ring-[#25D366]/20" : "border-border hover:border-border/80"
                  }`}
                  onClick={() => {
                    if (isSelectMode) {
                      toggleSelect(thread.uid);
                    } else {
                      navigate(`/builder/${thread.uid}`);
                    }
                  }}
                >
                  {/* Colored left accent bar */}
                  {!isSelectMode && (
                    <div className="w-1 self-stretch shrink-0 rounded-l-xl" style={{ backgroundColor: typeColor }} />
                  )}
                  <div className="flex items-center justify-between flex-1 py-3.5 px-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {isSelectMode ? (
                        <div className="shrink-0" onClick={e => e.stopPropagation()}>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSelect(thread.uid)}
                            className="data-[state=checked]:bg-[#25D366] data-[state=checked]:border-[#25D366]"
                          />
                        </div>
                      ) : (
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${typeColor}12` }}>
                          <MessageSquare className="w-4.5 h-4.5" style={{ color: typeColor }} />
                        </div>
                      )}
                      <div className="min-w-0">
                        {renameUid === thread.uid ? (
                          <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                            <Input
                              value={renameName}
                              onChange={e => setRenameName(e.target.value)}
                              className="h-7 text-sm"
                              autoFocus
                              onKeyDown={e => {
                                if (e.key === "Enter") updateThread.mutate({ uid: thread.uid, name: renameName });
                                if (e.key === "Escape") setRenameUid(null);
                              }}
                            />
                            <Button size="sm" className="h-7" onClick={() => updateThread.mutate({ uid: thread.uid, name: renameName })}>
                              Save
                            </Button>
                          </div>
                        ) : (
                          <h3 className="font-medium text-sm truncate">{thread.name}</h3>
                        )}
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span
                            className="inline-flex items-center text-[10px] font-medium h-4 px-1.5 rounded-full"
                            style={{ backgroundColor: `${typeColor}15`, color: typeColor }}
                          >
                            {MESSAGE_TYPES[thread.messageType].label}
                          </span>
                          {thread.industry && (
                            <span className="inline-flex items-center text-[10px] text-muted-foreground h-4 px-1.5 rounded-full bg-muted border border-border/60">
                              {thread.industry}
                            </span>
                          )}
                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {new Date(thread.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {!isSelectMode && (
                      <div className="flex items-center gap-1 ml-2" onClick={e => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity h-8 text-muted-foreground hover:text-foreground">
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setRenameUid(thread.uid); setRenameName(thread.name); }}>
                              <Edit3 className="w-4 h-4 mr-2" /> Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => duplicateThread.mutate({ uid: thread.uid })}>
                              <Copy className="w-4 h-4 mr-2" /> Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleShare.mutate({ uid: thread.uid })}>
                              <Share2 className="w-4 h-4 mr-2" />
                              {thread.isPublic ? "Disable Sharing" : "Share"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                if (confirm("Delete this thread?")) deleteThread.mutate({ uid: thread.uid });
                              }}
                            >
                              <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* API Keys Management Dialog */}
      <Dialog open={apiKeysDialogOpen} onOpenChange={(open) => { setApiKeysDialogOpen(open); if (!open) { setNewlyCreatedKey(null); setShowKey(false); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="w-5 h-5 text-[#25D366]" />
              API Keys
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              API keys allow external tools (Claude Code, MyClaw) to create threads programmatically.
              <a href="/api-docs" className="text-[#25D366] ml-1 underline" onClick={() => setApiKeysDialogOpen(false)}>View API docs →</a>
            </p>

            {/* Create new key */}
            <div className="flex gap-2">
              <Input
                placeholder="Key name (e.g., Claude Code)"
                value={newKeyName}
                onChange={e => setNewKeyName(e.target.value)}
                className="flex-1"
                onKeyDown={e => { if (e.key === "Enter" && newKeyName.trim()) createApiKey.mutate({ name: newKeyName.trim() }); }}
              />
              <Button
                onClick={() => createApiKey.mutate({ name: newKeyName.trim() })}
                disabled={!newKeyName.trim() || createApiKey.isPending}
                className="bg-[#25D366] hover:bg-[#1da851] text-white shrink-0"
                size="sm"
              >
                {createApiKey.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Create
              </Button>
            </div>

            {/* Newly created key (show once) */}
            {newlyCreatedKey && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 space-y-2">
                <p className="text-xs font-medium text-emerald-800">🔑 New API key created — copy it now, it won't be shown again!</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-white border border-emerald-200 rounded px-2 py-1.5 font-mono select-all overflow-hidden">
                    {showKey ? newlyCreatedKey : "pk_" + "•".repeat(36)}
                  </code>
                  <Button variant="ghost" size="sm" onClick={() => setShowKey(!showKey)} className="shrink-0 h-8 w-8 p-0">
                    {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 h-8 w-8 p-0"
                    onClick={() => { navigator.clipboard.writeText(newlyCreatedKey); toast.success("API key copied!"); }}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            )}

            {/* Existing keys */}
            <div className="space-y-2">
              {apiKeys && apiKeys.length > 0 ? (
                apiKeys.map((k: any) => (
                  <div key={k.id} className="flex items-center justify-between p-3 rounded-lg border bg-white">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{k.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <code className="text-xs text-muted-foreground font-mono">{k.keyPrefix}•••</code>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground">
                          {k.lastUsedAt ? `Last used ${new Date(k.lastUsedAt).toLocaleDateString()}` : "Never used"}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0 h-8 w-8 p-0"
                      onClick={() => { if (confirm("Revoke this API key? Any integrations using it will stop working.")) revokeApiKey.mutate({ id: k.id }); }}
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No API keys yet. Create one to get started.</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
