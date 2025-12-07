import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  Layout,
  ShieldCheck,
  Users
} from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <ClipboardCheck className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <span className="text-base sm:text-xl">Dormitory Evaluation System</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button>Sign Up</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="container mx-auto px-4 pt-20 pb-32 text-center">
          <div className="mx-auto max-w-[64rem] space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                Streamline Your <br className="hidden sm:inline" />
                <span className="text-primary">Dormitory Evaluations</span>
              </h1>
              <p className="mx-auto max-w-[42rem] text-muted-foreground sm:text-xl sm:leading-8">
                The complete platform for managing dormer performance, automating scoring,
                transparent record, and easy access to data.
              </p>
            </div>
          </div>
        </section>

        <section id="features" className="border-t bg-muted/40 py-24">
          <div className="container mx-auto px-4">
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Everything you need to manage evaluations
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Powerful features designed to make the evaluation process fair, efficient, and insightful.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              <div className="rounded-xl border bg-card p-8 shadow-sm transition-all hover:shadow-md">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <h3 className="mb-3 text-xl font-bold">Automated Scoring</h3>
                <p className="text-muted-foreground">
                  Say goodbye to manual calculations. Our system automatically aggregates scores
                  from objective and subjective criteria for accurate results.
                </p>
              </div>

              <div className="rounded-xl border bg-card p-8 shadow-sm transition-all hover:shadow-md">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h3 className="mb-3 text-xl font-bold">Transparent Feedback</h3>
                <p className="text-muted-foreground">
                  Provide dormers with clear, actionable feedback. Transparency fosters
                  trust and encourages positive behavioral changes.
                </p>
              </div>

              <div className="rounded-xl border bg-card p-8 shadow-sm transition-all hover:shadow-md">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="mb-3 text-xl font-bold">Secure Records</h3>
                <p className="text-muted-foreground">
                  Keep all evaluation history securely stored and easily accessible.
                  Track progress over semesters with historical data.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t bg-background py-12">
        <div className="text-center text-sm text-muted-foreground">
          <p>© 2025 Dormitory Evaluation System - Dohn Michael B. Varquez</p>
        </div>
      </footer>
    </div >
  );
}
