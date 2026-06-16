import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  useListFeaturedTemplates, useListPopularTemplates, useListRecentTemplates,
  useListCategories,
} from "@workspace/api-client-react";
import TemplateCard from "@/components/TemplateCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Database, GitBranch, Activity, Shield, Layers, Zap, AlertTriangle,
  TrendingUp, Clock, Star, ArrowRight, Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const categoryIcons: Record<string, any> = {
  sql: Database, adf: GitBranch, fabric: Layers, databricks: Zap,
  "github-actions": GitBranch, monitoring: Activity, "data-quality": Shield,
  "etl-elt": Layers, cicd: GitBranch, spark: Zap, "incident-response": AlertTriangle,
};

const categoryColors: Record<string, string> = {
  sql: "from-blue-500/20 to-blue-600/5 border-blue-500/20 text-blue-400",
  adf: "from-orange-500/20 to-orange-600/5 border-orange-500/20 text-orange-400",
  fabric: "from-purple-500/20 to-purple-600/5 border-purple-500/20 text-purple-400",
  databricks: "from-red-500/20 to-red-600/5 border-red-500/20 text-red-400",
  "github-actions": "from-emerald-500/20 to-emerald-600/5 border-emerald-500/20 text-emerald-400",
  monitoring: "from-cyan-500/20 to-cyan-600/5 border-cyan-500/20 text-cyan-400",
  "data-quality": "from-green-500/20 to-green-600/5 border-green-500/20 text-green-400",
  "etl-elt": "from-yellow-500/20 to-yellow-600/5 border-yellow-500/20 text-yellow-400",
  cicd: "from-pink-500/20 to-pink-600/5 border-pink-500/20 text-pink-400",
  spark: "from-orange-400/20 to-orange-500/5 border-orange-400/20 text-orange-300",
  "incident-response": "from-red-400/20 to-red-500/5 border-red-400/20 text-red-300",
};

function CardSkeleton() {
  return (
    <div className="border border-border rounded-lg p-4 bg-card">
      <Skeleton className="h-4 w-3/4 mb-2" />
      <Skeleton className="h-3 w-full mb-1" />
      <Skeleton className="h-3 w-2/3 mb-3" />
      <div className="flex gap-1 mb-3">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="flex justify-between">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
  );
}

export default function HomePage() {
  const [search, setSearch] = useState("");
  const [, navigate] = useLocation();

  const { data: featured, isLoading: featuredLoading } = useListFeaturedTemplates();
  const { data: popular, isLoading: popularLoading } = useListPopularTemplates();
  const { data: recent, isLoading: recentLoading } = useListRecentTemplates();
  const { data: categories, isLoading: catsLoading } = useListCategories();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) navigate(`/browse?search=${encodeURIComponent(search.trim())}`);
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Hero */}
      <div className="mb-8 relative overflow-hidden rounded-xl border border-border bg-card p-8">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none" />
        <div className="relative max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary font-medium mb-4">
            <Star className="w-3 h-3" />
            Production-Ready Templates
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2 leading-tight">
            The Data Engineering<br />Template Marketplace
          </h1>
          <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
            Discover, reuse, and share production-ready templates for SQL, ADF, Databricks, Fabric, GitHub Actions, Spark, and more. Built by data engineers, for data engineers.
          </p>
          <form onSubmit={handleSearch} className="flex gap-2 max-w-lg">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search SQL queries, ADF pipelines, Databricks jobs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10"
              />
            </div>
            <Button type="submit" className="h-10 px-5">Search</Button>
          </form>
        </div>
      </div>

      {/* Categories */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-foreground">Browse by Category</h2>
          <Link href="/browse" className="text-xs text-primary hover:underline flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {catsLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {Array.from({ length: 11 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {(categories || []).map((cat) => {
              const Icon = categoryIcons[cat.slug] || Database;
              const colorClass = categoryColors[cat.slug] || "from-muted/40 to-muted/10 border-border text-muted-foreground";
              return (
                <Link
                  key={cat.id}
                  href={`/browse?categoryId=${cat.id}`}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-lg border bg-gradient-to-br cursor-pointer transition-all hover:scale-[1.02] hover:shadow-sm text-center",
                    colorClass
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-medium text-foreground leading-tight">{cat.name}</span>
                  <span className="text-[10px] text-muted-foreground">{cat.templateCount} templates</span>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Featured */}
      {(featured?.length ?? 0) > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-400" />
              <h2 className="text-base font-semibold text-foreground">Featured Templates</h2>
            </div>
            <Link href="/browse?sortBy=rating" className="text-xs text-primary hover:underline flex items-center gap-1">
              See all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredLoading
              ? Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)
              : (featured || []).slice(0, 3).map((t) => <TemplateCard key={t.id} template={t} />)}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Popular */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <h2 className="text-base font-semibold text-foreground">Most Popular</h2>
            </div>
            <Link href="/browse?sortBy=downloads" className="text-xs text-primary hover:underline flex items-center gap-1">
              See all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {popularLoading
              ? Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
              : (popular || []).slice(0, 4).map((t) => <TemplateCard key={t.id} template={t} compact />)}
          </div>
        </section>

        {/* Recent */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <h2 className="text-base font-semibold text-foreground">Recently Added</h2>
            </div>
            <Link href="/browse?sortBy=newest" className="text-xs text-primary hover:underline flex items-center gap-1">
              See all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentLoading
              ? Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
              : (recent || []).slice(0, 4).map((t) => <TemplateCard key={t.id} template={t} compact />)}
          </div>
        </section>
      </div>
    </div>
  );
}
