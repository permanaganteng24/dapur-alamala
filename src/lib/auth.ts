import { STORAGE_KEYS } from '../constants';

export interface AdminAuthSession {
  email: string;
  role: 'owner' | 'admin';
  token: string;
  expiresAt: number;
  lastActive: number;
}

export interface SecurityLockStatus {
  isLocked: boolean;
  remainingMinutes: number;
  failedAttempts: number;
}

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes lockout on 5 failed attempts
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes inactivity timeout

const SECURITY_STORAGE_KEYS = {
  FAILED_ATTEMPTS: 'amala_sec_failed_attempts_v1',
  LOCKOUT_UNTIL: 'amala_sec_lockout_until_v1',
  SESSION_STORAGE_KEY: 'amala_sec_active_session_v1',
};

// Memory fallback for environments without window / SSR / test runner
let memorySession: AdminAuthSession | null = null;
let memoryFailedAttempts = 0;
let memoryLockoutUntil = 0;
let memoryCustomPassword: string | null = null;

export const SECRET_GATEWAY_PATH = 'portal-alamala-auth';
export const SECRET_GATEWAY_KEY = 'alamala-privat-2026';

export function verifyOwnerGatewayKey(key?: string | null): boolean {
  if (!key) return false;
  return key.trim().toLowerCase() === SECRET_GATEWAY_KEY;
}

// Safe storage helpers
function getSessionItem(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && 'sessionStorage' in window && window.sessionStorage) {
      return window.sessionStorage.getItem(key);
    }
  } catch {
    // ignore
  }
  return null;
}

function setSessionItem(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && 'sessionStorage' in window && window.sessionStorage) {
      window.sessionStorage.setItem(key, value);
    }
  } catch {
    // ignore
  }
}

function removeSessionItem(key: string): void {
  try {
    if (typeof window !== 'undefined' && 'sessionStorage' in window && window.sessionStorage) {
      window.sessionStorage.removeItem(key);
    }
  } catch {
    // ignore
  }
}

function getLocalItem(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && 'localStorage' in window && window.localStorage) {
      return window.localStorage.getItem(key);
    }
  } catch {
    // ignore
  }
  return null;
}

function setLocalItem(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && 'localStorage' in window && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  } catch {
    // ignore
  }
}

function removeLocalItem(key: string): void {
  try {
    if (typeof window !== 'undefined' && 'localStorage' in window && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  } catch {
    // ignore
  }
}

export function getLockoutStatus(): SecurityLockStatus {
  const now = Date.now();
  let lockoutUntil = memoryLockoutUntil;
  let failedAttempts = memoryFailedAttempts;

  const storedUntil = getSessionItem(SECURITY_STORAGE_KEYS.LOCKOUT_UNTIL) || 
                      getLocalItem(SECURITY_STORAGE_KEYS.LOCKOUT_UNTIL);
  const storedAttempts = getSessionItem(SECURITY_STORAGE_KEYS.FAILED_ATTEMPTS) || 
                         getLocalItem(SECURITY_STORAGE_KEYS.FAILED_ATTEMPTS);
  if (storedUntil) lockoutUntil = parseInt(storedUntil, 10) || 0;
  if (storedAttempts) failedAttempts = parseInt(storedAttempts, 10) || 0;

  if (lockoutUntil > now) {
    const remainingMs = lockoutUntil - now;
    const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));
    return {
      isLocked: true,
      remainingMinutes,
      failedAttempts
    };
  }

  return {
    isLocked: false,
    remainingMinutes: 0,
    failedAttempts
  };
}

function recordFailedAttempt(): SecurityLockStatus {
  const status = getLockoutStatus();
  const newAttempts = status.failedAttempts + 1;
  const now = Date.now();
  let lockoutUntil = 0;

  if (newAttempts >= MAX_FAILED_ATTEMPTS) {
    lockoutUntil = now + LOCKOUT_DURATION_MS;
  }

  memoryFailedAttempts = newAttempts;
  memoryLockoutUntil = lockoutUntil;

  setSessionItem(SECURITY_STORAGE_KEYS.FAILED_ATTEMPTS, newAttempts.toString());
  setLocalItem(SECURITY_STORAGE_KEYS.FAILED_ATTEMPTS, newAttempts.toString());
  if (lockoutUntil > 0) {
    setSessionItem(SECURITY_STORAGE_KEYS.LOCKOUT_UNTIL, lockoutUntil.toString());
    setLocalItem(SECURITY_STORAGE_KEYS.LOCKOUT_UNTIL, lockoutUntil.toString());
  }

  return getLockoutStatus();
}

