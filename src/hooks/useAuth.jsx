import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuth, loginAnonymous, loginGoogle, loginApple,
  loginEmail, registerEmail, createUserProfile, getUserProfile,
  assignAutoGroup, getRedirectResult, auth,
} from '../lib/firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(undefined);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    // Handle redirect result on mobile after Google login
    getRedirectResult(auth).then(async (result) => {
      if (result?.user) {
        let p = await getUserProfile(result.user.uid);
        if (!p) {
          await createUserProfile(result.user.uid, {
            displayName: result.user.displayName || 'Player',
            avatar:      result.user.photoURL    || null,
            isAnonymous: false,
          });
          p = await getUserProfile(result.user.uid);
          if (!p.groupId) {
            await assignAutoGroup(result.user.uid, 'beginner');
            p = await getUserProfile(result.user.uid);
          }
        }
        setProfile(p);
      }
    }).catch(() => {});

    const unsub = onAuth(async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        let p = await getUserProfile(firebaseUser.uid);
        if (!p) {
          await createUserProfile(firebaseUser.uid, {
            displayName: firebaseUser.displayName || 'Player',
            avatar:      firebaseUser.photoURL    || null,
            isAnonymous: firebaseUser.isAnonymous,
          });
          p = await getUserProfile(firebaseUser.uid);
          if (!p.groupId) {
            await assignAutoGroup(firebaseUser.uid, 'beginner');
            p = await getUserProfile(firebaseUser.uid);
          }
        }
        setProfile(p);
      } else {
        setProfile(null);
      }
    });
    return unsub;
  }, []);

  const refreshProfile = async () => {
    if (user) {
      const p = await getUserProfile(user.uid);
      setProfile(p);
    }
  };

  const value = {
    user,
    profile,
    refreshProfile,
    isLoading:    user === undefined,
    isAnonymous:  user?.isAnonymous ?? true,
    signInAnon:   loginAnonymous,
    signInGoogle: loginGoogle,
    signInApple:  loginApple,
    signInEmail:  loginEmail,
    registerEmail,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
