"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, FileText, Download, CheckCircle, RefreshCw, Calendar, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatFriendlyDate } from "@/lib/helpers";

export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);

  // Fetch reports list
  const loadReports = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/reports");
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports);
        if (data.reports.length > 0) {
          setSelectedReport(data.reports[0]);
        }
      }
    } catch (err) {
      toast.error("Failed to load reports");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  useEffect(() => {
    async function loadHistory() {
      if (!selectedReport) return;
      const period = selectedReport.week ? "weekly" : "monthly";
      try {
        const res = await fetch(`/api/carbon-history?period=${period}`);
        if (res.ok) {
          const data = await res.json();
          setChartData(data.chartData);
        }
      } catch (err) {
        console.error("Failed to load report chart data:", err);
      }
    }
    loadHistory();
  }, [selectedReport]);

  const handleGenerateReport = async (period: "weekly" | "monthly") => {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Generation failed");
      }

      toast.success(`${period} report compiled successfully!`);
      const listRes = await fetch("/api/reports");
      if (listRes.ok) {
        const listData = await listRes.json();
        setReports(listData.reports);
        setSelectedReport(listData.reports[0]);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to generate report.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Printable styles setup */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
            padding: 20px;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Header Panel */}
      <div className="bg-white border border-[#dcecf3] p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 no-print select-none">
        <div>
          <h1 className="text-2xl font-bold text-[#08171e] flex items-center gap-2">
            <TrendingUp className="size-6 text-[#096b90]" />
            Carbon Analytics Reports
          </h1>
          <p className="text-sm text-[#4d6673] mt-1 font-semibold">
            Weekly and monthly ecological impact reports with AI summary analysis.
          </p>
        </div>

        {/* Generate triggers */}
        <div className="flex gap-2">
          <Button
            onClick={() => handleGenerateReport("weekly")}
            className="bg-[#096b90]/10 hover:bg-[#096b90]/25 border border-[#dcecf3] text-[#096b90] text-xs font-bold py-2 px-4 rounded-lg cursor-pointer"
            disabled={isGenerating}
          >
            {isGenerating ? <Loader2 className="size-3.5 animate-spin" /> : "Run Weekly Report"}
          </Button>
          <Button
            onClick={() => handleGenerateReport("monthly")}
            className="bg-[#042b44] hover:bg-[#096b90] text-white text-xs font-extrabold py-2 px-4 rounded-lg cursor-pointer border-none shadow-sm"
            disabled={isGenerating}
          >
            {isGenerating ? <Loader2 className="size-3.5 animate-spin" /> : "Run Monthly Report"}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="h-96 flex flex-col items-center justify-center gap-3 no-print">
          <Loader2 className="size-8 animate-spin text-[#096b90]" />
          <span className="text-sm text-[#4d6673] font-semibold">Gathering audit logs...</span>
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white border border-[#dcecf3] rounded-2xl p-12 text-center text-[#4d6673] font-bold no-print select-none">
          No reports generated yet. Click one of the buttons above to compile your first report.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* History Sidebar list */}
          <div className="lg:col-span-1 bg-white border border-[#dcecf3] rounded-2xl p-5 shadow-sm no-print space-y-4 select-none">
            <h3 className="text-xs font-bold text-[#08171e] uppercase tracking-wider pb-2 border-b border-[#dcecf3]">
              Report History
            </h3>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {reports.map((rep) => {
                const isSelected = selectedReport?._id === rep._id;
                const type = rep.week ? "Weekly Audit" : "Monthly Audit";
                const date = rep.week ? `Week ${rep.week.split("-W")[1]}` : `Month ${rep.month}`;
                return (
                  <button
                    key={rep._id}
                    onClick={() => setSelectedReport(rep)}
                    className={`flex items-start gap-3 w-full text-left px-3 py-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                      isSelected
                        ? "bg-[#096b90]/10 border-transparent text-[#096b90]"
                        : "bg-white border-[#dcecf3] text-[#4d6673] hover:text-[#08171e] hover:bg-[#f7fbfd]"
                    }`}
                  >
                    <FileText className="size-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-[#08171e]">{type}</p>
                      <p className="text-[10px] text-[#4d6673] mt-0.5 font-medium">{date}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Report Viewer Panel */}
          {selectedReport && (
            <div
              id="print-area"
              className="lg:col-span-3 bg-white border border-[#dcecf3] rounded-2xl p-6 md:p-8 shadow-sm space-y-6"
            >
              {/* Header */}
              <div className="flex justify-between items-start gap-4 pb-4 border-b border-[#dcecf3]">
                <div>
                  <span className="text-[10px] font-extrabold text-[#096b90] uppercase tracking-widest">
                    EcoTrack AI Impact Statement
                  </span>
                  <h2 className="text-2xl font-bold text-[#08171e] mt-1">
                    {selectedReport.week ? `Weekly Carbon Audit Report` : `Monthly Carbon Audit Report`}
                  </h2>
                  <p className="text-xs text-[#4d6673] font-semibold mt-1">
                    Compiled for user on {new Date(selectedReport.createdAt).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>

                <Button
                  onClick={handleExportPDF}
                  className="no-print bg-white border border-[#dcecf3] hover:border-[#096b90] text-[#4d6673] hover:text-[#08171e] text-xs font-bold py-1.5 px-3 rounded flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Download className="size-3.5" /> Export PDF
                </Button>
              </div>

              {/* Chart section */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-[#08171e] uppercase tracking-wider select-none no-print">
                  Emissions Curve (kg CO2e)
                </h3>
                <div className="h-44 w-full text-xs no-print">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                      <XAxis dataKey="day" stroke="#4d6673" />
                      <YAxis stroke="#4d6673" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#ffffff",
                          borderColor: "#dcecf3",
                          color: "#08171e",
                        }}
                      />
                      <Area type="monotone" dataKey="Emissions" stroke="#096b90" fill="rgba(9, 107, 144, 0.1)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* AI Summary */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-[#08171e] uppercase tracking-wider">AI-Generated Summary</h3>
                <p className="text-xs text-[#4d6673] leading-relaxed font-semibold bg-[#f7fbfd] border border-[#dcecf3] rounded-xl p-4 md:p-5">
                  {selectedReport.summary}
                </p>
              </div>

              {/* Goals / Recommendations */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-[#08171e] uppercase tracking-wider">
                  Target Sustainability Goals
                </h3>
                <div className="space-y-2.5">
                  {selectedReport.recommendations.map((rec: string, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 bg-[#f7fbfd] border border-[#dcecf3] rounded-xl p-4"
                    >
                      <span className="size-5 rounded-full bg-[#096b90]/10 border border-[#096b90]/30 flex items-center justify-center font-bold text-[#096b90] text-xs shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="text-xs text-[#4d6673] font-semibold leading-relaxed">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* PDF Footer signatures */}
              <div className="hidden print:block pt-12 border-t border-dashed border-gray-300 text-[10px] text-gray-500 text-center select-none">
                <div>EcoTrack AI Official Carbon Statements are compiled based on active log parameters and Gemini AI engines.</div>
                <div className="mt-1">Generated: {new Date().toLocaleString()}</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
