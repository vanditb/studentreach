"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getStudentReachService } from "@/services";
import {
  type DraftGenerationInput,
  type OnboardingState,
  type OutreachDraft,
  type SearchParams,
  type StudentProfile,
} from "@/types";

const service = getStudentReachService();

export function useProfessorSearch(params: SearchParams) {
  return useQuery({
    queryKey: ["professors", params],
    queryFn: () => service.searchProfessors(params),
  });
}

export function useProfessor(id: string) {
  return useQuery({
    queryKey: ["professor", id],
    queryFn: () => service.getProfessor(id),
    enabled: Boolean(id),
  });
}

export function useProfessorInsights(id: string) {
  return useQuery({
    queryKey: ["professor-insights", id],
    queryFn: () => service.getProfessorInsights(id),
    enabled: Boolean(id),
  });
}

export function useShortlist() {
  return useQuery({
    queryKey: ["shortlist"],
    queryFn: () => service.getShortlist(),
  });
}

export function useToggleShortlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => service.toggleShortlist(id),
    onSuccess: (data) => {
      queryClient.setQueryData(["shortlist"], data);
    },
  });
}

export function useDrafts() {
  return useQuery({
    queryKey: ["drafts"],
    queryFn: () => service.getDrafts(),
  });
}

export function useDraft(id?: string) {
  return useQuery({
    queryKey: ["draft", id],
    queryFn: () => service.getDraft(id!),
    enabled: Boolean(id),
  });
}

export function useGenerateDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: DraftGenerationInput) => service.generateDraft(input),
    onSuccess: (draft) => {
      queryClient.invalidateQueries({ queryKey: ["drafts"] });
      queryClient.setQueryData(["draft", draft.id], draft);
    },
  });
}

export function useSaveDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (draft: OutreachDraft) => service.saveDraft(draft),
    onSuccess: (draft) => {
      queryClient.invalidateQueries({ queryKey: ["drafts"] });
      queryClient.setQueryData(["draft", draft.id], draft);
    },
  });
}

export function useAnalyzeDraft() {
  return useMutation({
    mutationFn: ({ content, professorId }: { content: string; professorId: string }) =>
      service.analyzeDraft(content, professorId),
  });
}

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: () => service.getProfile(),
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (profile: StudentProfile) => service.updateProfile(profile),
    onSuccess: (profile) => {
      queryClient.setQueryData(["profile"], profile);
    },
  });
}

export function useOnboarding() {
  return useQuery({
    queryKey: ["onboarding"],
    queryFn: () => service.getOnboarding(),
  });
}

export function useSaveOnboarding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (state: OnboardingState) => service.saveOnboarding(state),
    onSuccess: (state) => {
      queryClient.setQueryData(["onboarding"], state);
      queryClient.setQueryData(["profile"], state.profile);
    },
  });
}

export function useUniversities() {
  return useQuery({
    queryKey: ["universities"],
    queryFn: () => service.getUniversities(),
  });
}
