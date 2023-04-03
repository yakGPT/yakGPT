import Head from "next/head";
import { Inter } from "next/font/google";
import Nav from "@/components/Nav";
import { AppShell, useMantineTheme } from "@mantine/core";
import ChatDisplay from "@/components/ChatDisplay";
import ChatInput from "@/components/ChatInput";
import Hero from "@/components/Hero";
import { useChatStore } from "@/stores/ChatStore";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import withBasicAuth from "@/pages/withBasicAuth";

const inter = Inter({ subsets: ["latin"] });

function Home() {
  const theme = useMantineTheme();

  const apiKey = useChatStore((state) => state.apiKey);
  const [isHydrated, setIsHydrated] = useState(false);

  // Wait till NextJS rehydration completes
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated) {
    return <div>Loading...</div>;
  }

  const AudioRecorder = dynamic(() => import("@/components/AudioRecorder"), {
    ssr: false,
  });

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
          {apiKey && <ChatInput />}
        </div>
      </AppShell>
      <AudioRecorder />
    </>
  );
}

export default withBasicAuth(Home);
