import MuHeader from "@/components/MuHeader";
import { Chat } from "@/stores/Chat";
import { useChatStore } from "@/stores/ChatStore";
import { Message } from "@/stores/Message";
import { Container, Text, Title } from "@mantine/core";
import { usePrevious } from "@mantine/hooks";
import fileDownload from "js-file-download";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";

/**
 * Export single chat as markdown file. Auto-downloads the file on visit but
 * serves a regular page. Blob as initial response is not possible as localStorage is client-side.
 *
 * Providing a route instead of just a function that triggers the file download here.
 */
export default function ChatDownloadAsMarkdown() {
  const router = useRouter();
  const {
    query: { chatId },
  } = router;

  const chats = useChatStore((state) => state.chats);
  const [chat, setChat] = useState<Chat>();
  const [error, setError] = useState<string>();
  const [objectURL, setObjectURL] = useState<string>();
  const hasDownloaded = useRef(false);
  const previousChat = usePrevious(chat);
  useEffect(() => {
    const chat = chats.find(({ id }) => id === chatId);
    setChat(chat);
    (async () => {
      if (chat && linkRef.current && chat !== previousChat) {
        try {
          const url = createDownload(chat, !hasDownloaded.current);
          hasDownloaded.current = true;
          setObjectURL(url);
        } catch {
          hasDownloaded.current = false;
          setError("Unknown error.");
        }
      } else if (error) {
        setObjectURL(undefined);
        hasDownloaded.current = false;
        if (chatId?.length) {
          setError("This chat ID does not exist.");
        } else {
          setError("No chat ID given.");
        }
      }
      return () => {
        if (objectURL) {
          window.URL.revokeObjectURL(objectURL);
          setObjectURL(undefined);
        }
      };
    })();
  }, [chats, chatId, previousChat, error, objectURL]);

  const linkRef = useRef<HTMLAnchorElement>(null);

  return (
    <Container py="xl">
      <MuHeader />
      {error ? (
        <Title>{error ?? "Unknown error"}</Title>
      ) : (
        <>
          <Text>Downloading chat &quot;{chatName(chat)}&quot;...</Text>
          <Text>
            If your download does not start, try{" "}
            <a href={objectURL} ref={linkRef} download={chatName(chat)}>
              clicking here
            </a>
          </Text>
        </>
      )}
    </Container>
  );
}

const formatMessage = (msg: Message): string => {
  return msg.role === "user"
    ? `## User:
${msg.content}

---

`
    : `## Chatbot (${msg.role}):
${msg.content}

---

`;
};

const chatName = (chat?: Chat) => (chat ? `${chat.title ?? chat.id}` : "");

const createDownload = (chat: Chat, triggerDownload = false): string => {
  const result = [];
  for (const message of chat.messages) {
    try {
      result.push(formatMessage(message));
    } catch {
      console.error(
        "Could not process message: ",
        JSON.stringify(message.content)
      );
    }
  }

  const blob = new Blob(result, { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  if (triggerDownload) {
    fileDownload(blob, `${chatName(chat)}.md`);
  }
  return url;
};
