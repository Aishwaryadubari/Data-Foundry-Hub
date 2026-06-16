import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { useRegister } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Code2, ArrowRight, CheckCircle2 } from "lucide-react";

const benefits = [
  "Access 500+ production-ready templates",
  "Save templates to your favorites",
  "Submit community templates",
  "Rate and comment on templates",
];

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { setToken } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const register = useRegister();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    register.mutate(
      { data: { name, email, password } },
      {
        onSuccess: (result) => {
          setToken(result.token);
          navigate("/");
          toast({ title: "Account created!", description: `Welcome to DataHub, ${result.user.name}` });
        },
        onError: (err: any) => {
          toast({
            title: "Registration failed",
            description: err?.data?.error || "Something went wrong.",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:flex lg:w-1/2 bg-card border-r border-border flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Code2 className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <p className="font-bold text-foreground">DataHub</p>
            <p className="text-xs text-muted-foreground">Template Marketplace</p>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-foreground mb-3">Join thousands of data engineers</h2>
          <p className="text-muted-foreground text-sm mb-6">Everything your team needs to move fast — in one place.</p>
          <div className="space-y-3">
            {benefits.map((b) => (
              <div key={b} className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span className="text-sm text-foreground/80">{b}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-background/50 rounded-xl p-4 border border-border/50">
          <p className="text-xs text-muted-foreground mb-1">Trusted by teams at</p>
          <div className="flex items-center gap-4">
            {["Microsoft", "Databricks", "Snowflake", "dbt Labs"].map((co) => (
              <span key={co} className="text-xs font-semibold text-muted-foreground/70">{co}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Code2 className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold">DataHub</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-1">Create your account</h1>
            <p className="text-sm text-muted-foreground">Free. No credit card required.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Full Name</Label>
              <Input placeholder="Alex Johnson" value={name} onChange={(e) => setName(e.target.value)} required className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Work Email</Label>
              <Input type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Password</Label>
              <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="h-9" />
            </div>

            <Button type="submit" className="w-full h-9" disabled={register.isPending}>
              {register.isPending ? "Creating account..." : (
                <span className="flex items-center gap-2">Create Account <ArrowRight className="w-4 h-4" /></span>
              )}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
