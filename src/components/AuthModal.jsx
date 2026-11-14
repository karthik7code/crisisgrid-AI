import React, { useState, useEffect } from 'react';
import {
  X,
  LogIn,
  LogOut,
  ShieldCheck,
  UserCheck,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Save,
} from 'lucide-react';
import CrisisGridLogo from './CrisisGridLogo.jsx';
import { SECTOR_CLEARANCE_ROLES } from '../services/firebase.js';

export default function AuthModal({
  isOpen,
  onClose,
  user,
  operatorProfile,
  authLoading,
  authError,
  onClearError,
  onSignIn,
  onSignOut,
  onUpdateProfile,
  onSaveSimulation,
  savingToCloud,
  cloudSimulationsCount = 0,
}) {
  const [displayName, setDisplayName] = useState('');
  const [organization, setOrganization] = useState('');
  const [sectorClearance, setSectorClearance] = useState('Grid Commander');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSavedMessage, setProfileSavedMessage] = useState('');

  useEffect(() => {
    if (operatorProfile) {
      setDisplayName(operatorProfile.displayName || user?.displayName || 'Grid Operator');
      setOrganization(operatorProfile.organization || 'Regional Grid Command');
      setSectorClearance(operatorProfile.sectorClearance || 'Grid Commander');
    } else if (user) {
      setDisplayName(user.displayName || user.email?.split('@')[0] || 'Grid Operator');
      setOrganization('Regional Grid Command');
      setSectorClearance('Grid Commander');
    }
  }, [operatorProfile, user]);

  if (!isOpen) return null;

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    setProfileSavedMessage('');
    try {
      await onUpdateProfile({
        displayName: displayName.trim().slice(0, 80) || 'Grid Operator',
        organization: organization.trim().slice(0, 80) || 'Regional Grid Command',
        sectorClearance,
      });
      setProfileSavedMessage('Operator clearance profile updated.');
      setTimeout(() => setProfileSavedMessage(''), 3500);
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="relative w-full max-w-md rounded-2xl bg-neutral-950 border border-cyan-500/35 shadow-[0_0_50px_rgba(0,0,0,0.95)] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-cyan-500/20 flex items-center justify-between">
          <CrisisGridLogo
            size="sm"
            showWordmark={true}
            subtitle={user ? 'Operator Clearance Console' : 'Operator Authentication'}
          />
          <button
            type="button"
            onClick={() => {
              onClearError?.();
              onClose();
            }}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {authError && (
            <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-500/40 text-xs text-red-200 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-semibold text-red-300">Authentication Alert</div>
                <p className="mt-0.5 text-neutral-200 leading-relaxed">{authError}</p>
              </div>
            </div>
          )}

          {!user ? (
            <>
              <div className="space-y-2">
                <h3 className="text-base font-bold text-white">
                  Sign in to CrisisGrid AI Dispatch
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Authenticate with your verified Google account to persist disaster simulation runs, annotate dispatch logs, and configure your sector operator clearance in Firebase Firestore.
                </p>
              </div>

              {/* Capabilities List */}
              <div className="p-4 rounded-xl bg-neutral-900/70 border border-cyan-500/20 space-y-2.5 text-xs text-neutral-300">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Zero-Trust Firestore isolation tied to your verified UID</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Save & restore 3D Digital Twin disaster power allocations</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <UserCheck className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>Customizable Operator Sector Clearance & Dispatch Notes</span>
                </div>
              </div>

              {/* Google OAuth Button */}
              <button
                type="button"
                disabled={authLoading}
                onClick={onSignIn}
                className="w-full py-3 px-4 rounded-xl bg-cyan-400 hover:bg-cyan-300 disabled:opacity-60 text-black font-bold text-sm flex items-center justify-center gap-2.5 transition-colors cursor-pointer shadow-[0_0_24px_rgba(34,211,238,0.35)]"
              >
                <LogIn className="w-4 h-4" />
                <span>
                  {authLoading ? 'Authenticating with Google...' : 'Continue with Google'}
                </span>
              </button>
            </>
          ) : (
            <>
              {/* Verified Operator Identity Card */}
              <div className="p-4 rounded-xl bg-neutral-900/80 border border-cyan-500/25 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={displayName}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full border border-cyan-400/50 shrink-0 object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-200 font-bold text-sm shrink-0">
                      {(displayName || 'G')[0].toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-white truncate">
                        {displayName}
                      </span>
                      {user.emailVerified && (
                        <CheckCircle2
                          className="w-3.5 h-3.5 text-emerald-400 shrink-0"
                          title="Verified Email"
                        />
                      )}
                    </div>
                    <div className="text-xs text-neutral-400 truncate">{user.email}</div>
                    <div className="text-[11px] font-mono text-cyan-300 mt-0.5">
                      {sectorClearance} · {cloudSimulationsCount} Saved Runs
                    </div>
                  </div>
                </div>
              </div>

              {/* Operator Profile Form */}
              <form onSubmit={handleProfileSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Operator Callsign / Name
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={80}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-black border border-cyan-500/30 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Dispatch Organization / Command Center
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={80}
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-black border border-cyan-500/30 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Assigned Sector Clearance
                  </label>
                  <select
                    value={sectorClearance}
                    onChange={(e) => setSectorClearance(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-black border border-cyan-500/30 text-xs text-white focus:outline-none focus:border-cyan-400"
                  >
                    {SECTOR_CLEARANCE_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>

                {profileSavedMessage && (
                  <div className="text-xs text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{profileSavedMessage}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="flex-1 py-2 px-3 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-black font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>{savingProfile ? 'Saving Profile...' : 'Update Clearance Profile'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={savingToCloud}
                    onClick={onSaveSimulation}
                    className="py-2 px-3 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-cyan-500/30 text-cyan-200 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{savingToCloud ? 'Saving...' : 'Save Run'}</span>
                  </button>
                </div>
              </form>

              {/* Sign Out Footer */}
              <div className="pt-3 border-t border-cyan-500/20 flex items-center justify-between">
                <span className="text-[11px] font-mono text-neutral-500 truncate max-w-[200px]">
                  UID: {user.uid}
                </span>
                <button
                  type="button"
                  onClick={async () => {
                    await onSignOut();
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-red-950/60 border border-neutral-800 hover:border-red-500/40 text-xs text-neutral-300 hover:text-red-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
