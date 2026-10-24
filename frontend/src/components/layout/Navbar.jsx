import React, { useState, useEffect, useRef } from 'react';
import { Layers, Bell, Mail, Search, Menu, X, ChevronDown, User, CheckSquare, ArrowRight, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { employeeApi } from '../../api/employeeApi';
import { taskApi } from '../../api/taskApi';
import { useDebounce } from '../../hooks/useDebounce';

export default function Navbar({ onMenuToggle, isSidebarOpen }) {
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({ employees: [], tasks: [] });

  const containerRef = useRef(null);

  // Close search popover on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch live suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      const q = debouncedQuery.trim();
      if (q.length < 2) {
        setResults({ employees: [], tasks: [] });
        setIsOpen(false);
        return;
      }

      setLoading(true);
      try {
        const [empRes, taskRes] = await Promise.all([
          employeeApi.getEmployees({ search: q, limit: 3 }),
          taskApi.getTasks({ search: q, limit: 3 })
        ]);

        setResults({
          employees: empRes?.data || [],
          tasks: taskRes?.data || []
        });
        setIsOpen(true);
      } catch (err) {
        // silent fail on auto-suggest
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [debouncedQuery]);

  const handleSearchSubmit = (searchVal) => {
    const term = (searchVal || query).trim();
    if (!term) return;
    setIsOpen(false);
    navigate(`/tasks?search=${encodeURIComponent(term)}`);
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-xs">
      <div className="px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Brand Logo */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMenuToggle}
            className="lg:hidden p-2 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition focus:outline-none focus:ring-2 focus:ring-brand-500"
            aria-label="Toggle navigation drawer"
          >
            {isSidebarOpen ? <X className="w-5 h-5 text-brand-600" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-brand-500/25 group-hover:scale-105 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900 tracking-tight text-base">StaffHub</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-brand-50 text-brand-600 border border-brand-100">
                  Pro
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* Center: Search Bar with Live Suggestions */}
        <div ref={containerRef} className="relative hidden md:flex items-center flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => {
                if (query.trim().length >= 2) setIsOpen(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearchSubmit();
                }
              }}
              placeholder="Search employee name, task title or ID..."
              className="w-full pl-9 pr-9 py-2 text-xs bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition text-slate-700 placeholder-slate-400"
            />
            {loading ? (
              <Loader2 className="w-4 h-4 text-brand-600 animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
            ) : query ? (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setIsOpen(false);
                }}
                className="text-slate-400 hover:text-slate-600 absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : null}
          </div>

          {/* Live Search Results Dropdown */}
          {isOpen && (results.employees.length > 0 || results.tasks.length > 0) && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden z-50 animate-in fade-in duration-200">
              <div className="p-2 space-y-3 max-h-96 overflow-y-auto">
                {/* Employees Section */}
                {results.employees.length > 0 && (
                  <div>
                    <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <User className="w-3 h-3 text-brand-600" />
                        Employees
                      </span>
                      <span>{results.employees.length} found</span>
                    </div>
                    <div className="space-y-1 mt-1">
                      {results.employees.map((emp) => (
                        <div
                          key={emp._id}
                          onClick={() => handleSearchSubmit(emp.fullName)}
                          className="flex items-center justify-between p-2 rounded-xl hover:bg-brand-50/60 cursor-pointer transition group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-500 text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                              {emp.fullName?.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                            </div>
                            <div className="truncate">
                              <p className="text-xs font-semibold text-slate-800 group-hover:text-brand-600 transition truncate">
                                {emp.fullName}
                              </p>
                              <p className="text-[10px] text-slate-400 truncate">
                                {emp.role} • {emp.department}
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            {emp.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tasks Section */}
                {results.tasks.length > 0 && (
                  <div className="pt-1 border-t border-slate-100">
                    <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <CheckSquare className="w-3 h-3 text-brand-600" />
                        Tasks
                      </span>
                      <span>{results.tasks.length} found</span>
                    </div>
                    <div className="space-y-1 mt-1">
                      {results.tasks.map((task) => (
                        <div
                          key={task._id}
                          onClick={() => {
                            setIsOpen(false);
                            navigate(`/tasks/${task._id}`);
                          }}
                          className="flex items-center justify-between p-2 rounded-xl hover:bg-brand-50/60 cursor-pointer transition group"
                        >
                          <div className="min-w-0 flex-1 pr-2">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[10px] font-bold text-brand-600">
                                {task.taskId}
                              </span>
                              <p className="text-xs font-semibold text-slate-800 group-hover:text-brand-600 transition truncate">
                                {task.title}
                              </p>
                            </div>
                            <p className="text-[10px] text-slate-400 truncate mt-0.5">
                              Assigned to {task.employeeSnapshot?.fullName || 'Unassigned'}
                            </p>
                          </div>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            {task.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* View all search results bar */}
              <button
                type="button"
                onClick={() => handleSearchSubmit()}
                className="w-full py-2.5 px-4 bg-[#f8f9fd] hover:bg-slate-100 border-t border-slate-100 text-xs font-semibold text-brand-600 flex items-center justify-center gap-1.5 transition"
              >
                <span>View all search results for &ldquo;{query}&rdquo;</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Right: Message, Notification & Profile Pill */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/70 flex items-center justify-center text-slate-500 hover:text-slate-800 transition"
            title="Messages"
          >
            <Mail className="w-4 h-4" />
          </button>

          <button
            type="button"
            className="relative w-9 h-9 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/70 flex items-center justify-center text-slate-500 hover:text-slate-800 transition"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-brand-500 ring-2 ring-white" />
          </button>

          {/* User Profile Pill */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200/70">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-400 text-white font-semibold text-xs flex items-center justify-center shadow-xs">
              KJ
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-semibold text-slate-800 leading-tight">Kim Jiwon</div>
              <div className="text-[11px] text-slate-400 font-normal">Workspace Manager</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </div>
        </div>
      </div>
    </header>
  );
}
