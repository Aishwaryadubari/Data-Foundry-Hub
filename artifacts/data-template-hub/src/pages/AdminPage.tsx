import { useState } from "react";
import {
  useListSubmissions, useApproveSubmission, useRejectSubmission,
  useListUsers, useUpdateUserRole, useGetAnalyticsSummary,
  useListTemplates, useDeleteTemplate,
  getListSubmissionsQueryKey, getListUsersQueryKey, getListTemplatesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import {
  CheckCircle2, XCircle, Users, Package, FileCheck, Eye, Trash2,
  Shield, AlertTriangle, Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";

const statusColor: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  rejected: "bg-red-500/10 text-red-400 border-red-500/20",
  published: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

export default function AdminPage() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data: submissions, isLoading: subsLoading } = useListSubmissions();
  const { data: users, isLoading: usersLoading } = useListUsers();
  const { data: summary } = useGetAnalyticsSummary();
  const { data: templatesResult, isLoading: templatesLoading } = useListTemplates({ limit: 50 });

  const approve = useApproveSubmission();
  const reject = useRejectSubmission();
  const updateRole = useUpdateUserRole();
  const deleteTemplate = useDeleteTemplate();

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <Lock className="w-10 h-10 text-muted-foreground/30 mb-3" />
        <h2 className="text-lg font-semibold mb-2">Access Denied</h2>
        <Link href="/login"><Button>Sign In</Button></Link>
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <Shield className="w-10 h-10 text-muted-foreground/30 mb-3" />
        <h2 className="text-lg font-semibold mb-2">Admin Access Required</h2>
        <p className="text-sm text-muted-foreground">You don't have permission to view this page.</p>
      </div>
    );
  }

  const handleApprove = (id: number) => {
    approve.mutate({ id }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListSubmissionsQueryKey() });
        toast({ title: "Submission approved", description: "Template has been published." });
      },
    });
  };

  const handleReject = () => {
    if (!rejectId) return;
    reject.mutate({ id: rejectId, data: { reason: rejectReason } }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListSubmissionsQueryKey() });
        setRejectId(null); setRejectReason("");
        toast({ title: "Submission rejected" });
      },
    });
  };

  const handleRoleToggle = (id: number, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    updateRole.mutate({ id, data: { role: newRole } }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListUsersQueryKey() });
        toast({ title: `Role updated to ${newRole}` });
      },
    });
  };

  const handleDelete = (id: number) => {
    if (!confirm("Delete this template? This cannot be undone.")) return;
    deleteTemplate.mutate({ id }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListTemplatesQueryKey() });
        toast({ title: "Template deleted" });
      },
    });
  };

  const pending = (submissions || []).filter((s) => s.status === "pending");

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="w-5 h-5 text-primary" />
        <h1 className="text-lg font-bold text-foreground">Admin Panel</h1>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Templates", value: summary?.totalTemplates ?? 0, icon: Package, color: "text-blue-400" },
          { label: "Total Users", value: summary?.totalUsers ?? 0, icon: Users, color: "text-purple-400" },
          { label: "Pending Reviews", value: pending.length, icon: FileCheck, color: "text-yellow-400" },
          { label: "Total Downloads", value: summary?.totalDownloads ?? 0, icon: Package, color: "text-cyan-400" },
        ].map((s) => (
          <div key={s.label} className="border border-border rounded-lg p-3 bg-card">
            <div className="flex items-center gap-2 mb-1">
              <s.icon className={cn("w-3.5 h-3.5", s.color)} />
              <span className="text-[10px] text-muted-foreground">{s.label}</span>
            </div>
            <p className="text-xl font-bold text-foreground">{s.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="submissions">
        <TabsList className="h-8 mb-4">
          <TabsTrigger value="submissions" className="text-xs gap-1.5">
            <FileCheck className="w-3.5 h-3.5" />
            Submissions
            {pending.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-[9px] font-bold">{pending.length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="templates" className="text-xs gap-1.5"><Package className="w-3.5 h-3.5" />Templates</TabsTrigger>
          <TabsTrigger value="users" className="text-xs gap-1.5"><Users className="w-3.5 h-3.5" />Users</TabsTrigger>
        </TabsList>

        {/* Submissions */}
        <TabsContent value="submissions">
          {subsLoading ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
          ) : (submissions || []).length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">No submissions yet.</div>
          ) : (
            <div className="space-y-2">
              {(submissions || []).map((s) => (
                <div key={s.id} className="border border-border rounded-lg p-4 bg-card">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold truncate">{s.title}</h3>
                        <span className={cn("text-[10px] px-1.5 py-0.5 rounded border capitalize font-medium", statusColor[s.status])}>
                          {s.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1 mb-1">{s.description}</p>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                        <span>by {s.submittedByName}</span>
                        <span>{formatDistanceToNow(new Date(s.createdAt))} ago</span>
                        {s.reviewedByName && <span>reviewed by {s.reviewedByName}</span>}
                      </div>
                      {s.reviewNotes && (
                        <p className="text-[11px] text-red-400 mt-1 bg-red-500/5 rounded px-2 py-1">Rejection reason: {s.reviewNotes}</p>
                      )}
                    </div>
                    {s.status === "pending" && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button size="sm" className="h-7 text-xs gap-1 bg-emerald-500 hover:bg-emerald-600"
                          onClick={() => handleApprove(s.id)} disabled={approve.isPending}>
                          <CheckCircle2 className="w-3.5 h-3.5" />Approve
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-red-400/30 text-red-400 hover:bg-red-500/10"
                          onClick={() => { setRejectId(s.id); setRejectReason(""); }}>
                          <XCircle className="w-3.5 h-3.5" />Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Templates */}
        <TabsContent value="templates">
          {templatesLoading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
          ) : (
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    {["Title", "Category", "Author", "Downloads", "Rating", "Status", "Actions"].map((h) => (
                      <th key={h} className="text-left px-3 py-2 text-muted-foreground font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(templatesResult?.templates || []).map((t, i) => (
                    <tr key={t.id} className={cn("border-b border-border/50 hover:bg-muted/20", i % 2 === 0 ? "" : "bg-muted/10")}>
                      <td className="px-3 py-2 font-medium text-foreground max-w-[200px] truncate">{t.title}</td>
                      <td className="px-3 py-2 text-muted-foreground">{t.categoryName}</td>
                      <td className="px-3 py-2 text-muted-foreground">{t.authorName}</td>
                      <td className="px-3 py-2 text-muted-foreground">{t.downloads.toLocaleString()}</td>
                      <td className="px-3 py-2 text-muted-foreground">{t.averageRating.toFixed(1)}</td>
                      <td className="px-3 py-2">
                        <span className={cn("px-1.5 py-0.5 rounded border text-[10px] capitalize", statusColor[t.status])}>{t.status}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          <Link href={`/templates/${t.id}`}>
                            <button className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </Link>
                          <button onClick={() => handleDelete(t.id)} className="p-1 rounded hover:bg-red-500/10 transition-colors text-muted-foreground hover:text-red-400">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* Users */}
        <TabsContent value="users">
          {usersLoading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : (
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    {["Name", "Email", "Role", "Joined", "Actions"].map((h) => (
                      <th key={h} className="text-left px-3 py-2 text-muted-foreground font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(users || []).map((u, i) => (
                    <tr key={u.id} className={cn("border-b border-border/50 hover:bg-muted/20", i % 2 === 0 ? "" : "bg-muted/10")}>
                      <td className="px-3 py-2 font-medium text-foreground">{u.name}</td>
                      <td className="px-3 py-2 text-muted-foreground">{u.email}</td>
                      <td className="px-3 py-2">
                        <span className={cn("px-1.5 py-0.5 rounded border text-[10px]",
                          u.role === "admin" ? "bg-purple-500/10 text-purple-400 border-purple-500/20" : "bg-muted text-muted-foreground border-border"
                        )}>{u.role}</span>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{formatDistanceToNow(new Date(u.createdAt))} ago</td>
                      <td className="px-3 py-2">
                        {u.id !== user.id && (
                          <Button size="sm" variant="outline" className="h-6 text-[10px]"
                            onClick={() => handleRoleToggle(u.id, u.role)}>
                            {u.role === "admin" ? "Remove Admin" : "Make Admin"}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Reject dialog */}
      <Dialog open={!!rejectId} onOpenChange={() => setRejectId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Submission</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">Provide a reason for rejection (optional but recommended):</p>
            <Textarea
              placeholder="e.g. Code quality issues, missing documentation, duplicate template..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={reject.isPending}>
              Reject Submission
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
