import React, { useRef, useEffect } from "react";
import { Textarea, TextareaProps } from "@mantine/core";

interface AutoResizingTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  variant?: TextareaProps["variant"];
  className?: string;
  minRows?: number;
  maxRows?: number;
}

const AutoResizingTextarea: React.FC<AutoResizingTextareaProps> = ({
  minRows = 1,
  maxRows = Infinity,
  ...props
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const resize = () => {
      textarea.style.height = "auto";
      const rows = Math.min(
        maxRows,
        Math.max(
          minRows,
          Math.floor(
            textarea.scrollHeight /
              parseInt(getComputedStyle(textarea).lineHeight)
          )
        )
      );
      textarea.style.padding = "14px 0";
      textarea.style.height = `${
        rows * parseInt(getComputedStyle(textarea).lineHeight) - 13
      }px`;
    };

    resize();
    textarea.addEventListener("input", resize);
    return () => textarea.removeEventListener("input", resize);
  }, [maxRows, minRows]);

  return <Textarea ref={textareaRef} {...props} />;
};

export default AutoResizingTextarea;
