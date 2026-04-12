"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/providers/auth-provider";

const schema = z.object({
  email: z.string().email("Enter a valid email."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { login, continueAsDemo } = useAuth();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "avery@example.com",
      password: "studentreach",
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      await login(values);
      toast.success("Welcome back.");
      router.push("/discover");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to log in.");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.88fr_1.12fr] lg:items-center">
      <div className="space-y-6 px-2">
        <Logo />
        <div className="space-y-4">
          <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Student research workspace</div>
          <h1 className="font-serif text-5xl leading-tight text-foreground">Come back to your research desk.</h1>
          <p className="max-w-xl text-base leading-7 text-muted-foreground">
            Log in to continue exploring professors, refining your shortlist, and polishing outreach drafts. For local testing, demo mode is always available.
          </p>
        </div>
      </div>

      <Card className="mx-auto w-full max-w-xl bg-white/82">
        <CardHeader>
          <CardTitle>Log in</CardTitle>
          <CardDescription>
            Supabase-ready when credentials are present. Without them, the app falls back to a local demo-friendly session.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="student@example.com" {...form.register("email")} />
              <p className="text-sm text-destructive">{form.formState.errors.email?.message}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" {...form.register("password")} />
              <p className="text-sm text-destructive">{form.formState.errors.password?.message}</p>
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Logging in..." : "Log in"}
            </Button>
          </form>

          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="w-full"
            onClick={() => {
              void continueAsDemo().then(() => {
                toast.success("Demo mode ready.");
                router.push("/discover");
              });
            }}
          >
            Continue in demo mode
          </Button>

          <p className="text-sm text-muted-foreground">
            New here?{" "}
            <Link href="/signup" className="font-medium text-primary">
              Create an account
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
