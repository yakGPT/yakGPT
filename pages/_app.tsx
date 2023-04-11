import { AppProps } from "next/app";
import Head from "next/head";
import {
  AppShell,
  ColorScheme,
  ColorSchemeProvider,
  MantineProvider,
} from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import "highlight.js/styles/stackoverflow-dark.css";
import { appWithTranslation } from "next-i18next";

import { useChatStore } from "@/stores/ChatStore";

import Nav from "@/components/Nav";
import { useEffect, useState } from "react";
import UIController from "@/components/UIController";
import { setColorScheme } from "@/stores/ChatActions";
import AudioPlayer from "@/components/AudioPlayer";

const App = (props: AppProps) => {
  const { Component, pageProps } = props;

  const colorScheme = useChatStore((state) => state.colorScheme);

  const toggleColorScheme = (value?: ColorScheme) => {
    const nextColorScheme =
      value || (colorScheme === "dark" ? "light" : "dark");
    setColorScheme(nextColorScheme);
  };

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
      <ColorSchemeProvider
        colorScheme={colorScheme}
        toggleColorScheme={toggleColorScheme}
      >
        <MantineProvider
          withGlobalStyles
          withNormalizeCSS
          theme={{
            // global style
            globalStyles: (theme) => ({
              " ::-webkit-scrollbar": {
                width: "8px",
                height: "0px",
              },
              "::-webkit-scrollbar-track": {
                backgroundColor:
                  theme.colorScheme === "light"
                    ? "#f1f1f1"
                    : theme.colors.dark[8],
              },
              "::-webkit-scrollbar-thumb": {
                backgroundColor: "#888",
                borderRadius: "6px",
              },
              "::-webkit-scrollbar-thumb:hover": {
                backgroundColor: "#555",
              },
            }),
            /** Put your mantine theme override here */
            colorScheme,
            primaryColor: "bluu",
            colors: {
              // https://smart-swatch.netlify.app/#5E6AD2
              bluu: [
                "#e8edff",
                "#c2c8f3",
                "#9aa3e5",
                "#727ed9",
                "#4c59cd",
                "#3240b3",
                "#26318d",
                "#1a2366",
                "#0e1540",
                "#04061b",
              ],
              // https://smart-swatch.netlify.app/#2A2D3D
              dark: [
                "#eef1fd",
                "#d1d4e3",
                "#b3b7cb",
                "#959ab5",
                "#787e9f",
                "#5f6486",
                "#494e69",
                "#34384c",
                "#1e212f",
                "#070b16",
              ],
            },
          }}
        >
          <Notifications />
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
              <Component {...pageProps} />

              {apiKey && <UIController />}
            </div>
            {playerMode && <AudioPlayer />}
          </AppShell>
        </MantineProvider>
      </ColorSchemeProvider>
    </>
  );
};

export default appWithTranslation(App);
