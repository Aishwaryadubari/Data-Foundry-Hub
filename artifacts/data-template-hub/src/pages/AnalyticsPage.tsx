import {
  useGetAnalyticsSummary, useGetCategoryBreakdown,
  useGetTopContributors, useGetDownloadTrends,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { TrendingUp, Download, Users, Package, FileCheck, Star } from "lucide-react";
import { format } from "date-fns";

const COLORS = ["#06b6d4", "#3b82f6", "#8b5cf6", "#f59e0b", "#10b981", "#f43f5e", "#84cc16", "#fb923c", "#ec4899", "#0ea5e9", "#a855f7"];

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: string }) {
  return (
    <Card className="border border-border">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-muted-foreground">{label}</p>
          <div className={`p-1.5 rounded-md ${color}`}>
            <Icon className="w-3.5 h-3.5 text-white" />
          </div>
        </div>
        <p className="text-2xl font-bold text-foreground">{typeof value === "number" ? value.toLocaleString() : value}</p>
      </CardContent>
    </Card>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg">
      <p className="text-[11px] text-muted-foreground mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-xs font-medium" style={{ color: p.color }}>{p.name}: {p.value.toLocaleString()}</p>
      ))}
    </div>
  );
};

export default function AnalyticsPage() {
  const { data: summary, isLoading: summaryLoading } = useGetAnalyticsSummary();
  const { data: breakdown, isLoading: breakdownLoading } = useGetCategoryBreakdown();
  const { data: contributors, isLoading: contributorsLoading } = useGetTopContributors();
  const { data: trends, isLoading: trendsLoading } = useGetDownloadTrends();

  const trendData = (trends || []).map((t) => ({
    date: format(new Date(t.date), "MMM d"),
    downloads: t.downloads,
  }));

  const stats = [
    { label: "Total Templates", value: summary?.totalTemplates ?? 0, icon: Package, color: "bg-blue-500" },
    { label: "Total Downloads", value: summary?.totalDownloads ?? 0, icon: Download, color: "bg-cyan-500" },
    { label: "Registered Users", value: summary?.totalUsers ?? 0, icon: Users, color: "bg-purple-500" },
    { label: "Categories", value: summary?.totalCategories ?? 0, icon: TrendingUp, color: "bg-emerald-500" },
    { label: "Pending Reviews", value: summary?.pendingSubmissions ?? 0, icon: FileCheck, color: "bg-orange-500" },
    { label: "Total Ratings", value: summary?.totalRatings ?? 0, icon: Star, color: "bg-yellow-500" },
  ];

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      <div className="mb-6">
        <h1 className="text-lg font-bold text-foreground mb-1">Platform Analytics</h1>
        <p className="text-xs text-muted-foreground">Usage metrics and insights across the template marketplace</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {summaryLoading
          ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20" />)
          : stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Download trends */}
        <Card className="border border-border lg:col-span-2">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold">Download Trends — Last 30 Days</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {trendsLoading ? <Skeleton className="h-48" /> : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} interval={6} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="downloads" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Downloads" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top contributors */}
        <Card className="border border-border">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold">Top Contributors</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {contributorsLoading ? (
              <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8" />)}</div>
            ) : (
              <div className="space-y-2">
                {(contributors || []).slice(0, 6).map((c, i) => (
                  <div key={c.userId} className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground w-4">{i + 1}</span>
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="text-[9px] bg-primary/20 text-primary">
                        {c.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{c.name}</p>
                      <p className="text-[10px] text-muted-foreground">{c.templateCount} templates</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">{c.totalDownloads.toLocaleString()} dl</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Category breakdown */}
      <Card className="border border-border">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-semibold">Downloads by Category</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {breakdownLoading ? <Skeleton className="h-48" /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={breakdown || []} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="categoryName" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} width={90} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="downloads" radius={[0, 3, 3, 0]} name="Downloads">
                  {(breakdown || []).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
