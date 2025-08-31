import { useState, useCallback } from "react";
import { z } from "zod";

export type ValidationErrors = Record<string, string[]>;

export interface UseFormValidationResult<T> {
  errors: ValidationErrors;
  isValid: boolean;
  validateField: (name: keyof T, value: unknown) => void;
  validateForm: (data: T) => boolean;
  clearErrors: () => void;
  clearFieldError: (name: keyof T) => void;
}

export function useFormValidation<T extends Record<string, unknown>>(
  schema: z.ZodSchema<T>,
): UseFormValidationResult<T> {
  const [errors, setErrors] = useState<ValidationErrors>({});

  const validateField = useCallback(
    (name: keyof T, value: unknown) => {
      try {
        // For discriminated unions, we need to validate the whole form
        // to get proper field-level validation
        const testData = { [name]: value } as Partial<T>;
        schema.parse(testData);

        // Clear error if validation passes
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[name as string];
          return newErrors;
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          const fieldErrors = error.issues
            .filter((issue) => issue.path.includes(name as string))
            .map((issue) => issue.message);

          if (fieldErrors.length > 0) {
            setErrors((prev) => ({
              ...prev,
              [name as string]: fieldErrors,
            }));
          }
        }
      }
    },
    [schema],
  );

  const validateForm = useCallback(
    (data: T): boolean => {
      try {
        schema.parse(data);
        setErrors({});
        return true;
      } catch (error) {
        if (error instanceof z.ZodError) {
          const newErrors: ValidationErrors = {};
          error.issues.forEach((issue) => {
            const path = issue.path.join(".");
            if (!newErrors[path]) newErrors[path] = [];
            newErrors[path].push(issue.message);
          });
          setErrors(newErrors);
        }
        return false;
      }
    },
    [schema],
  );

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const clearFieldError = useCallback((name: keyof T) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[name as string];
      return newErrors;
    });
  }, []);

  const isValid = Object.keys(errors).length === 0;

  return {
    errors,
    isValid,
    validateField,
    validateForm,
    clearErrors,
    clearFieldError,
  };
}
