import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  getDocFromServer,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const SECTOR_CLEARANCE_ROLES = [
  'Grid Commander',
  'Hospital Liaison',
  'Water Operations',
  'Emergency Dispatch',
  'Telecom Engineer',
];

export const OperationType = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  LIST: 'list',
  GET: 'get',
  WRITE: 'write',
};

export function handleFirestoreError(error, operationType, path) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('the client is offline')
    ) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

export function formatAuthError(error) {
  const code = error?.code || '';
  if (code === 'auth/popup-closed-by-user') {
    return 'Sign-in popup was closed before completing authentication. Please try again.';
  }
  if (code === 'auth/popup-blocked') {
    return 'Browser blocked the authentication popup. Please allow popups for this site and try again.';
  }
  if (code === 'auth/cancelled-popup-request') {
    return 'Another sign-in popup is already open.';
  }
  if (code === 'auth/unauthorized-domain') {
    return 'This preview domain is being authorized with Firebase Authentication. Please refresh and try again.';
  }
  return error instanceof Error ? error.message : 'Authentication failed. Please try again.';
}

function sanitizeId(raw) {
  return String(raw || '')
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .slice(0, 128);
}

export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  if (result.user) {
    await ensureOperatorProfile(result.user);
  }
  return result.user;
}

export async function signOutUser() {
  await signOut(auth);
}

export { onAuthStateChanged };

export async function ensureOperatorProfile(user) {
  if (!user || !user.uid) return null;
  const operatorId = sanitizeId(user.uid);
  if (!operatorId) return null;

  const path = `operators/${operatorId}`;
  const docRef = doc(db, 'operators', operatorId);

  try {
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() };
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }

  const defaultName = String(
    user.displayName || user.email?.split('@')[0] || 'Grid Operator'
  )
    .trim()
    .slice(0, 80) || 'Grid Operator';

  const payload = {
    ownerId: operatorId,
    displayName: defaultName,
    organization: 'Regional Grid Command',
    sectorClearance: 'Grid Commander',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(docRef, payload);
    return { id: operatorId, ...payload };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function subscribeToOperatorProfile(uid, onUpdate) {
  const operatorId = sanitizeId(uid);
  if (!operatorId) return () => {};
  const path = `operators/${operatorId}`;
  const docRef = doc(db, 'operators', operatorId);

  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        onUpdate({ id: snap.id, ...snap.data() });
      } else {
        onUpdate(null);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function updateOperatorProfile(uid, updates) {
  const operatorId = sanitizeId(uid);
  if (!operatorId) return;
  const path = `operators/${operatorId}`;
  const docRef = doc(db, 'operators', operatorId);

  const displayName =
    String(updates.displayName || 'Grid Operator').trim().slice(0, 80) ||
    'Grid Operator';
  const organization =
    String(updates.organization || 'Regional Grid Command').trim().slice(0, 80) ||
    'Regional Grid Command';
  const sectorClearance = SECTOR_CLEARANCE_ROLES.includes(updates.sectorClearance)
    ? updates.sectorClearance
    : 'Grid Commander';

  try {
    await updateDoc(docRef, {
      displayName,
      organization,
      sectorClearance,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function saveSimulationToCloud(simulation, notes = '') {
  const user = auth.currentUser;
  if (!user) return null;

  const simId = sanitizeId(`sim_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
  const path = `simulations/${simId}`;

  const ownerId = sanitizeId(user.uid);
  const scenario = String(simulation.scenario || 'Flood').slice(0, 64);
  const supply = Math.max(0, Math.min(10000, Number(simulation.supply || 0)));
  const totalDemand = Math.max(0, Math.min(10000, Number(simulation.total_demand || 0)));
  const safe = Boolean(simulation.safe);
  const statusMessage = String(
    simulation.status_message || (safe ? 'Safe Allocation Achieved' : 'No Safe Allocation Possible')
  ).slice(0, 160);

  const alloc = simulation.allocation || {};
  const hospitalAllocated = Math.max(0, Math.min(10000, Number(alloc.Hospital || 0)));
  const waterAllocated = Math.max(0, Math.min(10000, Number(alloc.Water || 0)));
  const emergencyAllocated = Math.max(0, Math.min(10000, Number(alloc.Emergency || 0)));
  const telecomAllocated = Math.max(0, Math.min(10000, Number(alloc.Telecom || 0)));

  const payload = {
    ownerId,
    scenario,
    supply,
    totalDemand,
    safe,
    statusMessage,
    hospitalAllocated,
    waterAllocated,
    emergencyAllocated,
    telecomAllocated,
    notes: String(notes || '').slice(0, 300),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'simulations', simId), payload);
    return simId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateSimulationNotes(simId, notes) {
  const cleanId = sanitizeId(simId);
  const path = `simulations/${cleanId}`;
  try {
    await updateDoc(doc(db, 'simulations', cleanId), {
      notes: String(notes || '').slice(0, 300),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteSimulationFromCloud(simId) {
  const cleanId = sanitizeId(simId);
  const path = `simulations/${cleanId}`;
  try {
    await deleteDoc(doc(db, 'simulations', cleanId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeToUserSimulations(uid, onUpdate) {
  if (!uid) return () => {};
  const path = 'simulations';
  const q = query(collection(db, path), where('ownerId', '==', uid));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      items.sort((a, b) => {
        const tA = a.createdAt?.seconds || 0;
        const tB = b.createdAt?.seconds || 0;
        return tB - tA;
      });
      onUpdate(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}
