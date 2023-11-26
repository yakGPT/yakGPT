import { useState } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { tomorrow as theme } from "react-syntax-highlighter/dist/cjs/styles/prism";

import { IconCopy, IconCopyCheck } from "@tabler/icons-react";
import { ActionIcon, createStyles } from "@mantine/core";

const useStyles = createStyles(() => ({
  code: {
    position: "relative",
  },
  icons: {
    position: "absolute",
    right: 5,
    top: 5,
    zIndex: 1,
  },
}));

const Code = ({
  children,
  className,
}: {
  children: string; // For some reason this works but the "correct types" throw errors
  className?: string;
}) => {
  const { classes } = useStyles();
  const [isCopied, setIsCopied] = useState(false);
  const language = className?.replace("lang-", "");

  // If no newlines or language assume it's inline code
  if (!language || !children.includes("\n")) {
    return <code>{children}</code>;
  }

  const setCopied = () => {
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 1000);
  };

  return (
    <div className={classes.code}>
      <div className={classes.icons}>
        <CopyToClipboard text={children}>
          {isCopied ? (
            <ActionIcon variant="transparent" size="sm" color="gray">
              <IconCopyCheck />
            </ActionIcon>
          ) : (
            <ActionIcon
              variant="transparent"
              size="sm"
              onClick={() => setCopied()}
              color="gray"
            >
              <IconCopy />
            </ActionIcon>
          )}
        </CopyToClipboard>
      </div>

      <SyntaxHighlighter language={language} style={theme}>
        {children}
      </SyntaxHighlighter>
    </div>
  );
};

export default Code;
