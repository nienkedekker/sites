import React from "react";

export type Message =
  | { success: string }
  | { error: string }
  | { message: string };

interface FormMessageProps extends React.HTMLAttributes<HTMLElement> {
  message?: Message;
}

export const FormMessage = React.forwardRef<HTMLElement, FormMessageProps>(
  ({ className, children, message, ...props }, ref) => {
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
  },
);

FormMessage.displayName = "FormMessage";
