import MuHeader from "@/components/MuHeader";
import { Chat } from "@/stores/Chat";
import { useChatStore } from "@/stores/ChatStore";
import { Container, Text, Title } from "@mantine/core";
import fileDownload from "js-file-download";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";

/**
 * This code runs exclusively on the client, as the chats are stored in localStorage.
 * Web APIs can be used for export.
 */
export default function ChatsJSONExport() {
  const router = useRouter();

  const chats = useChatStore((state) => state.chats);
  const [error, setError] = useState<string>();
  const [objectURL, setObjectURL] = useState<string>();
  const hasDownloaded = useRef(false);

  useEffect(() => {
    (async () => {
      if (chats) {
        try {
          const url = createDownload(chats, !hasDownloaded.current);
          hasDownloaded.current = true;
          setObjectURL(url);
        } catch {
          hasDownloaded.current = false;
          setError("Unkown error.");
        }
      } else if (error) {
        hasDownloaded.current = false;
      }
      return () => {
        if (objectURL) {
          window.URL.revokeObjectURL(objectURL);
          setObjectURL(undefined);
        }
      };
    })();
  }, [chats, error, objectURL]);

  return (
    <Container py="xl">
      <MuHeader />
      {error ? (
        <Title>{error ?? "Unknown error"}</Title>
      ) : (
        <>
          <Text>Downloading JSON export of all conversations...</Text>
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

const createDownload = (chats: Chat[], triggerDownload = false): string => {
  const blob = new Blob([JSON.stringify(chats)], { type: "application/json" });
  const downloadURI = URL.createObjectURL(blob);
  if (triggerDownload) {
    fileDownload(blob, `yakgpt-chats-${new Date().toISOString()}.json`);
  }
  return downloadURI;
};
