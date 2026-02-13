'use client';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  User,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile as firebaseUpdateProfile,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  deleteUser
} from 'firebase/auth';
import { auth, googleProvider, db } from '@/lib/firebase';
import { doc, setDoc, getDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (name: string, photoURL?: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  deleteAccount: (password?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);

          if (!userSnap.exists()) {
            await setDoc(userRef, {
              email: user.email,
              name: user.displayName || user.email?.split('@')[0],
              photoURL: user.photoURL,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }
        } catch (error) {
          console.error('Error creating user document:', error);
        }
      }

      setUser(user);
      setLoading(false);
      setInitializing(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);

      if (result.user) {
        toast.success('Signed in successfully!');

        // Check company in parallel
        const companiesQuery = query(collection(db, 'companies'), where('ownerId', '==', result.user.uid));
        const companiesSnapshot = await getDocs(companiesQuery);

        if (companiesSnapshot.empty) {
          router.push('/onboarding');
        } else {
          router.push('/companies');
        }
      }
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      if (error.code !== 'auth/popup-closed-by-user') {
        toast.error('Failed to sign in with Google');
      }
      throw error;
    }
  }, [router]);

  const signUpWithEmail = useCallback(async (email: string, password: string, name: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);

      const userRef = doc(db, 'users', result.user.uid);
      await setDoc(userRef, {
        email: result.user.email,
        name: name,
        photoURL: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast.success('Account created successfully!');
      router.push('/onboarding');
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        toast.error('Email already in use');
      } else if (error.code === 'auth/weak-password') {
        toast.error('Password is too weak');
      } else {
        toast.error('Failed to create account');
      }
      throw error;
    }
  }, [router]);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);

      toast.success('Signed in successfully!');

      // Check company
      const companiesQuery = query(collection(db, 'companies'), where('ownerId', '==', result.user.uid));
      const companiesSnapshot = await getDocs(companiesQuery);

      if (companiesSnapshot.empty) {
        router.push('/onboarding');
      } else {
        router.push('/companies');
      }
    } catch (error: any) {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        toast.error('Invalid email or password');
      } else {
        toast.error('Failed to sign in');
      }
      throw error;
    }
  }, [router]);

  const signOut = useCallback(async () => {
    try {
      await firebaseSignOut(auth);
      toast.success('Signed out successfully');
      router.push('/login');
    } catch (error) {
      toast.error('Failed to sign out');
    }
  }, [router]);

  const updateProfile = useCallback(async (name: string, photoURL?: string) => {
    if (!user) throw new Error('No user logged in');

    try {
      // Update Firebase Auth profile
      await firebaseUpdateProfile(user, {
        displayName: name,
        ...(photoURL && { photoURL }),
      });

      // Update Firestore user document
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        name,
        ...(photoURL && { photoURL }),
        updatedAt: serverTimestamp(),
      }, { merge: true });

      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
      throw error;
    }
  }, [user]);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    if (!user || !user.email) throw new Error('No user logged in');

    try {
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, newPassword);

      toast.success('Password changed successfully');
    } catch (error: any) {
      console.error('Error changing password:', error);
      if (error.code === 'auth/wrong-password') {
        toast.error('Current password is incorrect');
      } else if (error.code === 'auth/weak-password') {
        toast.error('New password is too weak');
      } else {
        toast.error('Failed to change password');
      }
      throw error;
    }
  }, [user]);

  const deleteAccount = useCallback(async (password?: string) => {
    if (!user) throw new Error('No user logged in');

    try {
      // Re-authenticate if password provided (for email/password users)
      if (password && user.email) {
        const credential = EmailAuthProvider.credential(user.email, password);
        await reauthenticateWithCredential(user, credential);
      }

      // Delete user document from Firestore
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        deleted: true,
        deletedAt: serverTimestamp(),
      }, { merge: true });

      // Delete Firebase Auth account
      await deleteUser(user);

      toast.success('Account deleted successfully');
      router.push('/');
    } catch (error: any) {
      console.error('Error deleting account:', error);
      if (error.code === 'auth/wrong-password') {
        toast.error('Password is incorrect');
      } else if (error.code === 'auth/requires-recent-login') {
        toast.error('Please sign in again before deleting your account');
      } else {
        toast.error('Failed to delete account');
      }
      throw error;
    }
  }, [user, router]);

  if (initializing) {
    return null;
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signInWithGoogle,
      signUpWithEmail,
      signInWithEmail,
      signOut,
      updateProfile,
      changePassword,
      deleteAccount
    }}>
      {children}
    </AuthContext.Provider>
  );
}
