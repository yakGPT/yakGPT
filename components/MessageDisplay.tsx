/* eslint-disable react/display-name */
/* eslint-disable import/no-anonymous-default-export */
import type { Message } from "@/stores/Message";
import MarkdownIt from "markdown-it";
import mdHighlight from "markdown-it-highlightjs";
// @ts-ignore
import mdCodeCopy from "./markdownCopy";

import { createStyles, keyframes, MantineTheme } from "@mantine/core";

interface Props {
  message: Message;
  showRetry?: boolean;
  onRetry?: () => void;
  className?: string;
}

const blink = keyframes`
  0%, 49% {
    opacity: 1;
  }
  50%, 100% {
    opacity: 0;
  }
`;

const useStyles = createStyles((theme: MantineTheme) => ({
  container: {
    maxWidth: "calc(100vw - 55px)",
    [`@media (min-width: ${theme.breakpoints.md})`]: {
      maxWidth: "calc(820px - 120px)",
    },
  },
  // This is implemented in the most horrible way and needs a FF bad
  copyText: {
    "&::before": {
      content: '"copy"',
      fontSize: 14,
      opacity: 0.6,
    },
    "&:active": {
      "&::before": {
        content: '"copied!"',
        fontSize: 14,
        opacity: 0.6,
      },
    },
  },
  message: {
    "& pre": {
      overflowX: "scroll",
    },
    "& table": {
      width: "100%",
      minWidth: "50%",
      marginBottom: theme.spacing.md,
      backgroundColor:
        theme.colorScheme === "dark"
          ? theme.colors.dark[6]
          : theme.colors.gray[0],
      color:
        theme.colorScheme === "dark"
          ? theme.colors.gray[0]
          : theme.colors.dark[1],
      boxShadow: theme.shadows.sm,
      borderCollapse: "collapse",
    },
    "& th, & td": {
      padding: theme.spacing.xs,
      border: `1px solid ${
        theme.colorScheme === "dark"
          ? theme.colors.dark[8]
          : theme.colors.gray[3]
      }`,
      textAlign: "left",
      fontWeight: theme.colorScheme === "dark" ? 300 : 400,
      color:
        theme.colorScheme === "dark"
          ? theme.colors.gray[0]
          : theme.colors.dark[8],
    },
    "& th": {
      fontWeight: 500,
      backgroundColor:
        theme.colorScheme === "dark"
          ? theme.colors.dark[8]
          : theme.colors.gray[1],
    },
    "& tr:nth-of-type(even) td": {
      backgroundColor:
        theme.colorScheme === "dark"
          ? theme.colors.dark[7]
          : theme.colors.gray[0],
    },
    "& tr:nth-of-type(odd) td": {
      backgroundColor:
        theme.colorScheme === "dark"
          ? theme.colors.dark[6]
          : theme.colors.gray[1],
    },
  },
  loading: {
    [`p:last-child::after`]: {
      content: '"▎"',
      display: "inline-block",
      color:
        theme.colorScheme === "dark"
          ? theme.colors.dark[3]
          : theme.colors.gray[5],
      animation: `${blink} 1s infinite`,
    },
  },
}));
export default ({ message, className }: Props) => {
  const { classes, cx } = useStyles();

  const htmlString = () => {
    let md = MarkdownIt({
      linkify: true,
      breaks: true,
    }).use(mdCodeCopy, {
      iconStyle: "", // Clear default icon style
      iconClass: classes.copyText, // Set a custom class for the icon element
      buttonStyle:
        "position: absolute; top: 7.5px; right: 6px; cursor: pointer; outline: none; border: none; background: none; color: #ffffff; background-color: #333;",
      buttonClass: "",
    });

    if (message.role === "assistant") {
      md = md.use(mdHighlight);
    }

    return md.render(message.content);
  };

  return (
    <div className={cx(className, classes.container)}>
      <div
        className={cx(classes.message, message.loading && classes.loading)}
        dangerouslySetInnerHTML={{ __html: htmlString() }}
      ></div>
    </div>
  );
};
