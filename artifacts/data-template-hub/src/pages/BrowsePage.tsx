import { useState, useEffect, useMemo } from "react";
import { useSearch } from "wouter";
import { useListTemplates, useListCategories, useListTags } from "@workspace/api-client-react";
import TemplateCard from "@/components/TemplateCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Search, Grid2x2, List, X, Filter, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

function parseQueryString(qs: string) {
  const params = new URLSearchParams(qs);
  return {
    search: params.get("search") || "",
    categoryId: params.get("categoryId") || "",
    sortBy: params.get("sortBy") || "newest",
  };
}

const sortOptions = [
  { value: "newest", label: "Newest First" },
  { value: "downloads", label: "Most Downloaded" },
  { value: "rating", label: "Highest Rated" },
  { value: "oldest", label: "Oldest First" },
];

const complexityOptions = ["beginner", "intermediate", "advanced"];

export default function BrowsePage() {
  const qs = useSearch();
  const initial = parseQueryString(qs);

  const [search, setSearch] = useState(initial.search);
  const [debouncedSearch, setDebouncedSearch] = useState(initial.search);
  const [categoryId, setCategoryId] = useState<number | null>(initial.categoryId ? parseInt(initial.categoryId) : null);
  const [sortBy, setSortBy] = useState(initial.sortBy);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [complexity, setComplexity] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const p = new URLSearchParams(qs);
    const s = p.get("search") || "";
    const cid = p.get("categoryId");
    setSearch(s);
    setDebouncedSearch(s);
    if (cid) setCategoryId(parseInt(cid));
    setPage(1);
  }, [qs]);

  const { data: categories } = useListCategories();
  const { data: tags } = useListTags();

  const { data: result, isLoading } = useListTemplates({
    search: debouncedSearch || undefined,
    categoryId: categoryId || undefined,
    sortBy,
    page,
    limit: 24,
  });

  const templates = result?.templates || [];
  const total = result?.total || 0;
  const totalPages = Math.ceil(total / 24);

  const filtered = useMemo(() => {
    let t = templates;
    if (selectedTags.length > 0) {
      t = t.filter((tmpl) => selectedTags.some((tag) => tmpl.tags.map((tg) => tg.toLowerCase()).includes(tag.toLowerCase())));
    }
    if (complexity) {
      t = t.filter((tmpl) => tmpl.complexity?.toLowerCase() === complexity.toLowerCase());
    }
    return t;
  }, [templates, selectedTags, complexity]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
    setPage(1);
  };

  const activeFilters = [
    ...(categoryId ? [`Category: ${categories?.find((c) => c.id === categoryId)?.name}`] : []),
    ...selectedTags.map((t) => `Tag: ${t}`),
    ...(complexity ? [`Complexity: ${complexity}`] : []),
    ...(debouncedSearch ? [`Search: "${debouncedSearch}"`] : []),
  ];

  return (
    <div className="flex h-full">
      {/* Sidebar filters */}
      <aside className="w-52 shrink-0 border-r border-border bg-card/50 overflow-y-auto p-4 hidden md:block">
        <div className="flex items-center gap-1.5 mb-4">
          <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold text-foreground">Filters</span>
        </div>

        {/* Category */}
        <div className="mb-4">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">Category</p>
          <div className="space-y-0.5">
            <button
              onClick={() => { setCategoryId(null); setPage(1); }}
              className={cn(
                "w-full text-left px-2 py-1.5 rounded text-xs transition-colors",
                !categoryId ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              All Categories
            </button>
            {(categories || []).map((cat) => (
              <button
                key={cat.id}
                onClick={() => { setCategoryId(cat.id); setPage(1); }}
                className={cn(
                  "w-full text-left px-2 py-1.5 rounded text-xs transition-colors flex items-center justify-between",
                  categoryId === cat.id ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <span className="truncate">{cat.name}</span>
                <span className="text-[10px] ml-1 shrink-0">{cat.templateCount}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Complexity */}
        <div className="mb-4">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">Complexity</p>
          <div className="space-y-0.5">
            <button
              onClick={() => setComplexity(null)}
              className={cn("w-full text-left px-2 py-1.5 rounded text-xs transition-colors",
                !complexity ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >Any</button>
            {complexityOptions.map((c) => (
              <button key={c} onClick={() => setComplexity(c === complexity ? null : c)}
                className={cn("w-full text-left px-2 py-1.5 rounded text-xs transition-colors capitalize",
                  complexity === c ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >{c}</button>
            ))}
          </div>
        </div>

        {/* Popular tags */}
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">Tags</p>
          <div className="flex flex-wrap gap-1">
            {(tags || []).slice(0, 20).map((tag) => (
              <button
                key={tag.id}
                onClick={() => toggleTag(tag.name)}
                className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded border transition-colors",
                  selectedTags.includes(tag.name)
                    ? "bg-primary/20 border-primary/40 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                )}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 overflow-auto p-6">
        {/* Toolbar */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search templates..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-8 h-8 text-xs"
            />
          </div>
          <Select value={sortBy} onValueChange={(v) => { setSortBy(v); setPage(1); }}>
            <SelectTrigger className="h-8 text-xs w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((o) => <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex items-center border border-border rounded-md overflow-hidden">
            <button onClick={() => setViewMode("grid")} className={cn("p-1.5", viewMode === "grid" ? "bg-muted" : "hover:bg-muted/50")}>
              <Grid2x2 className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setViewMode("list")} className={cn("p-1.5", viewMode === "list" ? "bg-muted" : "hover:bg-muted/50")}>
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Active filters */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mb-4">
            <span className="text-xs text-muted-foreground">Filters:</span>
            {activeFilters.map((f) => (
              <span key={f} className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                {f}
                <button onClick={() => {
                  if (f.startsWith("Category")) setCategoryId(null);
                  else if (f.startsWith("Tag: ")) toggleTag(f.slice(5));
                  else if (f.startsWith("Complexity")) setComplexity(null);
                  else setSearch("");
                }}>
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-muted-foreground">
            {isLoading ? "Loading..." : `${filtered.length} of ${total} templates`}
          </p>
        </div>

        {isLoading ? (
          <div className={cn("grid gap-4", viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3" : "grid-cols-1")}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="border border-border rounded-lg p-4 bg-card">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-full mb-3" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-foreground">No templates found</p>
            <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters or search terms</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => { setCategoryId(null); setSearch(""); setSelectedTags([]); setComplexity(null); }}>
              Clear all filters
            </Button>
          </div>
        ) : (
          <div className={cn("grid gap-4", viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3" : "grid-cols-1")}>
            {filtered.map((t) => <TemplateCard key={t.id} template={t} compact={viewMode === "list"} />)}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
            <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
          </div>
        )}
      </div>
    </div>
  );
}
