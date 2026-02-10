"use client";

import { useState } from "react";
import { Plus, Play, RefreshCw } from "lucide-react";
import { useApi } from "@/lib/hooks";
import { scrapingService } from "@/lib/services/scraping";
import { MetricCard } from "@/components/ui/MetricCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { DataTable } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { formatNumber } from "@/lib/utils";


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
      await fetch("/api/admin/scraping/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targets: jobConfig.targets,
          maxListings: parseInt(jobConfig.maxListings),
          includeCompetitors: jobConfig.includeCompetitors,
        }),
      });
      setIsModalOpen(false);
      await refetchJobs();
    } catch (error) {
      console.error("Failed to start job:", error);
    }
  };

  const handleStopJob = async (jobId: string) => {
    try {
      await scrapingService.stopJob(jobId);
      await refetchJobs();
    } catch (error) {
      console.error("Failed to stop job:", error);
    }
  };

  const handleRetry = () => {
    refetchJobs();
    refetchSites();
    refetchConfig();
  };

  const isLoading = jobsLoading || sitesLoading || configLoading;
  const hasError = jobsError || sitesError || configError;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">Web Scraping</h1>
          <p className="text-slate-500">Manage property data collection and processing jobs</p>
        </div>
        <button
          onClick={handleStartJob}
          disabled={isLoading}
          className="bg-amber-600 text-white rounded-md px-6 py-3 font-medium flex items-center gap-2 hover:bg-amber-700 transition-colors disabled:opacity-50"
        >
          <Plus size={20} />
          Start New Job
        </button>
      </div>

      {/* Error State */}
      {hasError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
          <span className="text-red-900">Failed to load scraping data</span>
          <button
            onClick={handleRetry}
            className="text-red-600 hover:text-red-700 font-medium"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="animate-spin text-amber-600" size={32} />
        </div>
      )}

      {!isLoading && (
        <>
          {/* Metrics */}
          <div className="grid grid-cols-4 gap-6">
            <MetricCard
              title="Total Jobs"
              value={formatNumber(totalJobs)}
              subtitle="All time"
              icon={Plus}
            />
            <MetricCard
              title="Active"
              value={activeJobs.length.toString()}
              subtitle="Currently running"
              icon={Play}
            />
            <MetricCard
              title="Completed"
              value={completedJobsCount.toString()}
              subtitle="Successful executions"
              icon={Play}
            />
            <MetricCard
              title="Failed"
              value={failedJobsCount.toString()}
              subtitle="Need investigation"
              icon={Play}
            />
          </div>

          {/* Active Jobs Section */}
          {activeJobs.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Active Jobs
              </h2>
              <div className="space-y-4">
                {activeJobs.map((job) => (
                  <div
                    key={job.jobId}
                    className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 space-y-4"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">{job.jobId}</h3>
                        <p className="text-sm text-slate-500">Started {job.startTime}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-block border border-blue-200 rounded-md bg-blue-50 text-blue-900 px-3 py-1.5 text-sm font-semibold">
                          RUNNING
                        </span>
                        <button
                          onClick={() => handleStopJob(job.jobId)}
                          className="border border-red-200 rounded-md bg-red-50 text-red-700 px-3 py-1.5 text-sm font-medium hover:bg-red-100 transition-colors"
                        >
                          Stop
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-slate-600">
                            Market Data Collection
                          </span>
                          <span className="text-xs text-slate-500">
                            {job.progress?.marketData?.collected ?? 0} collected
                          </span>
                        </div>
                        <ProgressBar
                          value={
                            job.progress?.marketData?.status === "completed"
                              ? 100
                              : job.progress?.marketData?.status === "in progress"
                              ? 65
                              : 0
                          }
                          color="bg-blue-600"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-slate-600">
                            Competitor Analysis
                          </span>
                          <span className="text-xs text-slate-500">
                            {job.progress?.competitors?.scraped ?? 0} analyzed
                          </span>
                        </div>
                        <ProgressBar
                          value={
                            job.progress?.competitors?.status === "completed"
                              ? 100
                              : job.progress?.competitors?.status === "in progress"
                              ? 45
                              : 0
                          }
                          color="bg-green-600"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-slate-600">
                            Indicator Calculation
                          </span>
                          <span className="text-xs text-slate-500">
                            {job.progress?.indicators?.calculated ?? 0} calculated
                          </span>
                        </div>
                        <ProgressBar
                          value={
                            job.progress?.indicators?.status === "completed"
                              ? 100
                              : job.progress?.indicators?.status === "in progress"
                              ? 20
                              : 0
                          }
                          color="bg-amber-600"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Completed Jobs Table */}
          {completedJobs.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Job History
              </h2>
              <DataTable
                columns={[
                  { key: "jobId", label: "Job ID" },
                  {
                    key: "status",
                    label: "Status",
                    render: (value) => {
                      const colorMap: Record<string, string> = {
                        completed: "bg-green-50 text-green-900 border-green-200",
                        failed: "bg-red-50 text-red-900 border-red-200",
                      };
                      return (
                        <span
                          className={`inline-flex items-center border rounded-md px-3 py-1.5 text-sm font-medium ${
                            colorMap[value] || colorMap.completed
                          }`}
                        >
                          {value ? value.charAt(0).toUpperCase() + value.slice(1) : "-"}
                        </span>
                      );
                    },
                  },
                  { key: "duration", label: "Duration" },
                  { key: "listingsCollected", label: "Listings Collected" },
                  {
                    key: "errors",
                    label: "Errors",
                    render: (value) => (
                      <span
                        className={`font-semibold ${
                          value === 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {value}
                      </span>
                    ),
                  },
                  {
                    key: "jobId",
                    label: "Actions",
                    render: () => (
                      <button className="border border-slate-200 rounded-md bg-white text-slate-700 px-3 py-1 text-sm font-medium hover:bg-slate-50 transition-colors">
                        Details
                      </button>
                    ),
                  },
                ]}
                data={completedJobs}
                emptyMessage="No completed jobs"
              />
            </div>
          )}

          {/* Sites Status Section */}
          {sitesData && sitesData.sites && sitesData.sites.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Site Status
              </h2>
              <div className="grid grid-cols-2 gap-6">
                {sitesData.sites.map((site: any) => (
                  <div
                    key={site.id}
                    className="bg-white border border-slate-200 rounded-lg shadow-sm p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-lg font-semibold text-slate-900">{site.name}</h3>
                      <span
                        className={`inline-block border rounded-md px-2 py-1 text-xs font-semibold ${
                          site.status === "healthy"
                            ? "border-green-200 bg-green-50 text-green-900"
                            : site.status === "degraded"
                            ? "border-amber-200 bg-amber-50 text-amber-900"
                            : "border-red-200 bg-red-50 text-red-900"
                        }`}
                      >
                        {site.status ? site.status.charAt(0).toUpperCase() + site.status.slice(1) : "-"}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Last Scraped</span>
                        <span className="font-semibold text-slate-900">{site.lastScraped}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Records Collected</span>
                        <span className="font-semibold text-slate-900">{formatNumber(site.recordsCollected)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Success Rate</span>
                        <span className="font-semibold text-green-600">{site.successRate}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal for New Job */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Start New Scraping Job"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">
              Target Markets
            </label>
            <select
              value={jobConfig.targets}
              onChange={(e) =>
                setJobConfig({ ...jobConfig, targets: e.target.value })
              }
              className="w-full border border-slate-200 rounded-md px-4 py-2 text-slate-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white"
            >
              <option value="all">All Markets</option>
              <option value="us-west">US West</option>
              <option value="us-east">US East</option>
              <option value="us-midwest">US Midwest</option>
              <option value="us-south">US South</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">
              Max Listings to Collect
            </label>
            <input
              type="number"
              value={jobConfig.maxListings}
              onChange={(e) =>
                setJobConfig({ ...jobConfig, maxListings: e.target.value })
              }
              placeholder="20000"
              className="w-full border border-slate-200 rounded-md px-4 py-2 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={jobConfig.includeCompetitors}
                onChange={(e) =>
                  setJobConfig({
                    ...jobConfig,
                    includeCompetitors: e.target.checked,
                  })
                }
                className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
              />
              <span className="text-sm font-semibold text-slate-600">
                Include Competitor Analysis
              </span>
            </label>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-900">
            <p className="font-semibold mb-1">Estimated Duration</p>
            <p>3-4 hours depending on market size and system load</p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSubmitJob}
              className="flex-1 bg-amber-600 text-white rounded-md px-4 py-2 font-medium hover:bg-amber-700 transition-colors"
            >
              Start Job
            </button>
            <button
              onClick={() => setIsModalOpen(false)}
              className="flex-1 border border-slate-200 rounded-md bg-white text-slate-700 px-4 py-2 font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
