import { useState } from "react";
import { useParams, Link } from "wouter";
import {
  useGetTemplate, useListTemplateVersions, useListTemplateComments,
  useDownloadTemplate, useAddFavorite, useRemoveFavorite, useRateTemplate,
  useCreateComment, getListTemplateCommentsQueryKey, getGetTemplateQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import {
  Download, Copy, Heart, Star, ArrowLeft, Clock, Tag, User, Code2,
  BookOpen, AlertCircle, History, MessageSquare, CheckCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          onClick={() => onChange?.(s)}
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          className="transition-transform hover:scale-110"
        >
          <Star className={cn("w-4 h-4 transition-colors", (hovered || value) >= s ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")} />
        </button>
      ))}
    </div>
  );
}

export default function TemplateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const templateId = parseInt(id);
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [comment, setComment] = useState("");
  const [userRating, setUserRating] = useState(0);

  const { data: template, isLoading } = useGetTemplate(templateId);
  const { data: versions } = useListTemplateVersions(templateId);
  const { data: comments } = useListTemplateComments(templateId);

  const addFav = useAddFavorite();
  const removeFav = useRemoveFavorite();
  const download = useDownloadTemplate();
  const rate = useRateTemplate();
  const postComment = useCreateComment();

  const handleCopy = () => {
    if (!template?.code) return;
    navigator.clipboard.writeText(template.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied to clipboard" });
  };

  const handleDownload = () => {
    download.mutate({ id: templateId }, {
      onSuccess: (data) => {
        const blob = new Blob([data.code], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = data.filename; a.click();
        URL.revokeObjectURL(url);
        toast({ title: "Downloaded!", description: data.filename });
        qc.invalidateQueries({ queryKey: getGetTemplateQueryKey(templateId) });
      },
    });
  };

  const handleFavorite = () => {
    if (!isAuthenticated) { toast({ title: "Login required" }); return; }
    if (template?.isFavorited) {
      removeFav.mutate({ templateId }, {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getGetTemplateQueryKey(templateId) });
          toast({ title: "Removed from favorites" });
        },
      });
    } else {
      addFav.mutate({ templateId }, {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getGetTemplateQueryKey(templateId) });
          toast({ title: "Added to favorites" });
        },
      });
    }
  };

  const handleRate = (score: number) => {
    if (!isAuthenticated) { toast({ title: "Login required" }); return; }
    setUserRating(score);
    rate.mutate({ templateId, data: { score } }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetTemplateQueryKey(templateId) });
        toast({ title: `Rated ${score}/5 stars` });
      },
    });
  };

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || !isAuthenticated) return;
    postComment.mutate({ id: templateId, data: { content: comment } }, {
      onSuccess: () => {
        setComment("");
        qc.invalidateQueries({ queryKey: getListTemplateCommentsQueryKey(templateId) });
        toast({ title: "Comment posted" });
      },
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4 mb-6" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Template not found</p>
        <Link href="/browse"><Button variant="outline" size="sm" className="mt-3">Back to browse</Button></Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Back */}
      <Link href="/browse" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" />Back to browse
      </Link>

      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge variant="secondary" className="text-[11px]">{template.categoryName}</Badge>
            {template.complexity && <Badge variant="outline" className="text-[11px] capitalize">{template.complexity}</Badge>}
            <span className="text-xs text-muted-foreground font-mono">v{template.version}</span>
          </div>
          <h1 className="text-xl font-bold text-foreground mb-1">{template.title}</h1>
          <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              <span>{template.authorName}</span>
            </div>
            <div className="flex items-center gap-1">
              <Download className="w-3.5 h-3.5" />
              <span>{template.downloads.toLocaleString()} downloads</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
              <span>{template.averageRating.toFixed(1)} ({template.ratingCount} ratings)</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatDistanceToNow(new Date(template.updatedAt))} ago</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 shrink-0">
          <Button onClick={handleDownload} disabled={download.isPending} className="gap-2">
            <Download className="w-4 h-4" />Download
          </Button>
          <Button variant="outline" onClick={handleCopy} className="gap-2">
            {copied ? <CheckCheck className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied!" : "Copy Code"}
          </Button>
          <Button
            variant="outline"
            onClick={handleFavorite}
            className={cn("gap-2", template.isFavorited && "text-red-400 border-red-400/30")}
          >
            <Heart className={cn("w-4 h-4", template.isFavorited && "fill-current")} />
            {template.isFavorited ? "Saved" : "Save"}
          </Button>
        </div>
      </div>

      {/* Tags */}
      {template.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-6">
          {template.tags.map((tag) => (
            <span key={tag} className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground border border-border/50">
              <Tag className="w-2.5 h-2.5" />{tag}
            </span>
          ))}
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="code" className="space-y-4">
        <TabsList className="h-8">
          <TabsTrigger value="code" className="text-xs gap-1.5"><Code2 className="w-3.5 h-3.5" />Code</TabsTrigger>
          <TabsTrigger value="docs" className="text-xs gap-1.5"><BookOpen className="w-3.5 h-3.5" />Docs</TabsTrigger>
          <TabsTrigger value="usage" className="text-xs gap-1.5"><AlertCircle className="w-3.5 h-3.5" />Usage</TabsTrigger>
          <TabsTrigger value="versions" className="text-xs gap-1.5"><History className="w-3.5 h-3.5" />History</TabsTrigger>
          <TabsTrigger value="comments" className="text-xs gap-1.5"><MessageSquare className="w-3.5 h-3.5" />Comments ({comments?.length ?? 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="code">
          <div className="relative rounded-lg overflow-hidden border border-border">
            <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400/60" />
                </div>
                <span className="text-[11px] text-muted-foreground font-mono">{template.language || "text"}</span>
              </div>
              <button onClick={handleCopy} className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                {copied ? <CheckCheck className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className="p-4 overflow-x-auto text-xs font-mono bg-black/20 text-foreground leading-relaxed max-h-[480px] overflow-y-auto">
              <code>{template.code}</code>
            </pre>
          </div>
        </TabsContent>

        <TabsContent value="docs">
          <div className="prose prose-sm dark:prose-invert max-w-none border border-border rounded-lg p-6 bg-card">
            {template.documentation ? (
              <div className="whitespace-pre-wrap text-sm text-foreground/90 leading-relaxed">{template.documentation}</div>
            ) : (
              <p className="text-muted-foreground text-sm">No documentation provided.</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="usage">
          <div className="space-y-4">
            {template.prerequisites && (
              <div className="border border-border rounded-lg p-4 bg-card">
                <h3 className="text-sm font-semibold mb-2">Prerequisites</h3>
                <div className="whitespace-pre-wrap text-sm text-muted-foreground">{template.prerequisites}</div>
              </div>
            )}
            {template.usageExample && (
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="px-4 py-2 bg-muted/50 border-b border-border">
                  <span className="text-xs font-medium">Example Usage</span>
                </div>
                <pre className="p-4 text-xs font-mono bg-black/20 text-foreground overflow-x-auto">
                  <code>{template.usageExample}</code>
                </pre>
              </div>
            )}
            {!template.prerequisites && !template.usageExample && (
              <p className="text-muted-foreground text-sm">No usage examples provided.</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="versions">
          <div className="space-y-3">
            {(versions || []).length === 0 ? (
              <p className="text-muted-foreground text-sm">No version history available.</p>
            ) : (
              (versions || []).map((v) => (
                <div key={v.id} className="border border-border rounded-lg p-4 bg-card">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-mono font-semibold">v{v.version}</span>
                    <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(v.createdAt))} ago · {v.authorName}</span>
                  </div>
                  {v.changelog && <p className="text-xs text-muted-foreground">{v.changelog}</p>}
                </div>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="comments">
          <div className="space-y-4">
            {/* Rating */}
            <div className="border border-border rounded-lg p-4 bg-card flex items-center gap-4">
              <div>
                <p className="text-sm font-medium mb-1">Rate this template</p>
                <StarRating value={userRating} onChange={handleRate} />
              </div>
              <div className="border-l border-border pl-4 ml-2">
                <p className="text-2xl font-bold text-foreground">{template.averageRating.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">{template.ratingCount} ratings</p>
              </div>
            </div>

            {/* Comment form */}
            {isAuthenticated && (
              <form onSubmit={handleComment} className="space-y-2">
                <Textarea
                  placeholder="Share your experience or ask a question..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  className="text-sm resize-none"
                />
                <Button type="submit" size="sm" disabled={!comment.trim() || postComment.isPending}>
                  Post Comment
                </Button>
              </form>
            )}

            {/* Comments list */}
            <div className="space-y-3">
              {(comments || []).length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">No comments yet. Be the first!</p>
              ) : (
                (comments || []).map((c) => (
                  <div key={c.id} className="border border-border rounded-lg p-4 bg-card">
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="text-[10px] bg-primary/20 text-primary">
                          {c.authorName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium">{c.authorName}</span>
                      <span className="text-[10px] text-muted-foreground ml-auto">
                        {formatDistanceToNow(new Date(c.createdAt))} ago
                      </span>
                    </div>
                    <p className="text-sm text-foreground/90">{c.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
