import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuth, loginAnonymous, loginGoogle, loginApple,
  loginEmail, registerEmail, createUserProfile, getUserProfile,
  assignAutoGroup,
} from '../lib/firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(undefined); // undefined = loading
  const [profile, setProfile] = useState(null);

  useEffect(() => {
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

          // Auto-assign to a group if new user
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
    isLoading:   user === undefined,
    isAnonymous: user?.isAnonymous ?? true,
    signInAnon:  loginAnonymous,
    signInGoogle:loginGoogle,
    signInApple: loginApple,
    signInEmail: loginEmail,
    registerEmail,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
