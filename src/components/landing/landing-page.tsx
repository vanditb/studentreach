"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, type Variants } from "framer-motion";
import { ArrowRight, Search } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { seededLocations } from "@/data/seed/locations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: index * 0.08,
      duration: 0.5,
      ease,
    },
  }),
};

const interestOptions = [
  "Biology & Life Sciences",
  "Medicine & Health",
  "Neuroscience (Brain & Behavior)",
  "Psychology",
  "Chemistry",
  "Physics & Astronomy",
  "Environmental Science & Climate",
  "Computer Science & AI",
  "Data Science & Statistics",
  "Engineering (General)",
  "Robotics",
  "Business & Finance",
  "Economics",
  "Political Science & Government",
  "Sociology & Social Issues",
  "Anthropology & Culture",
  "Education & Learning",
  "Law & Public Policy",
  "History & Philosophy",
  "Art, Media & Design",
] as const;

const stateOptions = [
  "Alabama",
  "Alaska",
  "Arizona",
  "Arkansas",
  "California",
  "Colorado",
  "Connecticut",
  "Delaware",
  "Florida",
  "Georgia",
  "Hawaii",
  "Idaho",
  "Illinois",
  "Indiana",
  "Iowa",
  "Kansas",
  "Kentucky",
  "Louisiana",
  "Maine",
  "Maryland",
  "Massachusetts",
  "Michigan",
  "Minnesota",
  "Mississippi",
  "Missouri",
  "Montana",
  "Nebraska",
  "Nevada",
  "New Hampshire",
  "New Jersey",
  "New Mexico",
  "New York",
  "North Carolina",
  "North Dakota",
  "Ohio",
  "Oklahoma",
  "Oregon",
  "Pennsylvania",
  "Rhode Island",
  "South Carolina",
  "South Dakota",
  "Tennessee",
  "Texas",
  "Utah",
  "Vermont",
  "Virginia",
  "Washington",
  "West Virginia",
  "Wisconsin",
  "Wyoming",
] as const;

const storyViews = {
  results: {
    title: "Results",
    eyebrow: "Search simulation",
  },
  profile: {
    title: "Profile",
    eyebrow: "Professor view",
  },
  email: {
    title: "Email",
    eyebrow: "Draft guidance",
  },
} as const;

const miniDemoResults = [
  { name: "Sarah Kim", university: "Rutgers", tag: "medical imaging" },
  { name: "David Park", university: "Columbia", tag: "clinical ML" },
  { name: "Anika Shah", university: "NYU", tag: "health data systems" },
] as const;

const studentVoices = [
  {
    name: "Kevin Chen",
    school: "Westfield High School",
    note:
      "I used to open a bunch of professor pages and still not know who to email. This made it way easier to narrow it down and I actually got a research opportunity out of it.",
    interest: "Math / AI",
  },
  {
    name: "Aisha Khan",
    school: "Arcadia High School",
    note:
      "The biggest help for me was figuring out what to say without sounding random. I liked that I could actually understand the professor before writing anything.",
    interest: "Pre-med / public health",
  },
  {
    name: "Jason Park",
    school: "Plano East Senior High School",
    note:
      "I’m not the type to spend hours researching every department page, so having everything feel shorter and more direct was huge. It made reaching out feel less awkward.",
    interest: "Business / econ",
  },
  {
    name: "Mei Lin Zhang",
    school: "Naperville Central High School",
    note:
      "I liked seeing professors who were actually a fit instead of just guessing from titles. It helped me write a much more specific email and I got a response back faster than I expected.",
    interest: "Engineering / STEM",
  },
  {
    name: "Ryan Patel",
    school: "Lake Braddock Secondary School",
    note:
      "Usually I put off cold emails because I never know how to start. Here it felt more like filling in the right details than starting from a blank page.",
    interest: "Computers / robotics",
  },
] as const;

