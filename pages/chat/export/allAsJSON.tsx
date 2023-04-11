import { Chat } from "@/stores/Chat";
import { useChatStore } from "@/stores/ChatStore";
import { Container, Text, Title } from "@mantine/core";
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
          const url = createObjectURL(chats, window, !hasDownloaded.current);
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
        }
      };
    })();
  }, [chats, error, objectURL]);

  return (
    <Container py="xl">
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

const createObjectURL = (
  chats: Chat[],
  window: Window,
  triggerDownload = false
): string => {
  const blob = new Blob([JSON.stringify(chats)], { type: "application/json" });
  const downloadURI = URL.createObjectURL(blob);
  if (triggerDownload) {
    const a = document.createElement("a");
    window.document.body.appendChild(a);
    a.href = downloadURI;
    a.style.display = "none";
    a.download = `YakGPT-Export-${new Date().toISOString()}.json`;
    //This downloads the file.
    a.click();
    a.remove();
  }
  return downloadURI;
};
