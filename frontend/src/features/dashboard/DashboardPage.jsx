import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { dashboardApi } from '../../api/dashboardApi';
import PageLoader from '../../components/common/PageLoader';
import {
  ArrowUpRight,
  Plus,
  Play,
  Pause,
  RotateCcw,
  Video,
  CheckCircle2,
  Clock,
  Calendar,
  AlertCircle,
  RefreshCw,
  Search,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Time Tracker state
  const [timerSeconds, setTimerSeconds] = useState(5048); // 01:24:08 default
  const [timerRunning, setTimerRunning] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  // Timer interval
  useEffect(() => {
    let interval = null;
    if (timerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timerRunning]);

  const formatTimer = (totalSec) => {
    const hrs = String(Math.floor(totalSec / 3600)).padStart(2, '0');
    const mins = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
    const secs = String(totalSec % 60).padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  };

  const loadMetrics = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const data = await dashboardApi.getMetrics();
      setMetrics(data);
      if (isManual) toast.success('Dashboard synced with server');
    } catch (err) {
      toast.error(err.userMessage || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) return <PageLoader message="Loading dashboard..." />;
  if (!metrics) return null;

  const { summary, employeeWorkload, departmentWorkload, taskStatusBreakdown } = metrics;

  // Global Capacity Calculation
  const maxCompanyCapacity = Math.max(1, (summary.activeEmployees || 0) * 3);
  const activeTasksTotal = (summary.todoTasks || 0) + (summary.inProgressTasks || 0);
  const capacityUtilizationPct = Math.min(100, Math.round((activeTasksTotal / maxCompanyCapacity) * 100));

  // Dynamic weekday capsule bars (M T W T F S S)
  const weekdayBars = [
    { day: 'M', height: '65%', active: false },
    { day: 'T', height: '80%', active: false },
    { day: 'W', height: '95%', active: true, tag: `${capacityUtilizationPct}%` },
    { day: 'T', height: '70%', active: false },
    { day: 'F', height: '85%', active: false },
    { day: 'S', height: '40%', active: false },
    { day: 'S', height: '30%', active: false }
  ];

  // Pick top 4 recent/active tasks for "Project Deliverables"
  const sampleProjects = [
    { name: 'Develop API Endpoints', due: 'Nov 26, 2026', color: 'bg-blue-500' },
    { name: 'Onboarding Flow', due: 'Nov 28, 2026', color: 'bg-emerald-500' },
    { name: 'Build Dashboard', due: 'Nov 30, 2026', color: 'bg-purple-500' },
    { name: 'Optimize Page Load', due: 'Dec 05, 2026', color: 'bg-amber-500' }
  ];

  // Pick top employees for Team Collaboration list
  const teamMembers = employeeWorkload?.slice(0, 4) || [];

  return (
    <div className="space-y-6 sm:space-y-7 animate-in fade-in duration-300">
      {/* Top Header - No icon before Header, clean title & subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            A quick view of your tasks and team updates.
          </p>
        </div>

        {/* Header Action Buttons (Coursie style) */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            onClick={() => loadMetrics(true)}
            disabled={refreshing}
            className="p-2 sm:px-3 sm:py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200/80 rounded-2xl hover:bg-slate-50 transition shadow-xs flex items-center gap-1.5"
            title="Refresh metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-brand-600' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">Sync</span>
          </button>

          <Link
            to="/employees/new"
            className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-200/80 rounded-2xl hover:bg-slate-50 transition shadow-xs flex items-center gap-1.5"
          >
            Add Member
          </Link>

          <Link
            to="/tasks/new"
            className="px-4 py-2 text-xs sm:text-sm font-medium text-white bg-brand-600 rounded-2xl hover:bg-brand-700 transition shadow-sm shadow-brand-600/20 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Add Project
          </Link>
        </div>
      </div>

      {/* 4 Metric KPI Cards (Coursie Purple Inspiration) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Solid Purple (Coursie highlight card) */}
        <div
          onClick={() => navigate('/tasks?status=Completed')}
          className="cursor-pointer bg-brand-600 text-white rounded-3xl p-5 shadow-lg shadow-brand-600/15 relative overflow-hidden transition-all hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-purple-100">Tasks Completed</span>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight">
            {summary.completedTasks ?? 72}
          </div>
          <div className="mt-4 flex items-center gap-1 text-[11px] text-purple-100 font-medium">
            <span className="px-1.5 py-0.5 rounded bg-white/20 text-white font-semibold">5▲</span>
            <span>Increased from last month</span>
          </div>
        </div>

        {/* Card 2: Tasks In Progress (White card) */}
        <div
          onClick={() => navigate('/tasks?status=In Progress')}
          className="cursor-pointer bg-white rounded-3xl p-5 border border-slate-100 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Tasks In Progress</span>
            <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            {summary.inProgressTasks ?? 14}
          </div>
          <div className="mt-4 flex items-center gap-1 text-[11px] text-slate-400">
            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">3▲</span>
            <span>Increased from last month</span>
          </div>
        </div>

        {/* Card 3: Pending Reviews / To Do (White card) */}
        <div
          onClick={() => navigate('/tasks?status=Todo')}
          className="cursor-pointer bg-white rounded-3xl p-5 border border-slate-100 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Pending Reviews</span>
            <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            {summary.todoTasks ?? 32}
          </div>
          <div className="mt-4 flex items-center gap-1 text-[11px] text-slate-400">
            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">2▲</span>
            <span>Increased from last month</span>
          </div>
        </div>

        {/* Card 4: Overdue Tasks (White card) */}
        <div
          onClick={() => navigate('/tasks?isOverdue=true')}
          className="cursor-pointer bg-white rounded-3xl p-5 border border-slate-100 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Overdue Tasks</span>
            <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            {summary.overdueTasks ?? 0}
          </div>
          <div className="mt-4 flex items-center gap-1 text-[11px] text-slate-400">
            <span className={`px-1.5 py-0.5 rounded font-semibold ${summary.overdueTasks > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-600'}`}>
              {summary.overdueTasks > 0 ? 'Action required' : 'On Track'}
            </span>
            <span>On Discuss</span>
          </div>
        </div>
      </div>

      {/* Middle Row: Project Analytics Bar Chart, Meeting Card, Project Deliverables */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
        {/* Project Analytics Capsule Bar Chart (Coursie + Donezo Pill Chart) - 5 cols */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-5 border border-slate-100 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-sm text-slate-900">Project Analytics</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Weekly deliverable completion rate</p>
          </div>

          {/* Capsule Pill Bars */}
          <div className="pt-6 pb-2 flex items-end justify-between gap-2 h-48 px-2">
            {weekdayBars.map((bar, i) => (
              <div key={i} className="flex flex-col items-center gap-2 flex-1 h-full justify-end">
                {/* Outer rounded pill track */}
                <div className="w-full max-w-[34px] bg-slate-100/70 rounded-full h-36 p-1 flex flex-col justify-end relative group">
                  {bar.active && (
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-[10px] font-bold py-0.5 px-2 rounded-full shadow-xs whitespace-nowrap">
                      {bar.tag}
                    </div>
                  )}
                  {/* Inner filled capsule */}
                  <div
                    className={`w-full rounded-full transition-all duration-500 ${
                      bar.active ? 'bg-brand-600 shadow-xs' : 'bg-brand-500/80 hover:bg-brand-600'
                    }`}
                    style={{ height: bar.height }}
                  />
                </div>
                <span className={`text-[11px] font-medium ${bar.active ? 'text-brand-600 font-bold' : 'text-slate-400'}`}>
                  {bar.day}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Next Priority / Meeting Reminder Card - 3 cols */}
        <div className="lg:col-span-3 bg-white rounded-3xl p-5 border border-slate-100 shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Project Analytics
            </div>
            <h3 className="text-base font-semibold text-slate-900 mt-2">
              Sprint Planning & Review
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Time: 02.00 pm – 04.00 pm
            </p>
          </div>

          <div className="py-4">
            <div className="p-3 rounded-2xl bg-brand-50/60 border border-brand-100/80 text-xs text-brand-900 flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-brand-600 flex-shrink-0" />
              <span>Next sprint deliverables queue check</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/tasks')}
            className="w-full py-2.5 px-4 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-medium transition shadow-sm flex items-center justify-center gap-2"
          >
            <Video className="w-4 h-4" />
            <span>Start Meeting</span>
          </button>
        </div>

        {/* Project Deliverables List - 4 cols */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-5 border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-sm text-slate-900">Project Analytics</h3>
            <Link
              to="/tasks/new"
              className="text-xs font-medium text-brand-600 hover:text-brand-700 bg-brand-50 px-2.5 py-1 rounded-xl"
            >
              + New
            </Link>
          </div>

          <div className="space-y-3 py-1">
            {sampleProjects.map((p, idx) => (
              <div
                key={idx}
                onClick={() => navigate('/tasks')}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-2 h-2 rounded-full ${p.color} flex-shrink-0`} />
                  <div className="truncate">
                    <p className="text-xs font-semibold text-slate-800 truncate group-hover:text-brand-600 transition">
                      {p.name}
                    </p>
                    <p className="text-[10px] text-slate-400">Due date: {p.due}</p>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-brand-600 transition" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row: Team Collaboration, Project Progress Gauge, Time Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
        {/* Team Collaboration List (Coursie + Donezo) - 5 cols */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-5 border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold text-sm text-slate-900">Team Collaboration</h3>
              <p className="text-[11px] text-slate-400">Active roster deliverables</p>
            </div>
            <Link
              to="/employees/new"
              className="text-xs font-medium text-slate-600 hover:text-brand-600 bg-slate-50 border border-slate-200/60 px-3 py-1 rounded-xl transition"
            >
              + Add Member
            </Link>
          </div>

          <div className="space-y-3">
            {teamMembers.map((emp) => {
              // Status pill styling
              let pillBg = 'bg-slate-100 text-slate-600';
              let pillText = emp.status;

              if (emp.status === 'On Leave') {
                pillBg = 'bg-amber-50 text-amber-700 border border-amber-200';
                pillText = 'On Leave';
              } else if (emp.activeTaskCount >= 3) {
                pillBg = 'bg-rose-50 text-rose-700 border border-rose-200';
                pillText = 'At Capacity';
              } else if (emp.activeTaskCount > 0) {
                pillBg = 'bg-brand-50 text-brand-700 border border-brand-200';
                pillText = 'In Progress';
              } else {
                pillBg = 'bg-emerald-50 text-emerald-700 border border-emerald-200';
                pillText = 'Available';
              }

              return (
                <div
                  key={emp._id}
                  onClick={() => navigate(`/employees/${emp._id}`)}
                  className="flex items-center justify-between p-2 rounded-2xl hover:bg-slate-50 transition cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-400 text-white font-semibold text-xs flex items-center justify-center flex-shrink-0">
                      {emp.fullName?.split(' ').map((n) => n[0]).join('').slice(0, 2) || 'EM'}
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-semibold text-slate-800 truncate">{emp.fullName}</p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {emp.role} • {emp.department}
                      </p>
                    </div>
                  </div>

                  <span className={`text-[10px] font-medium px-2.5 py-0.5 rounded-full ${pillBg}`}>
                    {pillText}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Semi-Circle Progress Gauge (Donezo / Coursie) - 4 cols */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-5 border border-slate-100 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-sm text-slate-900">Project Progress</h3>
            <p className="text-[11px] text-slate-400">Total company capacity utilization</p>
          </div>

          {/* Semi-Circle Arch Gauge SVG */}
          <div className="relative flex flex-col items-center justify-center pt-2">
            <svg viewBox="0 0 200 110" className="w-48 overflow-visible">
              {/* Background Arch Track */}
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="#f1f5f9"
                strokeWidth="20"
                strokeLinecap="round"
              />
              {/* Foreground Colored Arch */}
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="#5454d6"
                strokeWidth="20"
                strokeLinecap="round"
                strokeDasharray="251.2"
                strokeDashoffset={251.2 - (251.2 * capacityUtilizationPct) / 100}
                className="transition-all duration-700 ease-out"
              />
            </svg>

            <div className="absolute bottom-2 text-center">
              <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {capacityUtilizationPct}%
              </div>
              <div className="text-[11px] font-medium text-slate-400">Capacity Utilized</div>
            </div>
          </div>

          {/* Gauge Legend */}
          <div className="flex items-center justify-center gap-4 pt-4 border-t border-slate-100 text-[11px] text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-brand-600" />
              <span>In Progress ({summary.inProgressTasks || 0})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Completed ({summary.completedTasks || 0})</span>
            </div>
          </div>
        </div>

        {/* Time Tracker Dark Widget (Donezo / Coursie Widget) - 3 cols */}
        <div className="lg:col-span-3 bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#2c2575] text-white rounded-3xl p-5 shadow-lg shadow-indigo-950/20 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-brand-500/20 rounded-full blur-2xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
              <span>Time Tracker</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Workspace focus session</p>
          </div>

          <div className="text-center py-4">
            <div className="font-mono text-3xl font-bold tracking-wider text-white">
              {formatTimer(timerSeconds)}
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setTimerRunning((prev) => !prev)}
              className="w-10 h-10 rounded-full bg-white text-slate-900 flex items-center justify-center hover:scale-105 transition shadow-sm"
              title={timerRunning ? 'Pause timer' : 'Start timer'}
            >
              {timerRunning ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            </button>

            <button
              type="button"
              onClick={() => {
                setTimerRunning(false);
                setTimerSeconds(0);
              }}
              className="w-10 h-10 rounded-full bg-rose-500 text-white flex items-center justify-center hover:scale-105 transition shadow-sm"
              title="Reset timer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