const coldEmailViews = {
  generic: {
    label: "Too generic",
    lines: [
      "Dear Professor,",
      "I am very interested in your work and would love to learn more about what you do in your lab.",
      "I am passionate about biology and science, and I think your research sounds very exciting.",
      "I would really appreciate any opportunity to get involved or hear more about your work.",
      "Thank you for your time.",
    ],
    note: "It sounds polite, but it could have been sent to anyone.",
  },
  better: {
    label: "Better version",
    lines: [
      "Dear Professor Park,",
      "I found your work while looking for professors studying reliable machine learning in healthcare, and I was especially interested in how your research handles data shifts in medical settings.",
      "I recently built a small image-classification project for a school assignment, and it made me curious about what happens when a model meets real-world data that looks different from the training set.",
      "That connection is what made your work stand out to me.",
      "I would love to learn more about how students in your group start exploring these kinds of questions.",
    ],
    note: "Short, specific, and clearly tied to the professor's work.",
  },
} as const;

function toLocationLabel(value: string) {
  return value
    .split(",")
    .map((part) =>
      part
        .trim()
        .split(" ")
        .map((word) => (word ? word[0]!.toUpperCase() + word.slice(1) : word))
        .join(" "),
    )
    .join(", ");
}

function filterSuggestions(query: string, options: string[]) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return options;
  }

  const startsWith = options.filter((option) => option.toLowerCase().startsWith(normalized));
  const includes = options.filter(
    (option) => option.toLowerCase().includes(normalized) && !startsWith.includes(option),
  );

  return [...startsWith, ...includes];
}

