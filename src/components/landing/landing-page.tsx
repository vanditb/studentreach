"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { ArrowRight, BookmarkPlus, MailCheck, Search } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { AnnotationBadge } from "@/components/shared/annotation-badge";
import { Logo } from "@/components/shared/logo";
import { ResearchTag } from "@/components/shared/research-tag";
import { SectionHeading } from "@/components/shared/section-heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const easeOut = [0.22, 1, 0.36, 1] as const;

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: index * 0.08,
      duration: 0.5,
      ease: easeOut,
    },
  }),
};

const problems = [
  "You open professor pages one by one and still are not sure who is actually a fit.",
  "You spend too long figuring out what the lab really works on beneath dense faculty bios.",
  "When it is finally time to write the email, you are guessing what to say and what to highlight.",
];

const howItWorks = [
  {
    title: "Find",
    description: "Search professors by interest, location, radius, field, and university without waiting on slow detail generation.",
    icon: Search,
  },
  {
    title: "Understand",
    description: "See What They Actually Work On, Research Breakdown, and Why This Might Be a Fit before you reach out.",
    icon: BookmarkPlus,
  },
  {
    title: "Reach out",
    description: "Draft inside a guided workspace with supportive Outreach Feedback and a clear Pre-Send Check.",
    icon: MailCheck,
  },
];

const reasons = [
  "Faster than researching faculty pages one by one",
  "Built for high school students, not grad-school assumptions",
  "Helps you know what to highlight even if your background is still early",
];

