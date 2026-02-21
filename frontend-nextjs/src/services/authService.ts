import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/config/firebase';
import { User, RegisterData, UserRole } from '../types';

/**
 * Authentication service using Firebase Auth + Firestore
 */
class AuthService {
  /**
   * Login with email and password
   */
  async login(credentials: { email: string; password: string }): Promise<User> {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      credentials.email,
      credentials.password
    );

    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
    if (!userDoc.exists()) {
      throw new Error('User profile not found');
    }

    return { id: userDoc.id, ...userDoc.data() } as User;
  }

  /**
   * Register new user
   */
  async register(data: RegisterData): Promise<User> {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      data.email,
      data.password
    );

    const userData: Omit<User, 'id'> = {
      name: data.name,
      email: data.email,
      phone: data.phone || '',
      role: data.role || UserRole.CUSTOMER,
      isActive: true,
      emailVerified: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'users', userCredential.user.uid), {
      ...userData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { id: userCredential.user.uid, ...userData };
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    await signOut(auth);
  }

  /**
   * Get current user profile from Firestore
   */
  async getCurrentUser(uid: string): Promise<User | null> {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (!userDoc.exists()) return null;
    return { id: userDoc.id, ...userDoc.data() } as User;
  }

  /**
   * Update user profile
   */
  async updateProfile(uid: string, updates: Partial<User>): Promise<User> {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });

    const updatedDoc = await getDoc(userRef);
    return { id: updatedDoc.id, ...updatedDoc.data() } as User;
  }

  /**
   * Request password reset email
   */
  async requestPasswordReset(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email);
  }

  /**
   * Change password (authenticated user)
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const user = auth.currentUser;
    if (!user || !user.email) throw new Error('No authenticated user');

    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPassword);
  }
}

export const authService = new AuthService();
export default authService;
