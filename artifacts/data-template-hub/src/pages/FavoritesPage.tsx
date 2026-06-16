import { Link } from "wouter";
import { useListFavorites } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth-context";
import TemplateCard from "@/components/TemplateCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Heart, Search } from "lucide-react";

export default function FavoritesPage() {
  const { isAuthenticated } = useAuth();
  const { data: favorites, isLoading } = useListFavorites({ query: { enabled: isAuthenticated } });

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <Heart className="w-12 h-12 text-muted-foreground/30 mb-4" />
        <h2 className="text-lg font-semibold mb-2">Sign in to view favorites</h2>
        <p className="text-sm text-muted-foreground mb-4">Save templates to quickly access them later.</p>
        <Link href="/login"><Button>Sign In</Button></Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Heart className="w-5 h-5 text-red-400" />
        <h1 className="text-lg font-bold text-foreground">My Favorites</h1>
        {!isLoading && <span className="text-xs text-muted-foreground">({favorites?.length ?? 0} saved)</span>}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="border border-border rounded-lg p-4 bg-card">
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-full mb-3" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ))}
        </div>
      ) : (favorites?.length ?? 0) === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Heart className="w-10 h-10 text-muted-foreground/20 mb-3" />
          <h3 className="text-sm font-medium text-foreground mb-1">No favorites yet</h3>
          <p className="text-xs text-muted-foreground mb-4">Browse templates and click the heart icon to save them here.</p>
          <Link href="/browse">
            <Button variant="outline" size="sm" className="gap-2">
              <Search className="w-3.5 h-3.5" />Browse Templates
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(favorites || []).map((t) => <TemplateCard key={t.id} template={t} />)}
        </div>
      )}
    </div>
  );
}