function clearFailedAttempts(): void {
  memoryFailedAttempts = 0;
  memoryLockoutUntil = 0;
  removeSessionItem(SECURITY_STORAGE_KEYS.FAILED_ATTEMPTS);
  removeSessionItem(SECURITY_STORAGE_KEYS.LOCKOUT_UNTIL);
  removeLocalItem(SECURITY_STORAGE_KEYS.FAILED_ATTEMPTS);
  removeLocalItem(SECURITY_STORAGE_KEYS.LOCKOUT_UNTIL);
}

export async function loginAdmin(
  email: string, 
  password: string
): Promise<{ success: boolean; error?: string; session?: AdminAuthSession }> {
  // Check lockout
  const lockStatus = getLockoutStatus();
  if (lockStatus.isLocked) {
    return {
      success: false,
      error: `Akses dikunci sementara demi keamanan karena ${MAX_FAILED_ATTEMPTS} kali percobaan salah. Coba lagi dalam ${lockStatus.remainingMinutes} menit.`
    };
  }

  const normalizedEmail = email.trim().toLowerCase();
  let storedPass: string | null = null;
  if (typeof window !== 'undefined') {
    storedPass = localStorage.getItem(STORAGE_KEYS.CUSTOM_PASSWORD);
  } else {
    storedPass = memoryCustomPassword;
  }
  const validPassword = storedPass || 'amala2026';

  const isEmailFormat = normalizedEmail.includes('@') && normalizedEmail.includes('.');
  if (!isEmailFormat) {
    return { success: false, error: 'Format email tidak valid.' };
  }

  if (password !== validPassword) {
    const updatedLock = recordFailedAttempt();
    if (updatedLock.isLocked) {
      return {
        success: false,
        error: `Terlalu banyak percobaan gagal (${MAX_FAILED_ATTEMPTS}x). Akses dikunci sementara selama ${updatedLock.remainingMinutes} menit.`
      };
    }
    const remainingTries = MAX_FAILED_ATTEMPTS - updatedLock.failedAttempts;
    return {
      success: false,
      error: `Kata sandi salah. Sisa kesempatan: ${remainingTries}x sebelum akses dikunci.`
    };
  }

  // Clear failed attempts on successful password verification
  clearFailedAttempts();

  const now = Date.now();
  const session: AdminAuthSession = {
    email: normalizedEmail,
    role: 'owner',
    token: 'amala_sec_' + Math.random().toString(36).substring(2) + now.toString(36),
    expiresAt: now + (24 * 60 * 60 * 1000), // 24 hours max
    lastActive: now
  };

  memorySession = session;

  const sessionJson = JSON.stringify(session);
  setSessionItem(SECURITY_STORAGE_KEYS.SESSION_STORAGE_KEY, sessionJson);
  setLocalItem(STORAGE_KEYS.AUTH, sessionJson);

  return { success: true, session };
}

export async function logoutAdmin(): Promise<void> {
  memorySession = null;
  removeSessionItem(SECURITY_STORAGE_KEYS.SESSION_STORAGE_KEY);
  removeLocalItem(STORAGE_KEYS.AUTH);

  if (typeof window !== 'undefined' && window.location && typeof window.location.hash === 'string') {
    // Clean URL hash so no admin trace remains
    if (window.location.hash.startsWith('#/admin') || window.location.hash.startsWith('#admin')) {
      window.location.hash = '/';
    }
  }
}

export function touchAdminSession(): void {
  const session = getAdminSession();
  if (session) {
    session.lastActive = Date.now();
    memorySession = session;
    const sessionJson = JSON.stringify(session);
    setSessionItem(SECURITY_STORAGE_KEYS.SESSION_STORAGE_KEY, sessionJson);
    setLocalItem(STORAGE_KEYS.AUTH, sessionJson);
  }
}

export function getAdminSession(): AdminAuthSession | null {
  const now = Date.now();

  // Try retrieving from session or local storage
  const raw = getSessionItem(SECURITY_STORAGE_KEYS.SESSION_STORAGE_KEY) || 
              getLocalItem(STORAGE_KEYS.AUTH);

  if (!raw) {
    if (!memorySession) return null;
    if (now > memorySession.expiresAt) {
      memorySession = null;
      return null;
    }
    return memorySession;
  }

  try {
    const session: AdminAuthSession = JSON.parse(raw);

    // 1. Check absolute expiration
    if (now > session.expiresAt) {
      logoutAdmin();
      return null;
    }

    // 2. Check inactivity timeout (30 minutes of no user activity)
    if (session.lastActive && (now - session.lastActive > INACTIVITY_TIMEOUT_MS)) {
      logoutAdmin();
      return null;
    }

    memorySession = session;
    return session;
  } catch {
    return null;
  }
}

export function updateLocalAdminPassword(newPassword: string): boolean {
  if (!newPassword || newPassword.length < 6) return false;
  memoryCustomPassword = newPassword;
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_PASSWORD, newPassword);
  }
  return true;
}
