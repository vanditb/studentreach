"use client";

import { FIELDS, TITLES, type Field, type ProfessorTitle } from "@/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function SearchFilters({
  field,
  university,
  universities,
  titles,
  onFieldChange,
  onUniversityChange,
  onTitleChange,
}: {
  field?: Field | "All";
  university?: string | "All";
  universities: string[];
  titles?: ProfessorTitle[];
  onFieldChange(value: Field | "All"): void;
  onUniversityChange(value: string | "All"): void;
  onTitleChange(value: ProfessorTitle, checked: boolean): void;
}) {
  return (
    <div className="space-y-5 rounded-[1.8rem] border border-border-strong bg-white/72 p-5">
      <div className="space-y-2">
        <div className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Field</div>
        <Select value={field ?? "All"} onValueChange={(value) => onFieldChange(value as Field | "All")}>
          <SelectTrigger>
            <SelectValue placeholder="All fields" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All fields</SelectItem>
            {FIELDS.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <div className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">University</div>
        <Select value={university ?? "All"} onValueChange={(value) => onUniversityChange(value)}>
          <SelectTrigger>
            <SelectValue placeholder="All universities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All universities</SelectItem>
            {universities.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <div className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Titles included</div>
        <div className="space-y-3">
          {TITLES.map((title) => (
            <label key={title} className="flex items-center gap-3 rounded-2xl border border-border bg-background-soft px-3 py-3">
              <Checkbox checked={titles?.includes(title)} onCheckedChange={(checked) => onTitleChange(title, Boolean(checked))} />
              <div className="space-y-1">
                <Label className="cursor-pointer">{title}</Label>
                {title === "Assistant Professor" ? (
                  <p className="text-sm text-muted-foreground">Included in results naturally, even though the product speaks in terms of professors.</p>
                ) : null}
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
