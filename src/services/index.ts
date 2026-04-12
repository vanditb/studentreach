"use client";

import { StudentReachMockService } from "@/services/mock/studentreach-mock-service";

let service: StudentReachMockService | null = null;

export function getStudentReachService() {
  if (!service) {
    service = new StudentReachMockService();
  }

  return service;
}
