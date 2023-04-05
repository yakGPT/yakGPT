import { Chat } from "@/stores/Chat";
import { useChatStore } from "@/stores/ChatStore";
import { Message } from "@/stores/Message";
import { Container, Text, Title } from "@mantine/core";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";

/**
 * This code runs exclusively on the client, as the chats are stored in localStorage.
 * Web APIs can be used for export.
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

  useEffect(() => {
    const chat = chats.find(({ id }) => id === chatId);
    setChat(chat);
    (async () => {
      if (chat && !hasDownloaded.current) {
        try {
          const url = await downloadFile(chat, window);
          hasDownloaded.current = true;
          setObjectURL(url);
        } catch {
          hasDownloaded.current = false;
        }
      } else if (error) {
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
        }
      };
    })();
  }, [chats, chatId, error, objectURL]);

  const objectURLRef = useRef<string>();

  return (
    <Container py="xl">
      {error ? (
        <Title>{error ?? "Unknown error"}</Title>
      ) : (
        <>
          <Text>Downloading chat {chatName(chat)}...</Text>
          {objectURL && (
            <Text>
              If your download does not start, try{" "}
              <a href={objectURL}>clicking here</a>
            </Text>
          )}
        </>
      )}
    </Container>
  );
}

const formatMessage = (msg: Message): string => {
  return msg.role === "user"
    ? `## User:
${msg.content}

`
    : `## Chatbot (${msg.role}):
${msg.content}

`;
};

const chatName = (chat?: Chat) => (chat ? `${chat.title ?? chat.id}` : "");

const downloadFile = async (chat: Chat, window: Window): Promise<string> => {
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
  const downloadURI = URL.createObjectURL(blob);
  const a = document.createElement("a");
  window.document.body.appendChild(a);
  a.href = downloadURI;
  a.style.display = "none";
  a.download = chatName(chat);
  //This downloads the file.
  a.click();
  // Doing nothing with the result, just want to make sure that we pause long enough before removing the element.
  // This might be unneeded in most scenarios.
  await fetch(downloadURI);
  //Don't revoke the URL, instead provide a fallback link.
  //URL.revokeObjectURL(downloadURI);
  a.remove();
  return downloadURI;
};
