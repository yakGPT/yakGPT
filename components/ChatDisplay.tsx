import { useEffect, useState } from "react";
import {
  ActionIcon,
  createStyles,
  getStylesRef,
  MantineTheme,
  px,
} from "@mantine/core";
import { useChatStore } from "@/stores/ChatStore";
import NewChat from "./NewChat";
import MuHeader from "./MuHeader";

import ChatMessage from "./ChatMessage";
import { IconChevronsDown } from "@tabler/icons-react";
import { useRouter } from "next/router";
import { setActiveChatId } from "@/stores/ChatActions";

const useStyles = createStyles((theme: MantineTheme) => ({
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",

    [`@media (min-width: ${theme.breakpoints.sm})`]: {
      paddingBottom: "5em",
    },
  },
  chatContainer: {
    overflowY: "scroll",
    flexGrow: 1,
    display: "flex",
    flexDirection: "column",
  },
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
  messageWrapper: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  topOfMessage: {
    alignSelf: "start",
    marginTop: theme.spacing.sm,
  },
}));

const ChatDisplay = () => {
  const router = useRouter();
  const activeChatId = router.query.chatId as string | undefined;

  useEffect(() => {
    setActiveChatId(activeChatId as string | undefined);
  }, [activeChatId]);

  const { classes, theme } = useStyles();

  const chats = useChatStore((state) => state.chats);

  const activeChat = chats.find((chat) => chat.id === activeChatId);

  const pushToTalkMode = useChatStore((state) => state.pushToTalkMode);
  const lastMessage = activeChat?.messages[activeChat.messages.length - 1];

  const scrolledToBottom = () => {
    const winScroll =
      document.body.scrollTop || document.documentElement.scrollTop;

    const height =
      document.documentElement.scrollHeight -
      document.documentElement.clientHeight;

    // allow inaccuracy by adding some
    return height <= winScroll + 1;
  };

  const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolledToBottom(scrolledToBottom());
    };
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    if (isScrolledToBottom) {
      scrollToBottom();
    }
  }, [isScrolledToBottom, activeChat, lastMessage?.content]);

  const scrollToBottom = () => {
    window.scrollTo(0, document.body.scrollHeight);
  };

  return (
    <div
      className={classes.container}
      style={{ paddingBottom: pushToTalkMode ? "7em" : "5em" }}
    >
      <div className={classes.chatContainer}>
        <MuHeader />

        {!activeChatId && <NewChat />}
        {activeChat?.messages.map((message, idx) => (
          <ChatMessage key={message.id} message={message} />
        ))}
      </div>
      {!isScrolledToBottom && (
        <ActionIcon
          size={32}
          radius="xl"
          variant="light"
          onClick={scrollToBottom}
          sx={{
            position: "fixed",
            right: theme.spacing.md,
            bottom: 100,
          }}
        >
          <IconChevronsDown size={px("1.1rem")} stroke={1.5} />
        </ActionIcon>
      )}
    </div>
  );
};

export default ChatDisplay;
