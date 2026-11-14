import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Sliders,
  MessageSquareCode,
  BarChart3,
  Scale,
  ShieldAlert,
  LogIn,
  LogOut,
  Save,
  Building2,
  UserCheck,
} from 'lucide-react';
import EmergencyButton from './EmergencyButton.jsx';
import CrisisGridLogo from './CrisisGridLogo.jsx';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/digital-twin', label: '3D Digital Twin', icon: Building2, end: false },
  { to: '/scenario', label: 'Scenario Setup', icon: Sliders, end: false },
  { to: '/negotiation', label: 'Negotiation', icon: MessageSquareCode, end: false },
  { to: '/results', label: 'Results', icon: BarChart3, end: false },
  { to: '/comparison', label: 'Comparison', icon: Scale, end: false },
];

export default function Sidebar({
  simulation,
  onEmergency,
  emergencyLoading,
  user,
  operatorProfile,
  authReady,
  authLoading,
  onOpenAuthModal,
  onSignOut,
  onSaveSimulation,
  savingToCloud,
}) {
  const isSafe = simulation?.safe ?? true;
  const displayName =
    operatorProfile?.displayName || user?.displayName || 'Grid Operator';
  const sectorClearance = operatorProfile?.sectorClearance || 'Grid Commander';

  return (
    <aside className="w-full lg:w-64 shrink-0 bg-black/85 backdrop-blur-sm border-b lg:border-b-0 lg:border-r border-cyan-500/20 flex flex-col justify-between">
      <div>
        {/* Brand Zone */}
        <div className="px-6 py-5 border-b border-cyan-500/20 flex items-center justify-between">
          <CrisisGridLogo
            size="md"
            showWordmark={true}
            subtitle="Disaster Power Dispatch"
          />
        </div>

        {/* Active Scenario Summary Strip */}
        {simulation && (
          <div className="px-6 py-3.5 border-b border-cyan-500/20 bg-neutral-950/60">
            <div className="text-xs text-neutral-400 flex items-center justify-between">
              <span>Scenario</span>
              <span className="font-mono tabular-nums text-cyan-200 font-medium">
                {simulation.scenario}
              </span>
            </div>
            <div className="mt-1.5 text-xs text-neutral-400 flex items-center justify-between">
              <span>Grid State</span>
              <span
                className={`font-mono tabular-nums font-medium ${
                  isSafe ? 'text-cyan-400' : 'text-red-400'
                }`}
              >
                {isSafe ? 'SAFE EQUILIBRIUM' : 'DEFICIT ALERT'}
              </span>
            </div>
          </div>
        )}

        {/* Primary Navigation */}
        <nav className="p-3 space-y-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-cyan-400 text-black font-semibold shadow-[0_0_18px_rgba(34,211,238,0.28)]'
                    : 'text-neutral-400 hover:text-cyan-200 hover:bg-cyan-500/10'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Bottom Account & Emergency Action Zone */}
      <div className="p-4 border-t border-cyan-500/20 space-y-4">
        {/* Operator Account & Cloud Persistence */}
        {authReady && (
          <div className="p-3 rounded-lg bg-neutral-950/75 border border-cyan-500/20 space-y-2.5">
            {user ? (
              <>
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={onOpenAuthModal}
                    className="min-w-0 text-left flex-1 group cursor-pointer"
                    title="Manage Operator Profile"
                  >
                    <div className="text-xs font-semibold text-white group-hover:text-cyan-300 truncate transition-colors">
                      {displayName}
                    </div>
                    <div className="text-[11px] font-mono text-cyan-400 truncate">
                      {sectorClearance}
                    </div>
                    <div className="text-[11px] text-neutral-400 truncate">
                      {user.email}
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={onSignOut}
                    title="Sign Out"
                    className="p-1.5 rounded-md text-neutral-400 hover:text-cyan-300 hover:bg-neutral-900 transition-colors cursor-pointer shrink-0"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={onOpenAuthModal}
                    className="px-2.5 py-1.5 rounded-md bg-neutral-900 hover:bg-neutral-800 border border-cyan-500/25 text-xs font-medium text-cyan-200 flex items-center justify-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>Profile</span>
                  </button>
                  <button
                    type="button"
                    disabled={savingToCloud}
                    onClick={onSaveSimulation}
                    className="px-2.5 py-1.5 rounded-md bg-cyan-400 hover:bg-cyan-300 text-xs font-semibold text-black flex items-center justify-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Save className="w-3.5 h-3.5 shrink-0" />
                    <span>{savingToCloud ? 'Saving...' : 'Save Run'}</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <div className="text-xs text-neutral-400">
                  Authenticate to save simulation runs and configure your operator clearance.
                </div>
                <button
                  type="button"
                  disabled={authLoading}
                  onClick={onOpenAuthModal}
                  className="w-full px-3 py-2 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-xs font-semibold text-black flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap shadow-[0_0_14px_rgba(34,211,238,0.28)]"
                >
                  <LogIn className="w-3.5 h-3.5 shrink-0" />
                  <span>{authLoading ? 'Signing In...' : 'Operator Sign In'}</span>
                </button>
              </div>
            )}
          </div>
        )}

        <div className="space-y-2.5">
          <div className="text-xs text-neutral-400 leading-relaxed">
            <div className="flex items-center gap-1.5 text-cyan-300 font-semibold mb-1">
              <ShieldAlert className="w-3.5 h-3.5 text-red-400 shrink-0" />
              <span>Emergency Surge Drill</span>
            </div>
            <span>
              Injects +15 MW Hospital trauma surge and triggers autonomous renegotiation.
            </span>
          </div>
          <EmergencyButton
            onEmergency={onEmergency}
            loading={emergencyLoading}
          />
        </div>
      </div>
    </aside>
  );
}
