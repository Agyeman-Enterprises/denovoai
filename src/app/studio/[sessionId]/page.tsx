"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { JobStatus } from "@/types/denovo";

export default function SessionProgressPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const jobId = searchParams.get("jobId");
  const appId = searchParams.get("appId");
  const [job, setJob] = useState<JobStatus | null>(null);

  const pollJob = useCallback(async () => {
    if (!jobId) return;
    const res = await fetch(`/api/denovo/assemble/${jobId}`);
    const data = await res.json();
    setJob(data);
    return data.stage;
  }, [jobId]);

  useEffect(() => {
    if (!jobId) return;
    pollJob();
    const interval = setInterval(async () => {
      const stage = await pollJob();
      if (stage === "done" || stage === "error") {
        clearInterval(interval);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [jobId, pollJob]);

  if (!jobId) {
    return (
      <>
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">No active build job.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <Card className="w-full max-w-lg">
          <h2 className="text-xl font-bold">
            {job?.stage === "done" ? "Your app is ready!" : job?.stage === "error" ? "Build failed" : "Building your app..."}
          </h2>

          {/* Progress bar */}
          <div className="mt-6">
            <div className="h-2 w-full rounded-full bg-secondary">
              <div
                className="h-2 rounded-full bg-primary transition-all duration-500"
                style={{ width: `${job?.progress || 0}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground text-right">{job?.progress || 0}%</p>
          </div>

          {/* Log messages */}
          <div className="mt-4 space-y-1.5 max-h-48 overflow-y-auto">
            {(job?.log || []).map((msg, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="text-primary">&#10003;</span>
                <span className="text-muted-foreground">{msg}</span>
              </div>
            ))}
          </div>

          {/* Error */}
          {job?.stage === "error" && (
            <div className="mt-4 rounded-lg bg-destructive/10 border border-destructive/30 p-3">
              <p className="text-sm text-red-400">{job.error}</p>
            </div>
          )}

          {/* Success actions */}
          {job?.stage === "done" && job.result && (
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              {job.result.type === "deploy" ? (
                <>
                  {job.result.domain && (
                    <a href={job.result.domain} target="_blank" rel="noopener noreferrer" className="flex-1">
                      <Button className="w-full">Open App</Button>
                    </a>
                  )}
                  {job.result.giteaUrl && (
                    <a href={job.result.giteaUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
                      <Button variant="outline" className="w-full">View Repo</Button>
                    </a>
                  )}
                </>
              ) : (
                <>
                  {job.result.downloadUrl && (
                    <a href={job.result.downloadUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
                      <Button className="w-full">Download</Button>
                    </a>
                  )}
                </>
              )}
              <Link href="/dashboard" className="flex-1">
                <Button variant="secondary" className="w-full">Go to Dashboard</Button>
              </Link>
            </div>
          )}
        </Card>
      </main>
    </>
  );
}
