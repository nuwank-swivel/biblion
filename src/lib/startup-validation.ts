export type StartupValidationResult = {
  isValid: boolean;
  errors: string[];
  warnings: string[];
};

function validateEnvVars(): string[] {
  const required = [
    "VITE_FIREBASE_API_KEY",
    "VITE_FIREBASE_AUTH_DOMAIN",
    "VITE_FIREBASE_PROJECT_ID",
    "VITE_FIREBASE_APP_ID",
  ];
  const missing: string[] = [];
  for (const key of required) {
    // import.meta.env.* is how Vite injects envs
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const value = (import.meta as any)?.env?.[key];
    if (!value) missing.push(key);
  }
  return missing;
}

async function validateStartup(): Promise<StartupValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Env validation
  const missing = validateEnvVars();
  if (missing.length > 0) {
    const message = `Missing required Firebase environment variables: ${missing.join(", ")}. Please set them in your .env.`;
    if (import.meta.env.DEV) {
      warnings.push(message);
    } else {
      errors.push(message);
    }
  }

  // Example warning (can be extended later)
  if (import.meta.env.DEV) {
    // no-op, but place to add dev-time warnings
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

export const startupValidator = { validateStartup };


