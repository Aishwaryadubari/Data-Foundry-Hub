import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Star, Download, Heart, Code2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { useAddFavorite, useRemoveFavorite, getListFavoritesQueryKey, getListTemplatesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface Template {
  id: number;
  title: string;
  description: string;
  categoryName: string;
  categorySlug?: string;
  authorName: string;
  version: string;
  downloads: number;
  averageRating: number;
  ratingCount: number;
  isFavorited: boolean;
  tags: string[];
  language?: string | null;
  complexity?: string | null;
  createdAt: string;
}

const complexityColor: Record<string, string> = {
  beginner: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  intermediate: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  advanced: "bg-red-500/15 text-red-400 border-red-500/20",
};

const categoryColor: Record<string, string> = {
  sql: "bg-blue-500/15 text-blue-400",
  adf: "bg-orange-500/15 text-orange-400",
  fabric: "bg-purple-500/15 text-purple-400",
  databricks: "bg-red-500/15 text-red-400",
  "github-actions": "bg-emerald-500/15 text-emerald-400",
  monitoring: "bg-cyan-500/15 text-cyan-400",
  "data-quality": "bg-green-500/15 text-green-400",
  "etl-elt": "bg-yellow-500/15 text-yellow-400",
  cicd: "bg-pink-500/15 text-pink-400",
  spark: "bg-orange-500/15 text-orange-300",
  "incident-response": "bg-red-500/15 text-red-300",
};

export default function TemplateCard({ template, compact = false }: { template: Template; compact?: boolean }) {
  const { isAuthenticated } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();
  const addFav = useAddFavorite();
  const removeFav = useRemoveFavorite();

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast({ title: "Login required", description: "Please login to save favorites." });
      return;
    }
    if (template.isFavorited) {
      removeFav.mutate({ templateId: template.id }, {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListFavoritesQueryKey() });
          toast({ title: "Removed from favorites" });
        },
      });
    } else {
      addFav.mutate({ templateId: template.id }, {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListFavoritesQueryKey() });
          toast({ title: "Added to favorites" });
        },
      });
    }
  };

  const slug = template.categorySlug || "";
  const catColorClass = categoryColor[slug] || "bg-muted text-muted-foreground";

  return (
    <Link href={`/templates/${template.id}`}>
      <Card className={cn(
        "group relative border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden",
        compact ? "p-3" : "p-4"
      )}>
        {/* Category bar */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/40 via-primary/20 to-transparent" />

        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium", catColorClass)}>
                {template.categoryName}
              </span>
              {template.complexity && (
                <span className={cn("text-[10px] px-1.5 py-0.5 rounded border font-medium", complexityColor[template.complexity.toLowerCase()] || "bg-muted text-muted-foreground")}>
                  {template.complexity}
                </span>
              )}
              <span className="text-[10px] text-muted-foreground font-mono">v{template.version}</span>
            </div>
            <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
              {template.title}
            </h3>
          </div>
          <button
            onClick={handleFavorite}
            className={cn(
              "shrink-0 p-1 rounded transition-colors",
              template.isFavorited
                ? "text-red-400 hover:text-red-300"
                : "text-muted-foreground hover:text-red-400"
            )}
          >
            <Heart className={cn("w-3.5 h-3.5", template.isFavorited && "fill-current")} />
          </button>
        </div>

        {!compact && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{template.description}</p>
        )}

        {template.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {template.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground border border-border/50">
                {tag}
              </span>
            ))}
            {template.tags.length > 3 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground">
                +{template.tags.length - 3}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span>{template.averageRating.toFixed(1)}</span>
              <span className="text-muted-foreground/60">({template.ratingCount})</span>
            </div>
            <div className="flex items-center gap-1">
              <Download className="w-3 h-3" />
              <span>{template.downloads.toLocaleString()}</span>
            </div>
          </div>
          <span className="text-[10px] text-muted-foreground/70">by {template.authorName}</span>
        </div>
      </Card>
    </Link>
  );
}
