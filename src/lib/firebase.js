// ─── Firebase Configuration ─────────────────────────────────────────────────
// Replace these values with your own Firebase project credentials
// https://console.firebase.google.com

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  linkWithPopup,
  updateProfile,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  increment,
  serverTimestamp,
  onSnapshot,
  addDoc,
  arrayUnion,
} from 'firebase/firestore';

// ⚠️  REPLACE WITH YOUR FIREBASE CONFIG
const firebaseConfig = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId:             "YOUR_APP_ID",
};

const app  = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);

// ─── Auth helpers ───────────────────────────────────────────────────────────
export const loginAnonymous = () => signInAnonymously(auth);

export const loginGoogle = () =>
  signInWithPopup(auth, new GoogleAuthProvider());

export const loginApple = () =>
  signInWithPopup(auth, new OAuthProvider('apple.com'));

export const loginEmail = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);

export const registerEmail = (email, password) =>
  createUserWithEmailAndPassword(auth, email, password);

export const upgradeAnonymous = (provider) =>
  linkWithPopup(auth.currentUser, provider);

export const onAuth = (cb) => onAuthStateChanged(auth, cb);

// ─── User profile ────────────────────────────────────────────────────────────
export async function createUserProfile(uid, data) {
  await setDoc(doc(db, 'users', uid), {
    uid,
    displayName:  data.displayName  || 'Player',
    avatar:       data.avatar       || null,
    country:      data.country      || null,
    level:        'beginner',
    totalPoints:  0,
    gamesPlayed:  0,
    gamesWon:     0,
    currentStreak:0,
    bestStreak:   0,
    achievements: [],
    groupId:      null,
    isAnonymous:  data.isAnonymous  || false,
    lang:         data.lang         || 'es',
    createdAt:    serverTimestamp(),
    updatedAt:    serverTimestamp(),
  }, { merge: true });
}

export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}

export async function updateUserProfile(uid, data) {
  await updateDoc(doc(db, 'users', uid), { ...data, updatedAt: serverTimestamp() });
}

// ─── Score & stats ───────────────────────────────────────────────────────────
export async function saveGameResult(uid, result) {
  // Save to games history
  await addDoc(collection(db, 'games'), {
    uid,
    ...result,
    playedAt: serverTimestamp(),
  });

  // Update user stats
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    totalPoints:  increment(result.score),
    gamesPlayed:  increment(1),
    gamesWon:     increment(result.completed ? 1 : 0),
    updatedAt:    serverTimestamp(),
  });

  // Update group score if in a group
  const profile = await getUserProfile(uid);
  if (profile?.groupId) {
    await updateDoc(doc(db, 'groups', profile.groupId), {
      totalPoints: increment(result.score),
      updatedAt:   serverTimestamp(),
    });
  }
}

// ─── Groups ──────────────────────────────────────────────────────────────────
export async function createGroup(uid, name, isPublic = true) {
  const code = Math.random().toString(36).slice(2, 8).toUpperCase();
  const ref = await addDoc(collection(db, 'groups'), {
    name,
    code,
    isPublic,
    isAuto:       false,
    ownerId:      uid,
    members:      [uid],
    totalPoints:  0,
    createdAt:    serverTimestamp(),
    updatedAt:    serverTimestamp(),
  });
  await updateDoc(doc(db, 'users', uid), { groupId: ref.id });
  return { id: ref.id, code };
}

export async function joinGroup(uid, groupId) {
  await updateDoc(doc(db, 'groups', groupId), { members: arrayUnion(uid) });
  await updateDoc(doc(db, 'users', uid), { groupId });
}

export async function joinGroupByCode(uid, code) {
  const q = query(collection(db, 'groups'), where('code', '==', code.toUpperCase()));
  const snap = await getDocs(q);
  if (snap.empty) throw new Error('Group not found');
  const groupId = snap.docs[0].id;
  await joinGroup(uid, groupId);
  return groupId;
}

export async function assignAutoGroup(uid, levelId) {
  // Find an auto group with < 15 members at similar level
  const q = query(
    collection(db, 'groups'),
    where('isAuto', '==', true),
    where('level', '==', levelId),
    limit(5)
  );
  const snap = await getDocs(q);
  let groupId = null;

  for (const d of snap.docs) {
    if (d.data().members.length < 15) {
      groupId = d.id;
      break;
    }
  }

  // Create new auto group if none found
  if (!groupId) {
    const ref = await addDoc(collection(db, 'groups'), {
      name:        `Auto Group ${Date.now()}`,
      isAuto:      true,
      isPublic:    false,
      level:       levelId,
      members:     [],
      totalPoints: 0,
      createdAt:   serverTimestamp(),
      updatedAt:   serverTimestamp(),
    });
    groupId = ref.id;
  }

  await joinGroup(uid, groupId);
  return groupId;
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────
export async function getLeaderboard(type = 'global', limit_ = 50) {
  const col = type === 'groups' ? 'groups' : 'users';
  const q = query(
    collection(db, col),
    orderBy('totalPoints', 'desc'),
    limit(limit_)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d, i) => ({ rank: i + 1, ...d.data(), id: d.id }));
}

export function subscribeLeaderboard(groupId, cb) {
  const q = query(
    collection(db, 'users'),
    where('groupId', '==', groupId),
    orderBy('totalPoints', 'desc'),
    limit(20)
  );
  return onSnapshot(q, snap =>
    cb(snap.docs.map((d, i) => ({ rank: i + 1, ...d.data(), id: d.id })))
  );
}

// ─── Tournaments ─────────────────────────────────────────────────────────────
export async function getCurrentTournament() {
  const now = new Date();
  const q = query(
    collection(db, 'tournaments'),
    where('endsAt', '>', now),
    orderBy('endsAt'),
    limit(1)
  );
  const snap = await getDocs(q);
  return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
}
