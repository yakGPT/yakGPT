import { useChatStore } from "@/stores/ChatStore";
import { ActionIcon, createStyles, MantineTheme, px } from "@mantine/core";
import { useEffect, useState } from "react";
import MuHeader from "./MuHeader";
import NewChat from "./NewChat";

import { setActiveChatId } from "@/stores/ChatActions";
import { IconChevronsDown } from "@tabler/icons-react";
import { useRouter } from "next/router";
import ChatMessage from "./ChatMessage";

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
    // overflowY: "scroll",
    flexGrow: 1,
    display: "flex",
    flexDirection: "column",
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
