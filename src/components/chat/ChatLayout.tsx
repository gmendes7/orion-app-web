/**
 * 🎨 Layout Principal do Chat - O.R.I.O.N
 * 
 * Container principal com layout responsivo mobile-first.
 * Gerencia sidebar, header e área de conteúdo.
 */


import { ReactNode } from "react";

interface ChatLayoutProps {
  sidebar: ReactNode;
  header: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

export const ChatLayout = ({
  sidebar,
  header,
  children,
  footer,
}: ChatLayoutProps) => {
  return (
    <div className="flex h-[100dvh] w-full bg-gradient-to-br from-background via-background to-muted/20 text-foreground relative overflow-hidden">
      {/* Sidebar */}
      {sidebar}

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative z-10 min-w-0">
        {/* Header */}
        {header}

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-h-0">
          {children}
        </div>

        {/* Footer */}
        {footer}
      </main>
    </div>
  );
};
