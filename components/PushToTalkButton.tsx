import { useChatStore } from "@/stores/ChatStore";
import { ActionIcon, Button, Loader, px, rem } from "@mantine/core";
import { createStyles, MantineTheme } from "@mantine/styles";
import { IconMicrophone, IconMicrophoneOff, IconX } from "@tabler/icons-react";

const useStyles = createStyles((theme: MantineTheme) => ({
  container: {
    flexShrink: 0,
    // Always stick to the bottom of the chat
    position: "fixed",
    bottom: 0,
    left: 0,
    [`@media (min-width: ${theme.breakpoints.sm})`]: {
      left: 200,
    },
    [`@media (min-width: ${theme.breakpoints.md})`]: {
      left: 250,
    },

    right: 0,
    zIndex: 1,
    maxWidth: 820,
    margin: "0 auto",
    paddingBottom: 11,
    paddingLeft: 64,
    paddingRight: 64,
  },
  buttonsContainer: {
    position: "relative",
  },
  button: {
    border: "1px solid transparent",
    borderRadius: theme.radius.sm,
    boxShadow: "rgba(255, 255, 255, .4) 0 1px 0 0 inset",
    boxSizing: "border-box",
    backgroundColor:
      theme.colorScheme === "dark"
        ? theme.colors.dark[6]
        : theme.colors.dark[5],
    cursor: "pointer",
    display: "inline-block",
    fontFamily: `-apple-system,system-ui,"Segoe UI","Liberation Sans",sans-serif`,
    fontWeight: 400,
    lineHeight: "1.15385",
    margin: 0,
    height: "4em",
    outline: "none",
    position: "relative",
    textAlign: "center",
    textDecoration: "none",
    userSelect: "none",
    WebkitUserSelect: "none",
    touchAction: "manipulation",
    verticalAlign: "baseline",
    whiteSpace: "nowrap",
    transition: "background-color 0.3s, box-shadow 0.3s", // Add transition for background-color and box-shadow

    fontSize: "1.5em",
    width: "100%",
  },
  focus: {
    boxShadow: "0 0 0 4px rgba(0, 149, 255, .15)",
  },
  recording: {
    backgroundColor:
      theme.colorScheme === "dark"
        ? theme.colors.bluu[6]
        : theme.colors.bluu[5],
    boxShadow: "none",
  },
}));

const PushToTalkButton = ({
  audioState,
  startRecording,
  stopRecording,
  destroyRecorder,
}: {
  audioState: string;
  startRecording: () => void;
  stopRecording: (submit?: boolean) => void;
  destroyRecorder: () => void;
}) => {
  const { classes, cx, theme } = useStyles();

  const setPushToTalkMode = useChatStore((state) => state.setPushToTalkMode);

  return (
    <div className={classes.container}>
      <div className={classes.buttonsContainer}>
        <ActionIcon
          size={32}
          radius="xl"
          variant="filled"
          onClick={() => {
            stopRecording(false);
            destroyRecorder();
            setPushToTalkMode(false);
          }}
          sx={{
            position: "absolute",
            bottom: rem(13),
            left: rem(-43),
          }}
        >
          <IconMicrophoneOff size={px("1.1rem")} stroke={1.5} />
        </ActionIcon>
        {audioState !== "idle" && (
          <ActionIcon
            size={32}
            radius="xl"
            color="red"
            variant="filled"
            onClick={() => {
              stopRecording(false);
            }}
            sx={{
              position: "absolute",
              bottom: rem(13),
              right: rem(-43),
            }}
          >
            <IconX size={px("1.1rem")} stroke={1.5} />
          </ActionIcon>
        )}
        <Button
          onClick={() => {
            if (audioState === "idle") {
              startRecording();
            } else if (audioState === "transcribing") {
              return;
            } else {
              stopRecording();
            }
          }}
          className={cx(
            classes.button,
            audioState === "recording" && classes.recording
          )}
        >
          {audioState === "recording" ? (
            <Loader
              size="3em"
              variant="bars"
              color="white"
              sx={{ opacity: 1 }}
            />
          ) : audioState === "transcribing" ? (
            <Loader size="2em" color="white" sx={{ opacity: 1 }} />
          ) : (
            <IconMicrophone size="3em" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default PushToTalkButton;
