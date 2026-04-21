/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuth } from './useAuth';
import { renderHook, act } from '@testing-library/react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged,
  updateProfile
} from '../services/firebase';

// Mock Firebase services
vi.mock('../services/firebase', () => ({
  auth: { currentUser: null },
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  onAuthStateChanged: vi.fn(),
  signOut: vi.fn(),
  updateProfile: vi.fn(),
  sendEmailVerification: vi.fn()
}));

describe('useAuth Hook (Advanced)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    onAuthStateChanged.mockImplementation((auth, callback) => {
      callback(null);
      return () => {};
    });
  });

  it('should initialize with loading state and handle auth state transitions', async () => {
    let stateCallback;
    onAuthStateChanged.mockImplementation((auth, callback) => {
      stateCallback = callback;
      return () => {};
    });

    const { result } = renderHook(() => useAuth());
    expect(result.current.loading).toBe(true);

    // Simulate user login transition
    await act(async () => {
      if (stateCallback) stateCallback({ uid: '123', email: 'test@csk.com', displayName: 'Captain' });
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.user.displayName).toBe('Captain');
  });

  it('should orchestrate successful registration with profile updates', async () => {
    createUserWithEmailAndPassword.mockResolvedValue({ 
      user: { uid: 'u1', email: 'fan@csk.com' } 
    });
    updateProfile.mockResolvedValue();

    const { result } = renderHook(() => useAuth());
    
    let regResult;
    await act(async () => {
      regResult = await result.current.register('fan@csk.com', 'yellowarmy', 'MS Fan');
    });

    expect(regResult.success).toBe(true);
    expect(updateProfile).toHaveBeenCalledWith(expect.anything(), { displayName: 'MS Fan' });
    expect(result.current.user.displayName).toBe('MS Fan');
  });

  it('should map Firebase error codes to user-friendly messages', async () => {
    signInWithEmailAndPassword.mockRejectedValue({ code: 'auth/wrong-password' });

    const { result } = renderHook(() => useAuth());
    
    let loginResult;
    await act(async () => {
      loginResult = await result.current.login('test@test.com', 'password123');
    });

    expect(loginResult.success).toBe(false);
    expect(loginResult.message).toBe("Incorrect password or email combination.");
  });
});
