import React, { useState } from 'react';
import {
  AlertTriangle,
  Activity,
  Camera,
  RotateCcw,
  CheckCircle2,
  Sliders,
  Radio,
  ShieldAlert,
  Building2,
  ChevronRight,
  ChevronLeft,
  Sparkles,
} from 'lucide-react';
import CrisisGridLogo from './CrisisGridLogo.jsx';

export default function ControlPanel({
  scenario = 'Flood',
  onSelectScenario,
  gridSupply = 100,
  gridDemand = 120,
  totalMinSafe = 80,
  agents = [],
  warnings = [],
  recommendations = [],
  negotiationLogs = [],
  cameraMode = 'overview',
  onSelectCamera,
  isNegotiating = false,
  onStartNegotiation,
  isEmergency = false,
  onTriggerEmergency,
  onResetSimulation,
  onUpdateSimulationData,
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('status'); // 'status', 'sliders', 'warnings', 'logs'

  const scenariosList = [
    { id: 'Normal', name: 'Normal Grid', icon: '⚡', desc: '120 MW full capacity' },
    { id: 'Flood', name: 'Flood', icon: '🌊', desc: '100 MW supply · Pumping priority' },
    { id: 'Earthquake', name: 'Earthquake', icon: '🌋', desc: '80 MW supply · Trauma surge' },
    { id: 'Power Shortage', name: 'Power Shortage', icon: '⚠️', desc: '60 MW severe deficit' },
  ];

  const cameraOptions = [
    { id: 'overview', label: 'City Overview', icon: Building2 },
    { id: 'hospital', label: 'Hospital Focus', icon: Activity },
    { id: 'telecom', label: 'Telecom Spire', icon: Radio },
    { id: 'emergency', label: 'Emergency Bunker', icon: ShieldAlert },
    { id: 'auto-orbit', label: 'Auto Orbit View', icon: Camera },
  ];

  const hospitalAgent = agents.find((a) => a.id === 'hospital');
  const waterAgent = agents.find((a) => a.id === 'water');
  const emergencyAgent = agents.find((a) => a.id === 'emergency');
  const telecomAgent = agents.find((a) => a.id === 'telecom');

  const handleSliderChange = (field, value) => {
    const numValue = Math.max(5, Number(value) || 0);
    const nextPayload = {
      scenario: 'Custom',
      supply: field === 'supply' ? numValue : gridSupply,
      hospital: field === 'hospital' ? numValue : hospitalAgent?.demand ?? 40,
      water: field === 'water' ? numValue : waterAgent?.demand ?? 30,
      emergency: field === 'emergency' ? numValue : emergencyAgent?.demand ?? 20,
      telecom: field === 'telecom' ? numValue : telecomAgent?.demand ?? 30,
    };
    onUpdateSimulationData?.(nextPayload);
  };

  return (
    <div
      className={`fixed top-18 right-4 bottom-4 z-40 flex transition-all duration-300 pointer-events-auto ${
        collapsed ? 'translate-x-[calc(100%-48px)]' : 'translate-x-0'
      }`}
    >
      {/* Collapse Toggle Tab */}
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="w-12 h-14 bg-neutral-950/95 border border-cyan-500/40 border-r-0 rounded-l-xl flex items-center justify-center text-cyan-300 hover:text-white self-center shadow-[0_0_15px_rgba(6,182,212,0.3)] cursor-pointer"
        title={collapsed ? 'Expand Control Panel' : 'Collapse Control Panel'}
      >
        {collapsed ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
      </button>

      {/* Main HUD Panel */}
      <div className="w-96 bg-neutral-950/95 border border-cyan-500/30 rounded-2xl p-4 flex flex-col shadow-[0_0_40px_rgba(0,0,0,0.9)] overflow-hidden">
        {/* Header Strip */}
        <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20">
          <div className="flex items-center gap-2.5">
            <CrisisGridLogo size="sm" />
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">
                Digital Twin Command
              </h2>
              <span className="text-[10px] font-mono text-cyan-400">
                LIVE DATA-LINKED 3D BUILDINGS
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onResetSimulation}
              className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-700 hover:border-cyan-400 text-neutral-400 hover:text-cyan-300 text-xs transition cursor-pointer"
              title="Reset Simulation State"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 py-3 text-xs custom-scrollbar">

          {/* ACTION BUTTONS: EMERGENCY & NEGOTIATION */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onTriggerEmergency}
              className={`p-2.5 rounded-xl border font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all cursor-pointer shadow-lg ${
                isEmergency
                  ? 'bg-rose-950/80 border-rose-500 text-rose-200 ring-2 ring-rose-500/50'
                  : 'bg-neutral-900/90 border-rose-500/50 text-rose-300 hover:bg-rose-950/60 hover:border-rose-400'
              }`}
            >
              <div className="flex items-center gap-1 text-[11px]">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Simulate Emergency</span>
              </div>
              <span className="text-[10px] font-mono opacity-80">
                Hospital: +15 MW Surge
              </span>
            </button>

            <button
              type="button"
              onClick={onStartNegotiation}
              disabled={isNegotiating}
              className={`p-2.5 rounded-xl border font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all cursor-pointer shadow-lg ${
                isNegotiating
                  ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 ring-2 ring-cyan-400/50'
                  : 'bg-neutral-900/90 border-cyan-500/50 text-cyan-300 hover:bg-cyan-950/60 hover:border-cyan-400'
              }`}
            >
              <div className="flex items-center gap-1 text-[11px]">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>{isNegotiating ? 'Negotiating...' : 'Run Negotiation'}</span>
              </div>
              <span className="text-[10px] font-mono opacity-80">
                Pareto Dispatch
              </span>
            </button>
          </div>

          {/* DISASTER SCENARIO SELECTOR */}
          <div>
            <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-2">
              Disaster Scenario ({scenario})
            </label>
            <div className="grid grid-cols-2 gap-2">
              {scenariosList.map((sc) => {
                const isActive = scenario === sc.id;
                return (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => onSelectScenario(sc.id)}
                    className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      isActive
                        ? 'bg-cyan-950/70 border-cyan-400 ring-1 ring-cyan-400/40 text-white shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                        : 'bg-neutral-900/60 border-neutral-800 hover:border-cyan-500/40 text-neutral-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-semibold text-xs">
                      <span>{sc.icon}</span>
                      <span className="truncate">{sc.name}</span>
                    </div>
                    <div className="text-[10px] text-neutral-400 truncate mt-0.5">
                      {sc.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* POWER TELEMETRY SUMMARY */}
          <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800">
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <span className="font-bold uppercase tracking-wider text-[10px]">
                Live Grid Telemetry
              </span>
              <span className="font-mono text-cyan-400 text-[10px]">
                Min Safe Floor: {totalMinSafe} MW
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 font-mono text-xs">
              <div>
                <span className="text-neutral-400 block text-[10px]">Available Supply:</span>
                <span className="text-base font-bold text-cyan-300">{gridSupply} MW</span>
              </div>
              <div>
                <span className="text-neutral-400 block text-[10px]">Total Demand:</span>
                <span className="text-base font-bold text-amber-300">{gridDemand} MW</span>
              </div>
            </div>
            <div className="mt-2 w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  gridSupply >= gridDemand
                    ? 'bg-emerald-400'
                    : gridSupply >= totalMinSafe
                    ? 'bg-amber-400'
                    : 'bg-rose-500'
                }`}
                style={{
                  width: `${Math.min(100, Math.round((gridSupply / Math.max(1, gridDemand)) * 100))}%`,
                }}
              />
            </div>
          </div>

          {/* CAMERA CONTROLS */}
          <div>
            <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-2">
              Camera Vantage Points
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {cameraOptions.map((cam) => {
                const Icon = cam.icon;
                const isActive = cameraMode === cam.id;
                return (
                  <button
                    key={cam.id}
                    type="button"
                    onClick={() => onSelectCamera(cam.id)}
                    className={`p-1.5 rounded-lg border text-center transition flex flex-col items-center gap-1 cursor-pointer ${
                      isActive
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                        : 'bg-neutral-900/70 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-medium truncate w-full">
                      {cam.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* TABS: AGENTS / LIVE SLIDERS / WARNINGS / LOGS */}
          <div className="flex border-b border-neutral-800 gap-2 pt-2">
            <button
              type="button"
              onClick={() => setActiveTab('status')}
              className={`pb-1.5 font-bold text-[11px] cursor-pointer border-b-2 transition ${
                activeTab === 'status'
                  ? 'border-cyan-400 text-cyan-300'
                  : 'border-transparent text-neutral-400 hover:text-white'
              }`}
            >
              Buildings ({agents.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('sliders')}
              className={`pb-1.5 font-bold text-[11px] cursor-pointer border-b-2 transition flex items-center gap-1 ${
                activeTab === 'sliders'
                  ? 'border-cyan-400 text-cyan-300'
                  : 'border-transparent text-neutral-400 hover:text-white'
              }`}
            >
              <Sliders className="w-3 h-3" />
              <span>Edit Data</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('warnings')}
              className={`pb-1.5 font-bold text-[11px] cursor-pointer border-b-2 transition ${
                activeTab === 'warnings'
                  ? 'border-cyan-400 text-cyan-300'
                  : 'border-transparent text-neutral-400 hover:text-white'
              }`}
            >
              Alerts ({warnings.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('logs')}
              className={`pb-1.5 font-bold text-[11px] cursor-pointer border-b-2 transition ${
                activeTab === 'logs'
                  ? 'border-cyan-400 text-cyan-300'
                  : 'border-transparent text-neutral-400 hover:text-white'
              }`}
            >
              Logs
            </button>
          </div>

          {/* TAB 1: BUILDING AGENT STATUS CARDS */}
          {activeTab === 'status' && (
            <div className="space-y-2">
              {agents.map((agent) => {
                const demand = Number(agent.demand || 0);
                const allocated = Number(agent.allocated ?? agent.allocated_power ?? 0);
                const minSafe = Number(agent.minSafe ?? agent.minimum_safe ?? 0);
                const pct = demand > 0 ? Math.round((allocated / demand) * 100) : 100;
                const isBelowMinSafe = minSafe > 0 && allocated < minSafe;
                const isSafe = !isBelowMinSafe && pct >= 90;

                return (
                  <div
                    key={agent.id}
                    className="p-2.5 rounded-xl bg-neutral-900/60 border border-neutral-800 flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-semibold text-white">
                        <span>{agent.icon}</span>
                        <span>{agent.displayName || agent.name}</span>
                      </div>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                          isSafe
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : !isBelowMinSafe && pct >= 70
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        }`}
                      >
                        {pct}% ({isBelowMinSafe ? 'UNSAFE' : isSafe ? 'SAFE' : 'REDUCED'})
                      </span>
                    </div>

                    <div className="flex justify-between font-mono text-[11px] text-neutral-400">
                      <span>Demand: {demand} MW</span>
                      <span>Min Safe: {minSafe} MW</span>
                      <span className="text-cyan-300 font-bold">
                        Alloc: {allocated} MW
                      </span>
                    </div>

                    <div className="w-full bg-neutral-800 rounded-full h-1 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isSafe
                            ? 'bg-emerald-400'
                            : !isBelowMinSafe && pct >= 70
                            ? 'bg-amber-400'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: LIVE BUILDING & SUPPLY DATA SLIDERS */}
          {activeTab === 'sliders' && (
            <div className="space-y-3 p-2.5 rounded-xl bg-neutral-900/70 border border-cyan-500/20">
              <div className="text-[11px] text-cyan-200 font-medium">
                Adjust grid supply or building demand below — the 3D city buildings, gauges, and simulation update immediately:
              </div>

              {/* Supply Slider */}
              <div className="space-y-1">
                <div className="flex justify-between font-mono text-[11px]">
                  <span className="text-cyan-300 font-bold">⚡ Grid Supply</span>
                  <span className="text-white font-bold">{gridSupply} MW</span>
                </div>
                <input
                  type="range"
                  min="25"
                  max="180"
                  value={gridSupply}
                  onChange={(e) => handleSliderChange('supply', e.target.value)}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Per-Building Demand Sliders */}
              {[
                { key: 'hospital', label: '🏥 Hospital Demand', val: hospitalAgent?.demand ?? 40, alloc: hospitalAgent?.allocated ?? 40 },
                { key: 'water', label: '💧 Water Station Demand', val: waterAgent?.demand ?? 30, alloc: waterAgent?.allocated ?? 30 },
                { key: 'emergency', label: '🚑 Emergency Demand', val: emergencyAgent?.demand ?? 20, alloc: emergencyAgent?.allocated ?? 20 },
                { key: 'telecom', label: '📡 Telecom Spire Demand', val: telecomAgent?.demand ?? 30, alloc: telecomAgent?.allocated ?? 30 },
              ].map((item) => (
                <div key={item.key} className="space-y-1 pt-1 border-t border-neutral-800">
                  <div className="flex justify-between font-mono text-[11px]">
                    <span className="text-neutral-200">{item.label}</span>
                    <span className="text-cyan-300">
                      {item.val} MW <span className="text-neutral-500">(Alloc: {item.alloc} MW)</span>
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="90"
                    value={item.val}
                    onChange={(e) => handleSliderChange(item.key, e.target.value)}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: WARNINGS & RECOMMENDATIONS */}
          {activeTab === 'warnings' && (
            <div className="space-y-2">
              {warnings.length === 0 ? (
                <div className="p-3 text-center text-neutral-400 text-xs">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                  All critical service dependencies fully satisfied.
                </div>
              ) : (
                warnings.map((w, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 flex items-start gap-2"
                  >
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-[11px]">{w.title}</p>
                      <p className="text-[10px] text-neutral-300 font-mono mt-0.5">
                        {w.detail}
                      </p>
                    </div>
                  </div>
                ))
              )}

              {/* Recommendations list */}
              {recommendations.length > 0 && (
                <div className="pt-2">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1.5">
                    Dispatcher Recommendations
                  </span>
                  <div className="space-y-1.5">
                    {recommendations.map((rec, i) => (
                      <div
                        key={i}
                        className="p-2 rounded-lg bg-cyan-950/30 border border-cyan-500/30 text-cyan-200 text-[11px]"
                      >
                        {rec}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: NEGOTIATION TERMINAL LOGS */}
          {activeTab === 'logs' && (
            <div className="p-2 rounded-xl bg-black/80 border border-neutral-800 font-mono text-[10px] text-cyan-300 space-y-1.5 max-h-56 overflow-y-auto">
              {negotiationLogs.length === 0 ? (
                <span className="text-neutral-500">
                  Ready. Click 'Run Negotiation' to view live agent protocol exchanges.
                </span>
              ) : (
                negotiationLogs.map((log, index) => (
                  <div key={index} className="leading-snug">
                    <span className="text-neutral-500">[{log.time}] </span>
                    <span className="text-amber-400 font-bold">{log.sender}: </span>
                    <span className="text-neutral-200">{log.message}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
