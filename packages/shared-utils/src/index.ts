// ============================================
// VALIDATION UTILITIES
// ============================================
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateUsername = (username: string): boolean => {
  // 1-15 chars, alphanumeric + underscore
  const usernameRegex = /^[a-zA-Z0-9_]{1,15}$/;
  return usernameRegex.test(username);
};

export const validatePassword = (password: string): boolean => {
  // At least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

export const validateTweetContent = (content: string): boolean => {
  return content.trim().length > 0 && content.length <= 280;
};

export const validateHashtag = (hashtag: string): boolean => {
  const hashtagRegex = /^#[a-zA-Z0-9_]{1,}$/;
  return hashtagRegex.test(hashtag);
};

export const validateURL = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// ============================================
// FORMATTING UTILITIES
// ============================================
export const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatTime = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

export const formatDateTime = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

export const formatRelativeTime = (date: Date | string): string => {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return formatDate(d);
};

export const formatNumber = (num: number): string => {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

// ============================================
// STRING UTILITIES
// ============================================
export const slugify = (str: string): string => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const extractHashtags = (text: string): string[] => {
  const regex = /#[a-zA-Z0-9_]{1,}/g;
  const matches = text.match(regex);
  return matches ? matches.map((tag) => tag.slice(1)) : [];
};

export const extractMentions = (text: string): string[] => {
  const regex = /@[a-zA-Z0-9_]{1,}/g;
  const matches = text.match(regex);
  return matches ? matches.map((mention) => mention.slice(1)) : [];
};

export const truncate = (str: string, length: number): string => {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
};

// ============================================
// ARRAY UTILITIES
// ============================================
export const chunk = <T,>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

export const unique = <T,>(array: T[]): T[] => {
  return Array.from(new Set(array));
};

export const flatten = <T,>(array: T[][]): T[] => {
  return array.reduce((acc, val) => acc.concat(val), []);
};

// ============================================
// OBJECT UTILITIES
// ============================================
export const isEmpty = (obj: Record<string, any>): boolean => {
  return Object.keys(obj).length === 0;
};

export const omit = <T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> => {
  const result = { ...obj };
  keys.forEach((key) => {
    delete result[key];
  });
  return result;
};

export const pick = <T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> => {
  const result: any = {};
  keys.forEach((key) => {
    result[key] = obj[key];
  });
  return result;
};

// ============================================
// CONSTANTS
// ============================================
export const TWEET_MAX_LENGTH = 280;
export const USERNAME_MIN_LENGTH = 1;
export const USERNAME_MAX_LENGTH = 15;
export const BIO_MAX_LENGTH = 160;
export const PASSWORD_MIN_LENGTH = 8;
export const ITEMS_PER_PAGE = 20;
export const TIMEOUT_MS = 30000;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
} as const;
