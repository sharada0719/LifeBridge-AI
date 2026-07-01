"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

// Define simpler props since type imports from next-themes/dist/types can sometimes be strict on build
export function ThemeProvider({ 
  children, 
  ...props 
}: { 
  children: React.ReactNode;
  attribute?: string;
  defaultTheme?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
  [key: string]: any;
}) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