function SuggestionField({
  value,
  onChange,
  placeholder,
  ariaLabel,
  suggestions,
}: {
  value: string;
  onChange(value: string): void;
  placeholder: string;
  ariaLabel: string;
  suggestions: string[];
}) {
  const [open, setOpen] = useState(false);
  const filtered = useMemo(() => filterSuggestions(value, suggestions), [suggestions, value]);

  return (
    <div className="relative">
      <Input
        aria-label={ariaLabel}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        placeholder={placeholder}
        className="h-14 rounded-[1.2rem] border-white/80 bg-white/95"
      />
      <div
        className={cn(
          "absolute left-0 right-0 top-[calc(100%+0.55rem)] z-50 overflow-hidden rounded-[1rem] border border-border-strong bg-paper/98 shadow-[0_20px_44px_rgba(18,24,38,0.1)] backdrop-blur-sm transition-all",
          open && filtered.length ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <div className="max-h-[11.5rem] overflow-y-auto p-2">
          {filtered.map((option) => (
            <button
              key={option}
              type="button"
              className="block w-full rounded-[0.9rem] px-3 py-3 text-left text-sm leading-5 text-foreground hover:bg-background-soft"
              onMouseDown={(event) => {
                event.preventDefault();
                onChange(option);
                setOpen(false);
              }}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function LandingPage() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [location, setLocation] = useState("");
  const [activeEmailCard, setActiveEmailCard] = useState<"generic" | "better" | null>(null);

  const locationOptions = useMemo(
    () => [...stateOptions, ...seededLocations.map((option) => toLocationLabel(option.key))],
    [],
  );

  function handleSearch() {
    const query = new URLSearchParams({
      topic,
      location,
    });
    router.push(`/discover?${query.toString()}`);
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main>
        <section className="relative border-b border-border">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(47,93,124,0.2),transparent_24%),radial-gradient(circle_at_78%_18%,rgba(47,93,124,0.14),transparent_22%),linear-gradient(180deg,rgba(244,241,234,0.76),rgba(244,241,234,0.98))]" />
          <motion.div
            aria-hidden="true"
            className="paper-grid absolute inset-0 opacity-40"
            initial={{ opacity: 0.2 }}
            animate={{ opacity: 0.4 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
          <motion.div
            aria-hidden="true"
            className="absolute left-[4%] top-14 h-48 w-48 rounded-full bg-primary/12 blur-3xl"
            animate={{ y: [0, -12, 0], opacity: [0.26, 0.42, 0.26] }}
            transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          />
          <motion.div
            aria-hidden="true"
            className="absolute right-[8%] top-10 h-60 w-60 rounded-full bg-primary/10 blur-3xl"
            animate={{ y: [0, 16, 0], opacity: [0.18, 0.34, 0.18] }}
            transition={{ duration: 12, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          />

          <div className="relative mx-auto w-[min(1180px,calc(100%-1.5rem))] py-14 sm:py-20">
            <motion.div initial="hidden" animate="visible" className="mx-auto max-w-5xl space-y-10 text-center">
              <motion.div custom={0} variants={fadeUp} className="space-y-5">
                <h1 className="mx-auto max-w-4xl font-serif text-5xl leading-[0.96] tracking-[-0.05em] text-balance text-foreground sm:text-6xl lg:text-[5rem]">
                  Find the right professor, know what to say, know what to highlight.
                </h1>
                <p className="mx-auto max-w-3xl text-lg leading-8 text-muted-foreground">
                  StudentReach helps high school students <span className="font-medium text-foreground">find professors faster</span>,{" "}
                  <span className="font-medium text-foreground">understand their work clearly</span>, and{" "}
                  <span className="font-medium text-foreground">write emails that don’t get ignored</span>.
                </p>
              </motion.div>

              <motion.div
                custom={1}
                variants={fadeUp}
                className="relative z-30 mx-auto w-full max-w-4xl rounded-[2rem] border border-border-strong bg-paper/92 p-5 shadow-[0_24px_60px_rgba(18,24,38,0.1)] backdrop-blur-sm sm:p-6"
              >
                <div className="mb-5 text-left text-sm font-medium text-foreground">Search professors</div>
                <div className="grid gap-3 md:grid-cols-[1.25fr_1fr_auto]">
                  <SuggestionField
                    ariaLabel="Research interest"
                    value={topic}
                    onChange={setTopic}
                    placeholder="Example: biology"
                    suggestions={[...interestOptions]}
                  />
                  <SuggestionField
                    ariaLabel="Location"
                    value={location}
                    onChange={setLocation}
                    placeholder="Example: Massachusetts"
                    suggestions={locationOptions}
                  />
                  <Button type="button" onClick={handleSearch} className="h-14 min-w-[180px] rounded-[1.15rem] w-full md:w-auto">
                    <Search className="h-4 w-4" />
                    Search
                  </Button>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span>Choose an interest, then type a state or city.</span>
                  <span className="hidden h-1 w-1 rounded-full bg-border-strong sm:block" />
                  <span>Includes professors and assistant professors.</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        <section className="py-8">
          <div className="mx-auto w-[min(1180px,calc(100%-1.5rem))]">
            <div className="border-y border-primary/12 py-5">
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0">
                {[
                  { value: "650+", label: "students" },
                  { value: "1,300+", label: "drafts written" },
                  { value: "50+", label: "universities" },
                  { value: "1,000+", label: "professors" },
                ].map((item, index) => (
                  <div
                    key={item.label}
                    className={cn(
                      "px-2 lg:px-6",
                      index > 0 && "lg:border-l lg:border-primary/12",
                    )}
                  >
                    <div className="text-center lg:text-left">
                      <div className="font-serif text-4xl tracking-[-0.05em] text-primary">{item.value}</div>
                      <div className="mt-1 text-sm leading-6 text-muted-foreground">{item.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="section-rule">
          <div className="mx-auto w-[min(1180px,calc(100%-1.5rem))] py-16">
            <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
              <div className="max-w-xl">
                <div className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Why it helps</div>
                <h2 className="mt-3 font-serif text-4xl tracking-[-0.03em] text-foreground">
                  A simple process that somehow takes forever.
                </h2>
                <p className="mt-4 text-base leading-7 text-muted-foreground">
                  Most students are not missing motivation. They are missing a faster way to find the right professor,
                  understand what matters, and write a message that feels real.
                </p>
              </div>

              <div className="space-y-4">
                {[
                  {
                    title: "Finding the right professors takes too long.",
                    note: "You open page after page and still are not sure where to start.",
                  },
                  {
                    title: "It’s hard to tell who is actually a good fit.",
                    note: "A department page rarely tells you what someone really works on.",
                  },
                  {
                    title: "Writing the email is often the hardest part.",
                    note: "Most students know they should personalize it, but not what to say.",
                  },
                ].map((item, index) => (
                  <motion.div
                    key={item.title}
                    custom={index}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.45 }}
                    variants={fadeUp}
                    className="relative rounded-[1.35rem] border border-primary/12 bg-paper p-5 pl-8 shadow-[0_14px_28px_rgba(18,24,38,0.04)] sm:p-6 sm:pl-10"
                  >
                    <div className="absolute left-5 top-6 h-10 w-[3px] rounded-full bg-primary/55" />
                    <div className="flex items-start gap-4">
                      <div className="rounded-full bg-primary/[0.09] px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-primary">
                        0{index + 1}
                      </div>
                      <div>
                        <div className="text-lg font-medium leading-8 text-foreground">{item.title}</div>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{item.note}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="section-rule">
          <div className="mx-auto grid w-[min(1180px,calc(100%-1.5rem))] gap-10 py-16 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
            <div className="max-w-xl">
              <div className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Mini demo</div>
              <h2 className="mt-3 font-serif text-4xl tracking-[-0.03em] text-foreground">
                See the search, profile, and email flow in one place.
              </h2>
              <div className="mt-8 space-y-8">
                {[
                  {
                    number: "01",
                    title: "Find",
                    text: "Search professors by interest and location.",
                  },
                  {
                    number: "02",
                    title: "Understand",
                    text: "See what they work on and why they might be a fit.",
                  },
                  {
                    number: "03",
                    title: "Reach out",
                    text: "Write your email with simple guidance.",
                  },
                ].map((item) => (
                  <div key={item.number} className="flex gap-4">
                    <div className="pt-1 text-sm font-medium text-primary">{item.number}</div>
                    <div>
                      <div className="text-xl font-medium text-foreground">{item.title}</div>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:sticky lg:top-24">
              <div className="rounded-[1.8rem] border border-[#2a4962] bg-[#20364a] p-5 shadow-[0_22px_54px_rgba(18,24,38,0.14)]">
                <Tabs defaultValue="results" className="w-full">
                  <TabsList className="w-full justify-start rounded-[1rem] bg-white/10 p-1">
                    {Object.entries(storyViews).map(([key, view]) => (
                      <TabsTrigger key={key} value={key} className="text-white data-[state=active]:text-primary">
                        {view.title}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  <TabsContent value="results" className="space-y-4">
                    <div className="text-sm text-white/70">Search results</div>
                    <div className="space-y-3">
                      {miniDemoResults.map((result, index) => (
                        <motion.div
                          key={`results-${result.name}`}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.06, duration: 0.25 }}
                          className="rounded-[1.2rem] border border-border bg-background-soft p-4"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="font-medium text-foreground">{result.name}</div>
                              <div className="text-sm text-muted-foreground">{result.university}</div>
                            </div>
                            <div className="rounded-full bg-white px-3 py-1 text-xs font-medium text-primary shadow-sm">
                              {result.tag}
                            </div>
                          </div>
                          <p className="mt-3 text-sm leading-6 text-muted-foreground">
                            Good fit if you want work that feels close to machine learning in healthcare.
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="profile" className="space-y-4">
                    <div className="text-sm text-white/70">Professor profile</div>
                    <div className="rounded-[1.25rem] border border-border bg-background-soft p-5">
                      <div className="font-serif text-3xl tracking-[-0.03em] text-foreground">Sarah Kim</div>
                      <div className="mt-1 text-sm text-muted-foreground">Associate Professor · Rutgers</div>
                      <div className="mt-5 flex flex-wrap gap-2">
                        {["health data", "machine learning", "medical imaging"].map((tag) => (
                          <div key={tag} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-primary shadow-sm">
                            {tag}
                          </div>
                        ))}
                      </div>
                      <div className="mt-5 rounded-[1rem] border border-border bg-paper p-4">
                        <div className="text-sm font-medium text-foreground">What they work on</div>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          Builds tools that help medical teams use machine learning on real clinical data without losing reliability.
                        </p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="email" className="space-y-4">
                    <div className="text-sm text-white/70">Email draft</div>
                    <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                      <div className="rounded-[1.2rem] border border-border bg-background-soft p-5">
                        <div className="text-sm leading-7 text-foreground">
                          Dear Professor Kim,
                          <br />
                          <br />
                          I found your work while looking for professors using machine learning in medical settings. I was especially interested in how your research connects reliable models with real clinical data.
                        </div>
                      </div>
                      <div className="space-y-3">
                        {[
                          "Mention something specific",
                          "Keep it short",
                          "Show real interest",
                        ].map((item) => (
                          <div
                            key={item}
                            className="rounded-[1rem] border border-white/12 bg-white/8 p-4 text-sm text-white shadow-sm"
                          >
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </section>

        <section className="section-rule">
          <div className="mx-auto grid w-[min(1180px,calc(100%-1.5rem))] gap-10 py-16 lg:grid-cols-[0.74fr_1.26fr] lg:items-start">
            <div className="max-w-xl lg:sticky lg:top-24">
              <div className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Student voices</div>
              <h2 className="mt-3 font-serif text-4xl tracking-[-0.03em] text-foreground">
                The kind of feedback that makes students keep using it.
              </h2>
              <p className="mt-4 text-base leading-7 text-muted-foreground">
                Different schools, different interests, same problem: finding a professor and writing the first email
                takes too long. Students want something that helps them move faster without sounding generic.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {studentVoices.map((voice, index) => (
                <motion.article
                  key={`${voice.name}-${voice.school}`}
                  custom={index}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.25 }}
                  variants={fadeUp}
                  className={cn(
                    "relative rounded-[1.5rem] border p-5 shadow-[0_14px_30px_rgba(18,24,38,0.05)] transition-transform duration-300 hover:-translate-y-1",
                    index % 3 === 1
                      ? "border-[#2a4962] bg-[#20364a] text-white md:translate-y-8"
                      : "border-primary/12 bg-paper",
                    index === 4 && "md:-translate-y-6",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div
                        className={cn(
                          "text-sm font-medium",
                          index % 3 === 1 ? "text-white" : "text-foreground",
                        )}
                      >
                        {voice.name}
                      </div>
                      <div
                        className={cn(
                          "mt-1 text-xs uppercase tracking-[0.14em]",
                          index % 3 === 1 ? "text-white/62" : "text-muted-foreground",
                        )}
                      >
                        {voice.school}
                      </div>
                    </div>
                    <div
                      className={cn(
                        "rounded-full px-3 py-1 text-[11px] font-medium",
                        index % 3 === 1
                          ? "bg-white/12 text-white"
                          : "bg-primary/[0.08] text-primary",
                      )}
                    >
                      {voice.interest}
                    </div>
                  </div>
                  <p
                    className={cn(
                      "mt-5 text-[15px] leading-7",
                      index % 3 === 1 ? "text-white/82" : "text-foreground/88",
                    )}
                  >
                    “{voice.note}”
                  </p>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section id="preview" className="section-rule">
          <div className="mx-auto w-[min(1180px,calc(100%-1.5rem))] py-16">
            <div className="relative overflow-hidden rounded-[2.2rem] bg-[#20364a] px-6 py-8 text-white shadow-[0_30px_80px_rgba(18,24,38,0.16)] sm:px-8 sm:py-10 lg:px-10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.08),transparent_22%),radial-gradient(circle_at_82%_20%,rgba(255,255,255,0.06),transparent_20%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0))]" />
              <div className="paper-grid absolute inset-0 opacity-[0.08]" />

              <div className="relative grid gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
                <div className="max-w-xl">
                  <div className="text-xs font-medium uppercase tracking-[0.22em] text-white/65">
                    The truth about cold emails
                  </div>
                  <h2 className="mt-4 font-serif text-5xl leading-[0.98] tracking-[-0.04em] text-white">
                    Most emails get ignored.
                  </h2>
                  <p className="mt-5 text-lg leading-8 text-white/78">
                    Not because students aren&apos;t smart, but because they don&apos;t know what to say.
                  </p>
                  <p className="mt-5 max-w-lg text-base leading-7 text-white/72">
                    The goal is not to sound impressive. The goal is to sound{" "}
                    <span className="font-medium text-white">specific</span>,{" "}
                    <span className="font-medium text-white">thoughtful</span>, and{" "}
                    <span className="font-medium text-white">real</span>.
                  </p>
                </div>

                <div className="relative min-h-[31rem] lg:min-h-[35rem]">
                  <motion.div
                    onHoverStart={() => setActiveEmailCard("generic")}
                    onHoverEnd={() => setActiveEmailCard((current) => (current === "generic" ? null : current))}
                    animate={
                      activeEmailCard === "generic"
                        ? { y: -14, x: -8, rotate: -1.2, scale: 1.03 }
                        : activeEmailCard === "better"
                          ? { y: 12, x: -24, rotate: -3.8, scale: 0.98 }
                          : { y: 0, x: 0, rotate: -2, scale: 1 }
                    }
                    initial={{ opacity: 0, y: 18, rotate: -3 }}
                    whileInView={{ opacity: 1, y: 0, rotate: -2 }}
                    viewport={{ once: true, amount: 0.45 }}
                    transition={{ duration: 0.28, ease: "easeOut" }}
                    className={cn(
                      "absolute left-0 top-10 w-full max-w-[27rem] cursor-default rounded-[1.6rem] border border-[#d9d6cf] bg-[#f8f5ee] p-7 text-[#162033] shadow-[0_16px_36px_rgba(18,24,38,0.12)]",
                      activeEmailCard === "generic" ? "z-30 shadow-[0_30px_60px_rgba(18,24,38,0.22)]" : "z-10",
                    )}
                  >
                    <div className="text-xs font-medium uppercase tracking-[0.18em] text-[#7b8695]">
                      Too generic
                    </div>
                    <div className="mt-4 min-h-[14rem] space-y-3 text-[15px] leading-7">
                      {coldEmailViews.generic.lines.map((line) => (
                        <div key={line}>{line}</div>
                      ))}
                    </div>
                    <div className="mt-5 border-t border-[#d9d6cf] pt-4 text-sm leading-6 text-[#5d6673]">
                      {coldEmailViews.generic.note}
                    </div>
                  </motion.div>

                  <motion.div
                    onHoverStart={() => setActiveEmailCard("better")}
                    onHoverEnd={() => setActiveEmailCard((current) => (current === "better" ? null : current))}
                    animate={
                      activeEmailCard === "better"
                        ? { y: -16, x: 12, rotate: 0.4, scale: 1.03 }
                        : activeEmailCard === "generic"
                          ? { y: 16, x: 24, rotate: 2.6, scale: 0.98 }
                          : { y: 0, x: 0, rotate: 1.5, scale: 1 }
                    }
                    initial={{ opacity: 0, y: 22, rotate: 2 }}
                    whileInView={{ opacity: 1, y: 0, rotate: 1.5 }}
                    viewport={{ once: true, amount: 0.45 }}
                    transition={{ duration: 0.28, delay: 0.04, ease: "easeOut" }}
                    className={cn(
                      "absolute right-0 top-0 w-full max-w-[29rem] cursor-default rounded-[1.7rem] border border-white/70 bg-white p-7 text-[#162033] shadow-[0_22px_52px_rgba(18,24,38,0.18)]",
                      activeEmailCard === "better" ? "z-30 shadow-[0_34px_64px_rgba(18,24,38,0.24)]" : "z-20",
                    )}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="text-xs font-medium uppercase tracking-[0.18em] text-[#5f6d7f]">
                        Better version
                      </div>
                      <div className="rounded-full bg-primary/8 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-primary">
                        Specific
                      </div>
                    </div>
                    <div className="mt-4 min-h-[16rem] space-y-3 text-[15px] leading-7">
                      {coldEmailViews.better.lines.map((line) => (
                        <div key={line}>{line}</div>
                      ))}
                    </div>
                    <div className="mt-5 border-t border-border pt-4 text-sm leading-6 text-muted-foreground">
                      {coldEmailViews.better.note}
                    </div>
                  </motion.div>

                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section-rule">
          <div className="mx-auto flex w-[min(1180px,calc(100%-1.5rem))] flex-col items-start gap-6 py-16 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <h2 className="font-serif text-4xl tracking-[-0.03em] text-foreground">Start finding professors.</h2>
              <p className="mt-3 text-base leading-7 text-muted-foreground">
                Search by interest and location, save the best fits, and write a stronger email.
              </p>
            </div>
            <Button asChild size="lg">
              <Link href="/signup">
                Create account
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
