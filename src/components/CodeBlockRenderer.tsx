import { useToast } from "@/integrations/hooks/use-toast";
import { Copy } from "lucide-react";
import React, { Suspense } from "react";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Button } from "./ui/button";

// 1. Carrega a biblioteca de forma "preguiçosa" (lazy)
const LazySyntaxHighlighter = React.lazy(() =>
  import("react-syntax-highlighter").then((module) => ({
    default: module.Prism,
  }))
);

interface CodeBlockRendererProps extends React.ComponentPropsWithoutRef<"pre"> {
  language: string;
  codeText: string;
}

const CodeBlockRenderer: React.FC<CodeBlockRendererProps> = ({
  language,
  codeText,
  ...props
}) => {
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(codeText);
    toast({
      title: "Copiado!",
      description: "Código copiado para a área de transferência.",
    });
  };

  return (
    <div className="relative my-2 rounded-lg bg-[#0d1117]">
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 h-6 w-6 text-gray-400 hover:text-white"
        onClick={handleCopy}
      >
        <Copy className="w-4 h-4" />
      </Button>
      {/* 2. Usa Suspense para mostrar um fallback enquanto o componente pesado carrega */}
      <Suspense
        fallback={
          <pre className="p-4 overflow-x-auto">
            <code>{codeText}</code>
          </pre>
        }
      >
        <LazySyntaxHighlighter
          style={vscDarkPlus}
          language={language}
          PreTag="div"
          {...props}
        >
          {codeText}
        </LazySyntaxHighlighter>
      </Suspense>
    </div>
  );
};

export default CodeBlockRenderer;
