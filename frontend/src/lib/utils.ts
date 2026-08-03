import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function extractErrorMessage(err: unknown): string {
  if (!err || typeof err !== 'object') {
    return 'An unexpected error occurred';
  }

  const error = err as {
    response?: {
      data?: {
        error?: {
          message?: string;
          details?: { errors?: Array<{ msg?: string; message?: string }> }
        };
        detail?: string | Array<{ loc?: string[]; msg?: string }>;
      }
    };
    message?: string
  };

  const data = error.response?.data;
  if (!data) return error.message || 'An unexpected error occurred';

  // Support custom error envelope: { error: { message, details: { errors: [...] } } }
  if (data.error) {
    if (data.error.details?.errors && Array.isArray(data.error.details.errors)) {
      return data.error.details.errors.map((e) => e.msg || e.message || JSON.stringify(e)).join(', ');
    }
    if (data.error.message) return data.error.message;
  }

  const detail = data.detail;
  if (Array.isArray(detail)) {
    return detail.map((d) => {
      const field = d.loc && d.loc.length > 1 ? d.loc.slice(1).join('.') : '';
      return `${field ? field + ': ' : ''}${d.msg}`;
    }).join(', ');
  }
  if (typeof detail === 'string') return detail;
  return error.message || 'An unexpected error occurred';
}