export function LandingPage() {
  return (
    <div className="min-h-screen pb-16">
      <SiteHeader />
      <main className="mx-auto w-[min(1180px,calc(100%-1.5rem))] space-y-24 py-10 sm:py-14">
        <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <motion.div initial="hidden" animate="visible" className="space-y-8">
            <motion.div custom={0} variants={fadeUp} className="space-y-4">
              <AnnotationBadge label="Built for focused professor outreach" tone="green" />
              <h1 className="max-w-3xl font-serif text-5xl leading-[1.02] text-balance text-foreground sm:text-6xl lg:text-7xl">
                Find the right professor, know what to say, know what to highlight.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                StudentReach helps high school students skip the messy research loop, understand what professors actually work on, and draft stronger outreach emails without reaching out blindly.
              </p>
            </motion.div>

            <motion.div custom={1} variants={fadeUp} className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link href="/discover">
                  Start exploring professors
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link href="/signup">Create an account</Link>
              </Button>
            </motion.div>

            <motion.div custom={2} variants={fadeUp} className="grid gap-4 sm:grid-cols-3">
              {[
                ["50+", "major US research universities"],
                ["7", "broad fields from AI to chemistry"],
                ["0", "mass email sending shortcuts"],
              ].map(([value, label]) => (
                <Card key={label} className="bg-white/72">
                  <CardContent className="p-5">
                    <div className="font-serif text-3xl text-foreground">{value}</div>
                    <div className="mt-2 text-sm leading-6 text-muted-foreground">{label}</div>
                  </CardContent>
                </Card>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.55, ease: easeOut }}
            className="paper-panel grain relative overflow-hidden rounded-[2rem] p-4 sm:p-6"
          >
            <div className="paper-grid absolute inset-0 opacity-45" />
            <div className="relative grid gap-4">
              <div className="grid gap-4 sm:grid-cols-[1.1fr_0.9fr]">
                <Card className="relative overflow-hidden bg-white/85">
                  <CardHeader className="gap-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Search desk</div>
                        <CardTitle className="mt-2">Professors near Boston working on AI for health</CardTitle>
                      </div>
                      <AnnotationBadge label="Fast results" tone="blue" />
                    </div>
                    <div className="rounded-2xl border border-border bg-background-soft px-4 py-3 text-sm text-muted-foreground">
                      Interest: trustworthy ML, health data, computer vision
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-3xl border border-border-strong bg-paper p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-serif text-xl">Elena Park</h3>
                          <p className="text-sm text-muted-foreground">Assistant Professor · UC Berkeley</p>
                        </div>
                        <AnnotationBadge label="Why This Might Be a Fit" tone="green" />
                      </div>
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">
                        Strong if you care about whether AI still works responsibly once it leaves the lab.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <ResearchTag label="trustworthy ML" />
                        <ResearchTag label="robustness" />
                        <ResearchTag label="deployment" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/92">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Professor detail</div>
                        <CardTitle className="mt-2">What They Actually Work On</CardTitle>
                      </div>
                      <AnnotationBadge label="Notes" tone="gold" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="rounded-2xl border border-border bg-background-soft p-4 text-sm leading-6 text-muted-foreground">
                      This lab studies how machine learning models behave under noisy or shifting conditions and what that means for responsible deployment.
                    </p>
                    <div className="rounded-2xl border border-border bg-white/80 p-4">
                      <div className="text-sm font-medium text-foreground">Research Breakdown</div>
                      <ul className="mt-3 space-y-3 text-sm leading-6 text-muted-foreground">
                        <li>Core question: when does a model break under distribution shift?</li>
                        <li>Methods: robustness benchmarks, targeted evaluation, deployment analysis</li>
                        <li>Good talking point: mention a project where results changed across datasets</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card id="preview" className="bg-white/86">
                <CardHeader className="flex-row items-start justify-between gap-6">
                  <div>
                    <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Draft workspace</div>
                    <CardTitle className="mt-2">Outreach Feedback</CardTitle>
                  </div>
                  <AnnotationBadge label="Pre-Send Check" tone="rust" />
                </CardHeader>
                <CardContent className="grid gap-4 lg:grid-cols-[1fr_280px]">
                  <div className="rounded-[1.6rem] border border-border-strong bg-paper-strong p-5">
                    <div className="mb-4 text-sm font-medium text-foreground">
                      Subject: High school student interested in trustworthy ML systems
                    </div>
                    <div className="space-y-3 text-sm leading-7 text-muted-foreground">
                      <p>Dear Professor Park,</p>
                      <p>
                        I found your work while looking for professors whose research connects machine learning with real-world reliability...
                      </p>
                      <p>
                        I recently built a small cell image classifier, and what interested me most was understanding why performance shifted across data splits...
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3 rounded-[1.6rem] border border-border-strong bg-background-soft p-4">
                    {[
                      "Strong opening that references the lab's actual focus",
                      "Add one paper or dataset reference for more specificity",
                      "Project mention makes your interest feel earned",
                    ].map((item) => (
                      <div key={item} className="rounded-2xl border border-border bg-white/80 p-3 text-sm leading-6 text-muted-foreground">
                        {item}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </section>

        <section id="problem" className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <SectionHeading
            eyebrow="The problem"
            title="Researching professors the old way turns one email into an entire evening."
            description="Students are asked to personalize outreach, but the raw process is slow and confusing: search, skim, decode jargon, cross-check lab pages, then write a message from scratch."
          />
          <div className="grid gap-4">
            {problems.map((problem, index) => (
              <motion.div
                key={problem}
                custom={index}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.5 }}
              >
                <Card className="relative overflow-hidden bg-white/72">
                  <CardContent className="p-6">
                    <div className="text-sm leading-7 text-muted-foreground">{problem}</div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="space-y-8">
          <SectionHeading
            eyebrow="How it works"
            title="A calmer workflow for professor research"
            description="StudentReach keeps heavy AI-style work after the click, so search stays fast and the deeper context shows up where it matters."
          />
          <div className="grid gap-5 md:grid-cols-3">
            {howItWorks.map((item, index) => (
              <motion.div
                key={item.title}
                custom={index}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.5 }}
              >
                <Card className="h-full bg-white/74">
                  <CardHeader>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border-strong bg-background-soft">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle>{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-6 text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        <section id="why-studentreach" className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <SectionHeading
            eyebrow="Why StudentReach feels different"
            title="Built like a research workspace, not a generic AI wrapper"
            description="The product stays centered on professors, but it quietly includes assistant professors too, so students discover more realistic opportunities without changing the language that draws them in."
          />
          <div className="grid gap-4">
            {reasons.map((reason, index) => (
              <motion.div
                key={reason}
                custom={index}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.5 }}
              >
                <Card className="bg-white/80">
                  <CardContent className="p-5 text-sm leading-7 text-muted-foreground">{reason}</CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="rounded-[2.2rem] border border-border-strong bg-white/78 p-8 text-center shadow-lg sm:p-12">
          <div className="mx-auto max-w-2xl space-y-5">
            <Logo className="justify-center" />
            <h2 className="font-serif text-4xl text-foreground sm:text-5xl">
              Save the hours for learning, not just faculty-page hunting.
            </h2>
            <p className="text-base leading-7 text-muted-foreground">
              Start with seeded professor data, explore the full product flow end-to-end, and plug in the real backend later without rebuilding the interface.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild size="lg">
                <Link href="/discover">Open the research desk</Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link href="/onboarding">Try onboarding</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
