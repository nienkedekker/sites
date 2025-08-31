import React from "react";
import { cn } from "@/utils/ui";
import { useFormField } from "@/components/ui/form";

export type Message =
  | { success: string }
  | { error: string }
  | { message: string };

interface FormMessageProps extends React.HTMLAttributes<HTMLElement> {
  message?: Message;
}

export const FormMessage = React.forwardRef<HTMLElement, FormMessageProps>(
  ({ className, children, message, ...props }, ref) => {
    const { error, formMessageId } = useFormField();

    // If we have a server action message, render it with custom styling
    if (message) {
      return (
        <div className="flex flex-col gap-2 w-full max-w-md text-sm" {...props}>
          {"success" in message && (
            <div className="text-foreground border-l-2 border-foreground px-4">
              {message.success}
            </div>
          )}
          {"error" in message && (
            <div className="text-destructive-foreground border-l-2 border-destructive-foreground px-4">
              {message.error}
            </div>
          )}
          {"message" in message && (
            <div className="text-foreground border-l-2 px-4">
              {message.message}
            </div>
          )}
        </div>
      );
    }

    // Otherwise, handle field validation errors (shadcn behavior)
    const body = error ? String(error?.message ?? "") : children;

    if (!body) {
      return null;
    }

    return (
      <p
        ref={ref as React.ForwardedRef<HTMLParagraphElement>}
        id={formMessageId}
        className={cn("text-sm font-medium text-destructive", className)}
        {...props}
      >
        {body}
      </p>
    );
  },
);

FormMessage.displayName = "FormMessage";
