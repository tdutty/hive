"use client";

import { useState } from "react";
import { Plus, Play, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useApi } from "@/lib/hooks";
import { scrapingService } from "@/lib/services/scraping";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Modal } from "@/components/ui/Modal";
import { ErrorBanner, Spinner } from "@/components/ui/AsyncState";
import { Button, Card, CardHeader, CardBody, Badge, statusTone, StatTile, PageHeader, Table, THead, TH, TBody, TR, TD, Field, Input, Select } from "@/components/kit";
import { formatNumber } from "@/lib/utils";

// POST /api/admin/scraping/jobs has no backend handler yet (returns 405).
const JOB_SUBMIT_UNAVAILABLE = "Job submission is not available yet: the scraping jobs endpoint has no backend handler.";

const capitalize = (v: string | null | undefined) => (v ? v.charAt(0).toUpperCase() + v.slice(1) : "-");
const stageProgress = (status: string | undefined, inProgress: number) => (status === "completed" ? 100 : status === "in progress" ? inProgress : 0);

export default function ScrapingPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [jobConfig, setJobConfig] = useState({
    targets: "all",
    maxListings: "20000",
    includeCompetitors: true,
  });

  // Fetch jobs
  const {
    data: jobsData,
    loading: jobsLoading,
    error: jobsError,
    refetch: refetchJobs
  } = useApi(
    () => scrapingService.getJobs({ limit: 20 }),
    []
  );

  // Fetch sites
  const {
    data: sitesData,
    loading: sitesLoading,
    error: sitesError,
    refetch: refetchSites
  } = useApi(
    () => scrapingService.getSites(),
    []
  );

  // Fetch config
  const {
    loading: configLoading,
    error: configError,
    refetch: refetchConfig
  } = useApi(
    () => scrapingService.getConfig(),
    []
  );

  const activeJobs: any[] = jobsData?.jobs?.filter((j: any) => j.status === "running") || [];
  const completedJobs: any[] = jobsData?.jobs?.filter((j: any) => j.status !== "running") || [];

  const totalJobs = jobsData?.total || 0;
  const completedJobsCount = completedJobs.filter((j) => j.status === "completed").length;
  const failedJobsCount = completedJobs.filter((j) => j.status === "failed").length;

  const handleStartJob = () => {
    setJobConfig({
      targets: "all",
      maxListings: "20000",
      includeCompetitors: true,
    });
    setIsModalOpen(true);
  };

  const handleSubmitJob = async () => {
    try {
      // Start job through API endpoint
      const res = await fetch("/api/admin/scraping/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targets: jobConfig.targets,
          maxListings: parseInt(jobConfig.maxListings),
          includeCompetitors: jobConfig.includeCompetitors,
        }),
      });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      setIsModalOpen(false);
      toast.success("Scraping job started");
      await refetchJobs();
    } catch (error: any) {
      toast.error("Job submission is not available yet", { description: error?.message });
    }
  };

  const handleStopJob = async (jobId: string) => {
    try {
      await scrapingService.stopJob(jobId);
      await refetchJobs();
    } catch (error: any) {
      toast.error("Failed to stop job", { description: error?.message });
    }
  };

  const handleRetry = () => {
    refetchJobs();
    refetchSites();
    refetchConfig();
  };

  const isLoading = jobsLoading || sitesLoading || configLoading;
  const hasError = jobsError || sitesError || configError;
  const errorMessage = [jobsError, sitesError, configError].filter(Boolean).join("; ");

  return (
    <div className="max-w-7xl">
      <PageHeader
        title="Web Scraping"
        description="Manage property data collection and processing jobs"
        actions={
          <Button variant="primary" icon={<Plus size={14} />} onClick={handleStartJob} disabled={isLoading}>
            Start New Job
          </Button>
        }
      />

      {/* Error State */}
      {hasError && (
        <ErrorBanner className="mb-5" message={`Failed to load scraping data: ${errorMessage}`} onRetry={handleRetry} />
      )}

      {/* Loading State */}
      {isLoading && <Spinner label="Loading scraping data" />}

      {!isLoading && (
        <div className="space-y-5">
          {/* Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatTile label="Total Jobs" value={formatNumber(totalJobs)} hint="All time" icon={<Plus size={14} />} />
            <StatTile label="Active" value={activeJobs.length} hint="Currently running" icon={<Play size={14} />} />
            <StatTile label="Completed" value={completedJobsCount} hint="Successful executions" icon={<CheckCircle size={14} />} />
            <StatTile label="Failed" value={failedJobsCount} hint="Need investigation" icon={<XCircle size={14} />} />
          </div>

          {/* Active Jobs Section */}
          {activeJobs.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-md font-semibold text-slate-900">Active Jobs</h2>
              {activeJobs.map((job) => (
                <Card key={job.jobId}>
                  <CardHeader
                    title={job.jobId}
                    description={`Started ${job.startTime}`}
                    actions={<>
                      <Badge tone={statusTone(job.status)} dot>Running</Badge>
                      <Button size="sm" variant="dangerOutline" onClick={() => handleStopJob(job.jobId)}>Stop</Button>
                    </>}
                  />
                  <CardBody className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium text-slate-700">Market Data Collection</span>
                        <span className="text-xs text-slate-500 tabular">{job.progress?.marketData?.collected ?? 0} collected</span>
                      </div>
                      <ProgressBar value={stageProgress(job.progress?.marketData?.status, 65)} />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium text-slate-700">Competitor Analysis</span>
                        <span className="text-xs text-slate-500 tabular">{job.progress?.competitors?.scraped ?? 0} analyzed</span>
                      </div>
                      <ProgressBar value={stageProgress(job.progress?.competitors?.status, 45)} />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium text-slate-700">Indicator Calculation</span>
                        <span className="text-xs text-slate-500 tabular">{job.progress?.indicators?.calculated ?? 0} calculated</span>
                      </div>
                      <ProgressBar value={stageProgress(job.progress?.indicators?.status, 20)} />
                    </div>
                  </CardBody>
                </Card>
              ))}
            </section>
          )}

          {/* Completed Jobs Table */}
          {completedJobs.length > 0 && (
            <Card>
              <CardHeader title="Job History" />
              <Table>
                <THead>
                  <tr>
                    <TH>Job ID</TH>
                    <TH>Status</TH>
                    <TH>Duration</TH>
                    <TH numeric>Listings Collected</TH>
                    <TH numeric>Errors</TH>
                    <TH>Actions</TH>
                  </tr>
                </THead>
                <TBody>
                  {completedJobs.map((job, i) => (
                    <TR key={`${job.jobId}-${i}`}>
                      <TD className="font-medium">{job.jobId}</TD>
                      <TD><Badge tone={statusTone(job.status)} dot>{capitalize(job.status)}</Badge></TD>
                      <TD muted>{job.duration}</TD>
                      <TD numeric>{job.listingsCollected}</TD>
                      <TD numeric><Badge tone={statusTone(job.errors === 0 ? "success" : "failed")}>{job.errors}</Badge></TD>
                      <TD><Button size="sm">Details</Button></TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </Card>
          )}

          {/* Sites Status Section */}
          {sitesData && sitesData.sites && sitesData.sites.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-md font-semibold text-slate-900">Site Status</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {sitesData.sites.map((site: any) => (
                  <Card key={site.id}>
                    <CardHeader title={site.name} actions={<Badge tone={statusTone(site.status)} dot>{capitalize(site.status)}</Badge>} />
                    <CardBody>
                      <dl className="divide-y divide-slate-100">
                        <div className="flex justify-between items-center py-2 gap-4">
                          <dt className="text-sm text-slate-600">Last Scraped</dt>
                          <dd className="text-sm font-medium text-slate-900 tabular">{site.lastScraped}</dd>
                        </div>
                        <div className="flex justify-between items-center py-2 gap-4">
                          <dt className="text-sm text-slate-600">Records Collected</dt>
                          <dd className="text-sm font-medium text-slate-900 tabular">{formatNumber(site.recordsCollected)}</dd>
                        </div>
                        <div className="flex justify-between items-center py-2 gap-4">
                          <dt className="text-sm text-slate-600">Success Rate</dt>
                          <dd className="text-sm font-medium text-slate-900 tabular">{site.successRate}%</dd>
                        </div>
                      </dl>
                    </CardBody>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Modal for New Job */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Start New Scraping Job"
      >
        <div className="space-y-4">
          <Field label="Target Markets">
            <Select
              value={jobConfig.targets}
              onChange={(e) => setJobConfig({ ...jobConfig, targets: e.target.value })}
            >
              <option value="all">All Markets</option>
              <option value="us-west">US West</option>
              <option value="us-east">US East</option>
              <option value="us-midwest">US Midwest</option>
              <option value="us-south">US South</option>
            </Select>
          </Field>

          <Field label="Max Listings to Collect">
            <Input
              type="number"
              value={jobConfig.maxListings}
              onChange={(e) => setJobConfig({ ...jobConfig, maxListings: e.target.value })}
              placeholder="20000"
            />
          </Field>

          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={jobConfig.includeCompetitors}
              onChange={(e) => setJobConfig({ ...jobConfig, includeCompetitors: e.target.checked })}
              className="w-4 h-4 rounded-sm border-slate-300 text-amber-600 focus:ring-amber-500"
            />
            <span className="text-sm text-slate-700">Include Competitor Analysis</span>
          </label>

          <div className="rounded-sm border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            <p className="font-medium">Estimated Duration</p>
            <p className="text-xs text-amber-800 mt-0.5">3-4 hours depending on market size and system load</p>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="primary" className="flex-1" onClick={handleSubmitJob} disabled title={JOB_SUBMIT_UNAVAILABLE}>
              Start Job
            </Button>
            <Button className="flex-1" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
