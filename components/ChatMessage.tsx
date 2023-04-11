import {
  ActionIcon,
  Avatar,
  createStyles,
  getStylesRef,
  MantineTheme,
  MediaQuery,
  px,
} from "@mantine/core";

import { useChatStore } from "@/stores/ChatStore";
import { IconEdit, IconRepeat, IconSettings, IconX } from "@tabler/icons-react";
import MessageDisplay from "./MessageDisplay";

import UserIcon from "./UserIcon";
import AssistantIcon from "./AssistantIcon";
import { Message } from "@/stores/Message";
import {
  delMessage,
  regenerateAssistantMessage,
  setEditingMessage,
} from "@/stores/ChatActions";

const useStyles = createStyles((theme: MantineTheme) => ({
  messageContainer: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    paddingLeft: 0,
    paddingRight: 0,
    [`@media (min-width: ${theme.breakpoints.md})`]: {
      paddingLeft: theme.spacing.xl,
      paddingRight: theme.spacing.xl,
    },

    [`&:hover .${getStylesRef("button")}`]: {
      opacity: 1,
    },
    borderTop: `1px solid ${
      theme.colorScheme === "dark" ? theme.colors.dark[6] : theme.colors.gray[3]
    }`,
  },
  message: {
    borderRadius: theme.radius.sm,
    paddingLeft: theme.spacing.xs,
    paddingRight: theme.spacing.xs,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
    display: "inline-block",
    maxWidth: "800px",
    wordWrap: "break-word",
    fontSize: theme.fontSizes.sm,
    width: "100%",
  },
  userMessageContainer: {
    backgroundColor:
      theme.colorScheme === "dark"
        ? theme.colors.dark[8]
        : theme.colors.gray[1],
  },
  botMessageContainer: {
    backgroundColor:
      theme.colorScheme === "dark"
        ? theme.colors.dark[7]
        : theme.colors.gray[2],
  },
  userMessage: {
    // All children that are textarea should have color white
    "& textarea": {
      fontSize: "inherit",
      marginInlineStart: "0px",
      marginInlineEnd: "0px",
    },
  },
  botMessage: {},
  actionIcon: {
    ref: getStylesRef("button"),

    opacity: 0,
    transition: "opacity 0.2s ease-in-out",
  },
  textArea: {
    width: "100%",
  },
  messageDisplay: {
    marginLeft: theme.spacing.md,
  },
  actionIconsWrapper: {
    display: "flex",
    flexDirection: "column-reverse",
    alignItems: "flex-end",

    [`@media (min-width: ${theme.breakpoints.sm})`]: {
      marginTop: theme.spacing.sm,
      flexDirection: "row",
      alignItems: "center",
    },
    "> button": {
      marginTop: theme.spacing.xs,
      [`@media (min-width: ${theme.breakpoints.sm})`]: {
        marginTop: 0,
      },
    },
    "> button:not(:first-of-type)": {
      marginTop: 0,
      [`@media (min-width: ${theme.breakpoints.sm})`]: {
        marginTop: 0,
      },
    },
  },
  messageWrapper: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    width: "100%",
  },
  topOfMessage: {
    alignSelf: "start",
    marginTop: theme.spacing.sm,
  },
}));

export default function ChatDisplay({ message }: { message: Message }) {
  const { classes, cx } = useStyles();

  const pushToTalkMode = useChatStore((state) => state.pushToTalkMode);

  const handleMainAction = (message: Message) => {
    if (message.role === "assistant") {
      regenerateAssistantMessage(message);
    } else {
      setEditingMessage(message);
    }
  };

  const handleDeleteMessage = (message: Message) => {
    delMessage(message);
  };

  return (
    <div
      key={message.id}
      className={cx(
        classes.messageContainer,
        message.role === "user"
          ? classes.userMessageContainer
          : classes.botMessageContainer
      )}
    >
      <div
        className={cx(
          classes.message,
          message.role === "user" ? classes.userMessage : classes.botMessage
        )}
      >
        <div className={classes.messageWrapper}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
            }}
          >
            <div className={classes.topOfMessage}>
              <Avatar size="sm">
                {message.role === "system" ? (
                  <IconSettings />
                ) : message.role === "assistant" ? (
                  <AssistantIcon width={px("1.5rem")} height={px("1.5rem")} />
                ) : (
                  <UserIcon width={px("1.5rem")} height={px("1.5rem")} />
                )}
              </Avatar>
            </div>

            <MessageDisplay
              message={message}
              className={classes.messageDisplay}
            />
          </div>
          <div className={classes.actionIconsWrapper}>
            <ActionIcon
              className={cx(classes.actionIcon, classes.topOfMessage)}
              onClick={() => handleMainAction(message)}
              color="gray"
            >
              {message.role === "assistant" ? <IconRepeat /> : <IconEdit />}
            </ActionIcon>
            <ActionIcon
              className={cx(classes.actionIcon, classes.topOfMessage)}
              onClick={() => handleDeleteMessage(message)}
              color="gray"
            >
              <IconX />
            </ActionIcon>
          </div>
        </div>
      </div>
    </div>
  );
}
