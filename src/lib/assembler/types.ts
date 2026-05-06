import type { SlotMap as FrontendSlotMap } from "@/types/denovo";
import type { JobStage, OutputType } from "@/types/database";

export type { FrontendSlotMap as SlotMap };

export interface AssembleJob {
  id: string;
  appId: string;
  stage: JobStage;
  progress: number;
  log: string[];
  outputType: OutputType;
  result?: JobResult;
  error?: string;
}

export interface JobResult {
  type: OutputType;
  giteaUrl?: string;
  coolifyAppId?: string;
  domain?: string;
  downloadUrl?: string;
}
