'use client';

import { useState, useCallback } from 'react';
import { z, ZodSchema } from 'zod';

export interface FormErrors {
  [key: string]: string | undefined;
}

export interface UseFormValidationReturn<T> {
  errors: FormErrors;
  isValid: boolean;
  validate: (data: T) => boolean;
  validateField: (field: keyof T, value: unknown) => string | undefined;
  clearError: (field: keyof T) => void;
  clearAllErrors: () => void;
  setError: (field: keyof T, message: string) => void;
}

export function useFormValidation<T extends Record<string, unknown>>(
  schema: ZodSchema<T>
): UseFormValidationReturn<T> {
  const [errors, setErrors] = useState<FormErrors>({});

  const validate = useCallback((data: T): boolean => {
    try {
      schema.parse(data);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: FormErrors = {};
        error.issues.forEach((err) => {
          const path = err.path.join('.');
          newErrors[path] = err.message;
        });
        setErrors(newErrors);
        return false;
      }
      return false;
    }
  }, [schema]);

  const validateField = useCallback((field: keyof T, value: unknown): string | undefined => {
    try {
      // Check if schema is a ZodObject and has shape property
      if ('shape' in schema && schema.shape) {
        const fieldSchema = (schema.shape as any)[field as string];
        if (fieldSchema) {
          fieldSchema.parse(value);
          // Clear error for this field if validation passes
          setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[field as string];
            return newErrors;
          });
          return undefined;
        }
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.issues[0]?.message || 'Invalid value';
        setErrors(prev => ({
          ...prev,
          [field as string]: errorMessage
        }));
        return errorMessage;
      }
    }
    return undefined;
  }, [schema]);

  const clearError = useCallback((field: keyof T) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field as string];
      return newErrors;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  const setError = useCallback((field: keyof T, message: string) => {
    setErrors(prev => ({
      ...prev,
      [field as string]: message
    }));
  }, []);

  const isValid = Object.keys(errors).length === 0;

  return {
    errors,
    isValid,
    validate,
    validateField,
    clearError,
    clearAllErrors,
    setError,
  };
}

// Real-time validation hook for individual fields
export function useFieldValidation<T>(
  schema: ZodSchema<T>,
  field: keyof T,
  value: unknown,
  validateOnChange: boolean = true
) {
  const [error, setError] = useState<string | undefined>();

  const validateField = useCallback(() => {
    if (!validateOnChange) return;
    
    try {
      // Check if schema is a ZodObject and has shape property
      if ('shape' in schema && schema.shape) {
        const fieldSchema = (schema.shape as any)[field as string];
        if (fieldSchema) {
          fieldSchema.parse(value);
          setError(undefined);
        }
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        setError(error.issues[0]?.message || 'Invalid value');
      }
    }
  }, [schema, field, value, validateOnChange]);

  const clearError = useCallback(() => {
    setError(undefined);
  }, []);

  return {
    error,
    validateField,
    clearError,
    setError,
  };
}
