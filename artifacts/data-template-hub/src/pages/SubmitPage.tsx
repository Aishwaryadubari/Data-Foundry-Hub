import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useListCategories, useSubmitTemplate } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Code2, FileText, Tag, ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  { id: 1, label: "Basic Info", icon: FileText },
  { id: 2, label: "Template Code", icon: Code2 },
  { id: 3, label: "Documentation", icon: FileText },
  { id: 4, label: "Tags & Meta", icon: Tag },
];

export default function SubmitPage() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [code, setCode] = useState("");
  const [documentation, setDocumentation] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [language, setLanguage] = useState("");
  const [complexity, setComplexity] = useState("");

  const { data: categories } = useListCategories();
  const submit = useSubmitTemplate();

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <Lock className="w-10 h-10 text-muted-foreground/30 mb-3" />
        <h2 className="text-lg font-semibold mb-2">Login required</h2>
        <p className="text-sm text-muted-foreground mb-4">You need to be logged in to submit templates.</p>
        <Link href="/login"><Button>Sign In</Button></Link>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <CheckCircle2 className="w-14 h-14 text-emerald-400 mb-4" />
        <h2 className="text-xl font-bold mb-2">Submission Received</h2>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm">
          Your template has been submitted for review. Our team will review it within 48 hours. You'll be notified once it's approved.
        </p>
        <div className="flex gap-2">
          <Link href="/browse"><Button variant="outline">Browse Templates</Button></Link>
          <Button onClick={() => { setSubmitted(false); setStep(1); setTitle(""); setDescription(""); setCode(""); }}>
            Submit Another
          </Button>
        </div>
      </div>
    );
  }

  const handleSubmit = () => {
    const tags = tagsInput.split(",").map((t) => t.trim()).filter(Boolean);
    submit.mutate({
      data: {
        title, description, categoryId: parseInt(categoryId),
        code, documentation, tags, language, complexity,
      },
    }, {
      onSuccess: () => setSubmitted(true),
      onError: () => toast({ title: "Submission failed", variant: "destructive" }),
    });
  };

  const canProceed = () => {
    if (step === 1) return title && description && categoryId;
    if (step === 2) return code.trim().length > 10;
    return true;
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-lg font-bold text-foreground mb-1">Submit a Template</h1>
        <p className="text-xs text-muted-foreground">Share your production-ready templates with the community. All submissions are reviewed before publishing.</p>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-0 mb-8">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center flex-1">
            <div className={cn(
              "flex items-center gap-2 shrink-0 transition-colors",
              step === s.id ? "text-primary" : step > s.id ? "text-emerald-400" : "text-muted-foreground"
            )}>
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-colors",
                step === s.id ? "bg-primary border-primary text-primary-foreground" :
                  step > s.id ? "bg-emerald-400 border-emerald-400 text-white" :
                    "border-border text-muted-foreground"
              )}>
                {step > s.id ? <CheckCircle2 className="w-3.5 h-3.5" /> : s.id}
              </div>
              <span className="text-xs font-medium hidden sm:block">{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={cn("flex-1 h-px mx-2 transition-colors", step > s.id ? "bg-emerald-400/40" : "bg-border")} />
            )}
          </div>
        ))}
      </div>

      <div className="border border-border rounded-xl bg-card p-6">
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold mb-4">Basic Information</h2>
            <div className="space-y-1.5">
              <Label className="text-xs">Template Title <span className="text-destructive">*</span></Label>
              <Input placeholder="e.g. Slowly Changing Dimensions Type 2 SQL" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Description <span className="text-destructive">*</span></Label>
              <Textarea
                placeholder="What does this template do? What problem does it solve?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Category <span className="text-destructive">*</span></Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                <SelectContent>
                  {(categories || []).map((c) => <SelectItem key={c.id} value={String(c.id)} className="text-xs">{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold mb-4">Template Code</h2>
            <div className="space-y-1.5">
              <Label className="text-xs">Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger><SelectValue placeholder="Select language" /></SelectTrigger>
                <SelectContent>
                  {["sql", "yaml", "python", "json", "bash", "hcl", "scala", "text"].map((l) => (
                    <SelectItem key={l} value={l} className="text-xs uppercase">{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Code <span className="text-destructive">*</span></Label>
              <Textarea
                placeholder="Paste your template code here..."
                value={code}
                onChange={(e) => setCode(e.target.value)}
                rows={14}
                className="font-mono text-xs resize-none bg-black/20"
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold mb-4">Documentation</h2>
            <div className="space-y-1.5">
              <Label className="text-xs">Documentation</Label>
              <Textarea
                placeholder="Explain how the template works, what parameters are available, etc..."
                value={documentation}
                onChange={(e) => setDocumentation(e.target.value)}
                rows={10}
                className="resize-none text-sm"
              />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold mb-4">Tags & Metadata</h2>
            <div className="space-y-1.5">
              <Label className="text-xs">Tags <span className="text-muted-foreground">(comma-separated)</span></Label>
              <Input
                placeholder="e.g. scd2, dimension, slowly-changing, warehouse"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
              />
              {tagsInput && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {tagsInput.split(",").filter((t) => t.trim()).map((t) => (
                    <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">{t.trim()}</span>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Complexity Level</Label>
              <Select value={complexity} onValueChange={setComplexity}>
                <SelectTrigger><SelectValue placeholder="Select complexity" /></SelectTrigger>
                <SelectContent>
                  {["beginner", "intermediate", "advanced"].map((c) => (
                    <SelectItem key={c} value={c} className="text-xs capitalize">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Review summary */}
            <div className="mt-4 p-3 rounded-lg bg-muted/40 border border-border/50 text-xs space-y-1">
              <p className="font-medium text-foreground">Review before submitting:</p>
              <p className="text-muted-foreground">Title: <span className="text-foreground">{title}</span></p>
              <p className="text-muted-foreground">Category: <span className="text-foreground">{categories?.find(c => String(c.id) === categoryId)?.name}</span></p>
              <p className="text-muted-foreground">Code: <span className="text-foreground">{code.split("\n").length} lines</span></p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-4">
        <Button variant="outline" onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1} className="gap-1.5">
          <ChevronLeft className="w-4 h-4" />Previous
        </Button>
        {step < 4 ? (
          <Button onClick={() => setStep(s => s + 1)} disabled={!canProceed()} className="gap-1.5">
            Next<ChevronRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={submit.isPending || !canProceed()} className="gap-1.5">
            {submit.isPending ? "Submitting..." : "Submit for Review"}
          </Button>
        )}
      </div>
    </div>
  );
}
