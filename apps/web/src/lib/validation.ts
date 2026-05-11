export interface ValidationError {
  field: string;
  message: string;
}

export interface FormErrors {
  [key: string]: string;
}

export const validateEmail = (email: string): string | null => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) return 'Email is required';
  if (!emailRegex.test(email)) return 'Invalid email format';
  return null;
};

export const validatePassword = (password: string): string | null => {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(password))
    return 'Password must contain an uppercase letter';
  if (!/[a-z]/.test(password))
    return 'Password must contain a lowercase letter';
  if (!/\d/.test(password)) return 'Password must contain a number';
  if (!/[@$!%*?&]/.test(password))
    return 'Password must contain a special character (@$!%*?&)';
  return null;
};

export const validateUsername = (username: string): string | null => {
  if (!username) return 'Username is required';
  if (username.length < 1) return 'Username must be at least 1 character';
  if (username.length > 15) return 'Username must be at most 15 characters';
  if (!/^[a-zA-Z0-9_]+$/.test(username))
    return 'Username can only contain letters, numbers, and underscores';
  return null;
};

export const validateDisplayName = (name: string): string | null => {
  if (!name) return 'Display name is required';
  if (name.length < 2) return 'Display name must be at least 2 characters';
  if (name.length > 50) return 'Display name must be at most 50 characters';
  return null;
};

export const validateConfirmPassword = (
  password: string,
  confirmPassword: string
): string | null => {
  if (!confirmPassword) return 'Please confirm your password';
  if (password !== confirmPassword) return 'Passwords do not match';
  return null;
};

export const validateLoginForm = (
  email: string,
  password: string
): FormErrors => {
  const errors: FormErrors = {};
  const emailError = validateEmail(email);
  const passwordError = validatePassword(password);

  if (emailError) errors.email = emailError;
  if (passwordError) errors.password = passwordError;

  return errors;
};

export const validateRegisterForm = (
  username: string,
  email: string,
  password: string,
  confirmPassword: string,
  displayName: string
): FormErrors => {
  const errors: FormErrors = {};

  const usernameError = validateUsername(username);
  const emailError = validateEmail(email);
  const passwordError = validatePassword(password);
  const confirmPasswordError = validateConfirmPassword(
    password,
    confirmPassword
  );
  const displayNameError = validateDisplayName(displayName);

  if (usernameError) errors.username = usernameError;
  if (emailError) errors.email = emailError;
  if (passwordError) errors.password = passwordError;
  if (confirmPasswordError) errors.confirmPassword = confirmPasswordError;
  if (displayNameError) errors.displayName = displayNameError;

  return errors;
};
