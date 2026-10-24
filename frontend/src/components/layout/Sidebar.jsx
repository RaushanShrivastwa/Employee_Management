import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  UserPlus,
  PlusCircle,
  X,
  Layers,
  Sparkles,
  Smartphone,
  ChevronRight
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const navLinks = [
    { name: 'Dashboard', to: '/', icon: LayoutDashboard },
    { name: 'Tasks', to: '/tasks', icon: CheckSquare },
    { name: 'Employees', to: '/employees', icon: Users }
  ];

  const quickActions = [
    { name: 'Add Employee', to: '/employees/new', icon: UserPlus },
    { name: 'Create Task', to: '/tasks/new', icon: PlusCircle }
  ];

  return (
    <>
      {/* Mobile Backdrop Blur Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Drawer on Mobile / Fixed Sidebar on Desktop (Coursie Style) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-100 text-slate-600 flex flex-col flex-shrink-0 transition-transform duration-300 ease-in-out shadow-xl lg:shadow-none lg:static lg:translate-x-0 lg:z-auto lg:min-h-[calc(100vh-57px)] ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Mobile Header with Close Button */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 lg:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-sm">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-slate-900 tracking-tight text-sm">StaffHub</span>
              <span className="block text-[10px] text-brand-600 font-medium">Pro Suite</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 flex-1 space-y-6 overflow-y-auto">
          {/* Main Navigation */}
          <div>
            <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Menu
            </p>
            <nav className="space-y-1">
              {navLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.name}
                    to={item.to}
                    end={item.to === '/'}
                    onClick={() => onClose && onClose()}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-sm font-medium transition-all relative ${
                        isActive
                          ? 'bg-brand-50 text-brand-600 font-semibold shadow-xs'
                          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div className="flex items-center gap-3">
                          <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-brand-600' : 'text-slate-400'}`} />
                          <span>{item.name}</span>
                        </div>
                        {isActive && (
                          <div className="w-1.5 h-4 bg-brand-600 rounded-full" />
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Quick Actions */}
          <div>
            <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Actions
            </p>
            <div className="space-y-1">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <NavLink
                    key={action.name}
                    to={action.to}
                    onClick={() => onClose && onClose()}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2 rounded-2xl text-sm transition-all ${
                        isActive
                          ? 'bg-brand-50 text-brand-600 font-medium'
                          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 flex-shrink-0 text-slate-400" />
                    <span>{action.name}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>

          {/* Mobile App Promo Card (Inspired by Coursie Image) */}
          <div className="pt-4">
            <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-[#1a164d] via-[#2c2575] to-[#4338ca] text-white shadow-md">
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-brand-500/20 rounded-full blur-xl pointer-events-none" />
              <div className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center mb-3 text-white border border-white/20">
                <Smartphone className="w-4 h-4" />
              </div>
              <h4 className="font-semibold text-sm leading-tight text-white">StaffHub Mobile</h4>
              <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                Track deliverables and staff limits on any device.
              </p>
              <div className="mt-3.5">
                <button
                  type="button"
                  onClick={() => alert('Mobile app sync is live on this progressive web interface!')}
                  className="w-full py-2 px-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium transition shadow-sm text-center"
                >
                  Download App
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 text-[11px] text-slate-400 text-center">
          Roots Media StaffHub © 2026
        </div>
      </aside>
    </>
  );
}
