import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  FolderOpen, Plus, ArrowRight, Loader2, MessageSquare, Clock,
  ShoppingCart, Heart, Utensils, Landmark, Plane, GraduationCap,
  Home, Car, Store, Cpu, Sparkles, Tv, Truck, ShieldCheck, Phone,
} from "lucide-react";
import { INDUSTRIES, MESSAGE_TYPES } from "@shared/types";

const industryIcons: Record<string, any> = {
  "E-Commerce": ShoppingCart,
  "Healthcare": Heart,
  "Food & Beverage": Utensils,
  "Finance & Banking": Landmark,
  "Travel & Hospitality": Plane,
  "Education": GraduationCap,
  "Real Estate": Home,
  "Automotive": Car,
  "Retail": Store,
  "Technology": Cpu,
  "Beauty & Wellness": Sparkles,
  "Entertainment": Tv,
  "Logistics": Truck,
  "Insurance": ShieldCheck,
  "Telecommunications": Phone,
};

function timeAgo(date: Date | string): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function MyThreadsDropdown() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [buildName, setBuildName] = useState("");
  const [buildIndustry, setBuildIndustry] = useState("");
  const [buildType, setBuildType] = useState<string>("marketing");
  const [isCreating, setIsCreating] = useState(false);

  const { data: threads } = trpc.thread.list.useQuery(undefined, {
    enabled: isAuthenticated && open,
  });

  const createThread = trpc.thread.create.useMutation();

  const recentThreads = threads?.slice(0, 5) ?? [];

  const handleCreate = async () => {
    if (!buildName.trim()) {
      toast.error("Please enter a name for your thread");
      return;
    }
    setIsCreating(true);
    try {
      const result = await createThread.mutateAsync({
        name: buildName.trim(),
        industry: buildIndustry || undefined,
        messageType: (buildType as "marketing" | "utility" | "authentication") || "marketing",
      });
      setShowCreateDialog(false);
      setBuildName("");
      setBuildIndustry("");
      setBuildType("marketing");
      setOpen(false);
      navigate(`/builder/${result.uid}`);
    } catch (e) {
      toast.error("Failed to create thread");
    } finally {
      setIsCreating(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2 h-8 text-sm text-muted-foreground hover:text-foreground">
            <FolderOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">My Threads</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-80 p-0" sideOffset={8}>
          <div className="p-3 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">My Threads</h3>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1 text-[#25D366] hover:text-[#1da851]"
                onClick={() => {
                  setOpen(false);
                  setShowCreateDialog(true);
                }}
              >
                <Plus className="w-3 h-3" /> New
              </Button>
            </div>
          </div>

          <div className="max-h-[300px] overflow-y-auto">
            {recentThreads.length === 0 ? (
              <div className="py-8 text-center">
                <MessageSquare className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No threads yet</p>
                <p className="text-[10px] text-muted-foreground/60 mt-0.5">Create one or use a template to get started</p>
              </div>
            ) : (
              recentThreads.map((thread) => {
                const Icon = industryIcons[thread.industry ?? ""] || MessageSquare;
                return (
                  <button
                    key={thread.uid}
                    className="w-full text-left px-3 py-2.5 hover:bg-muted/50 transition-colors border-b last:border-0 flex items-start gap-2.5"
                    onClick={() => {
                      setOpen(false);
                      navigate(`/builder/${thread.uid}`);
                    }}
                  >
                    <div className="w-7 h-7 rounded-md bg-[#25D366]/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-3.5 h-3.5 text-[#25D366]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{thread.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {thread.industry && (
                          <span className="text-[10px] text-muted-foreground">{thread.industry}</span>
                        )}
                        <span className="text-[10px] text-muted-foreground/50">·</span>
                        <Badge
                          variant="secondary"
                          className="text-[9px] h-3.5 px-1"
                          style={{
                            backgroundColor: `${MESSAGE_TYPES[thread.messageType as keyof typeof MESSAGE_TYPES]?.color ?? "#999"}12`,
                            color: MESSAGE_TYPES[thread.messageType as keyof typeof MESSAGE_TYPES]?.color ?? "#999",
                          }}
                        >
                          {MESSAGE_TYPES[thread.messageType as keyof typeof MESSAGE_TYPES]?.label?.replace(" Messages", "") ?? thread.messageType}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Clock className="w-2.5 h-2.5 text-muted-foreground/40" />
                      <span className="text-[10px] text-muted-foreground/60">{timeAgo(thread.updatedAt)}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {recentThreads.length > 0 && (
            <div className="p-2 border-t bg-muted/30">
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-7 text-xs text-muted-foreground hover:text-foreground justify-center"
                onClick={() => {
                  setOpen(false);
                  navigate("/threads");
                }}
              >
                View All Threads <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>

      {/* Create Thread Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#25D366]" />
              Create New Thread
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="build-name">Thread Name</Label>
              <Input
                id="build-name"
                placeholder="e.g., FoodArt Store Marketing Campaign"
                value={buildName}
                onChange={(e) => setBuildName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Industry</Label>
                <Select value={buildIndustry} onValueChange={setBuildIndustry}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map((ind) => (
                      <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Message Type</Label>
                <Select value={buildType} onValueChange={setBuildType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(MESSAGE_TYPES).map(([key, t]) => (
                      <SelectItem key={key} value={key}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              onClick={handleCreate}
              disabled={isCreating || !buildName.trim()}
              className="w-full h-11 bg-[#25D366] hover:bg-[#1da851] text-base"
            >
              {isCreating ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</>
              ) : (
                <><ArrowRight className="w-4 h-4 mr-2" /> Create & Start Building</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
