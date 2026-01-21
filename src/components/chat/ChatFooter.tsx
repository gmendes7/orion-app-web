/**
 * 🦶 Footer do Chat - O.R.I.O.N
 * 
 * Footer minimalista com créditos.
 */

import { memo } from "react";

export const ChatFooter = memo(() => {
  return (
    <footer className="border-t border-primary/20 backdrop-blur-xl bg-card/30 py-1.5 xs:py-2 sm:py-2.5 px-2 xs:px-3 sm:px-4 flex-shrink-0">
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-[9px] xs:text-[10px] sm:text-xs text-muted-foreground/80">
          Desenvolvido por{" "}
          <span className="text-primary font-medium stellar-text">
            Gabriel Mendes
          </span>
        </p>
      </div>
    </footer>
  );
});

ChatFooter.displayName = "ChatFooter";
