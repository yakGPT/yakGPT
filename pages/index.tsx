import Head from "next/head";
import Nav from "@/components/Nav";
import { AppShell } from "@mantine/core";
import ChatDisplay from "@/components/ChatDisplay";
import Hero from "@/components/Hero";
import { useChatStore } from "@/stores/ChatStore";
import { useEffect, useState } from "react";
import AudioPlayer from "@/components/AudioPlayer";
import UIController from "@/components/UIController";

export default function Home() {
  const apiKey = useChatStore((state) => state.apiKey);
  const playerMode = useChatStore((state) => state.playerMode);

  const [isHydrated, setIsHydrated] = useState(false);

  //Wait till NextJS rehydration completes
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Head>
        <title>YakGPT</title>
        <meta name="description" content="A new ChatGPT UI" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <AppShell
        padding={0}
        navbar={<Nav />}
        layout="alt"
        navbarOffsetBreakpoint="sm"
        asideOffsetBreakpoint="sm"
        styles={(theme) => ({
          main: {
            backgroundColor:
              theme.colorScheme === "dark"
                ? theme.colors.dark[8]
                : theme.colors.gray[0],
          },
        })}
      >
        <div style={{ position: "relative", height: "100%" }}>
          {apiKey ? <ChatDisplay /> : <Hero />}
          {apiKey && <UIController />}
        </div>
      </AppShell>
      {playerMode && <AudioPlayer />}
    </>
  );
}
