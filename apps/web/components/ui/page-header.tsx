import { ReactNode } from "react";

interface PageHeaderProps {
  children: ReactNode;
  className?: string;
}

export function PageHeader({ children, className = "" }: PageHeaderProps) {
  return (
    <div className={`text-left ${className}`}>
      <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-700 via-gray-500 to-gray-700 dark:from-gray-200 dark:via-gray-100 dark:to-gray-200 bg-clip-text text-transparent leading-tight pb-1">
        {children}
      </h1>
    </div>
  );
}
