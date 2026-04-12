"use client";

import { Copy, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { type DraftTone, type Professor } from "@/types";

export function DraftEditor({
  professor,
  tone,
  subject,
  content,
  onToneChange,
  onSubjectChange,
  onContentChange,
  onGenerate,
  onSave,
}: {
  professor: Professor | null;
  tone: DraftTone;
  subject: string;
  content: string;
  onToneChange(value: DraftTone): void;
  onSubjectChange(value: string): void;
  onContentChange(value: string): void;
  onGenerate(): void;
  onSave(): void;
}) {
  return (
    <Card className="bg-white/82">
      <CardHeader className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <CardTitle>Draft Editor</CardTitle>
            <p className="text-sm leading-6 text-muted-foreground">
              Students copy the final email and send it themselves. This workspace is for drafting and coaching only.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={onGenerate} disabled={!professor}>
              Generate draft
            </Button>
            <Button variant="outline" onClick={onSave}>
              <Save className="h-4 w-4" />
              Save draft
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                void navigator.clipboard.writeText(content);
                toast.success("Draft copied to clipboard.");
              }}
              disabled={!content}
            >
              <Copy className="h-4 w-4" />
              Copy
            </Button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <RadioGroup
            value={tone}
            onValueChange={(next) => onToneChange(next as DraftTone)}
            className="grid gap-3 md:col-span-3 md:grid-cols-3"
          >
            {([
              ["curious", "Curious / exploratory"],
              ["project-based", "Project-based"],
              ["formal", "More formal"],
            ] as const).map(([value, label]) => (
              <label key={value} className="flex items-center gap-3 rounded-[1.4rem] border border-border bg-background-soft px-4 py-3">
                <RadioGroupItem value={value} />
                <span className="text-sm font-medium text-foreground">{label}</span>
              </label>
            ))}
          </RadioGroup>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="subject">Subject</Label>
          <Input id="subject" value={subject} onChange={(event) => onSubjectChange(event.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="content">Draft</Label>
          <Textarea
            id="content"
            className="min-h-[380px] leading-7"
            value={content}
            onChange={(event) => onContentChange(event.target.value)}
            placeholder="Generate a draft or start writing here..."
          />
        </div>
      </CardContent>
    </Card>
  );
}
