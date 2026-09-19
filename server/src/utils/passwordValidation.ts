export function validatePasswordComplexity(password: string): { isValid: boolean; reason?: string } {
  if (!password || typeof password !== "string") {
    return { isValid: false, reason: "Password must be a non-empty string" };
  }

  if (password.length < 8) {
    return { isValid: false, reason: "Password must be at least 8 characters long" };
  }

  if (!/[A-Z]/.test(password)) {
    return { isValid: false, reason: "Password must contain at least one uppercase letter" };
  }

  if (!/[a-z]/.test(password)) {
    return { isValid: false, reason: "Password must contain at least one lowercase letter" };
  }

  if (!/[0-9]/.test(password)) {
    return { isValid: false, reason: "Password must contain at least one numeric digit" };
  }

  // Special characters regex
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`\-]/.test(password)) {
    return { isValid: false, reason: "Password must contain at least one special character" };
  }

  return { isValid: true };
}
