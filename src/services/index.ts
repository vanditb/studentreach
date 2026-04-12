"use client";

import { ApiStudentReachService } from "@/services/api-studentreach-service";

let service: ApiStudentReachService | null = null;

export function getStudentReachService() {
  if (!service) {
    service = new ApiStudentReachService();
  }

  return service;
}
