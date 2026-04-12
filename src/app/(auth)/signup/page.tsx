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
  name: z.string().min(2, "Enter your name."),
  email: z.string().email("Enter a valid email."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

type FormValues = z.infer<typeof schema>;

export default function SignupPage() {
  const router = useRouter();
  const { signup, continueAsDemo } = useAuth();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "Avery Chen",
      email: "avery@example.com",
      password: "studentreach",
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      await signup(values);
      toast.success("Account ready.");
      router.push("/onboarding");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create account.");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.88fr_1.12fr] lg:items-center">
      <div className="space-y-6 px-2">
        <Logo />
        <div className="space-y-4">
          <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Built for high school outreach</div>
          <h1 className="font-serif text-5xl leading-tight text-foreground">Create your StudentReach desk.</h1>
          <p className="max-w-xl text-base leading-7 text-muted-foreground">
            Save your research notes, keep a shortlist of professors, and refine outreach drafts in one place. You can also skip straight into demo mode and explore now.
          </p>
        </div>
      </div>

      <Card className="mx-auto w-full max-w-xl bg-white/82">
        <CardHeader>
          <CardTitle>Create an account</CardTitle>
          <CardDescription>
            Start with a lightweight profile now. You can revise your interests, projects, and resume details any time.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="Avery Chen" {...form.register("name")} />
              <p className="text-sm text-destructive">{form.formState.errors.name?.message}</p>
            </div>
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
              {form.formState.isSubmitting ? "Creating account..." : "Create account"}
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
            Explore in demo mode
          </Button>

          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary">
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
