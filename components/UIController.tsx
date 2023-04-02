import { useChatStore } from "@/stores/ChatStore";
import { Button, Loader, px, createStyles, MantineTheme } from "@mantine/core";
import {
  IconMicrophone,
  IconMicrophoneOff,
  IconX,
  IconPlayerPlay,
  IconHeadphones,
  IconHeadphonesOff,
  IconPlayerPause,
} from "@tabler/icons-react";
import ChatTextInput from "./ChatTextInput";
import { usePlayerStore } from "@/stores/PlayerStore";

const styles = createStyles((theme: MantineTheme) => ({
  container: {
    display: "flex",
    justifyContent: "space-between",
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    maxWidth: 820,
    margin: "0 auto",
    paddingBottom: 11,
    paddingLeft: 64,
    paddingRight: 64,
  },
  playerControls: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    minHeight: "72px",
  },
  textAreaContainer: {
    display: "flex",
    flexGrow: 1,
    alignItems: "flex-end",
  },
  textArea: {
    flexGrow: 1,
  },
  recorderButton: {
    width: "72px",
  },
  recorderControls: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    minHeight: "72px",
  },
}));

const PlayerControls = () => {
  const { classes } = styles();

  const setPlayerMode = useChatStore((state) => state.setPlayerMode);
  const playerMode = useChatStore((state) => state.playerMode);

  const PlayerToggleIcon = playerMode ? IconHeadphonesOff : IconHeadphones;

  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const setIsPlaying = usePlayerStore((state) => state.setIsPlaying);

  const PlayPauseIcon = isPlaying ? IconPlayerPause : IconPlayerPlay;

  return (
    <div className={classes.playerControls}>
      {playerMode && (
        <Button
          sx={{ height: 36 }}
          compact
          onClick={() => setIsPlaying(!isPlaying)}
        >
          <PlayPauseIcon size={20} />
        </Button>
      )}
      <Button
        sx={{ height: 36 }}
        compact
        variant={playerMode ? "filled" : "outline"}
        onClick={() => {
          setPlayerMode(!playerMode);
        }}
      >
        <PlayerToggleIcon size={px("1.1rem")} stroke={1.5} />
      </Button>
    </div>
  );
};

const ChatInput = () => {
  const { classes } = styles();

  const pushToTalkMode = useChatStore((state) => state.pushToTalkMode);
  const audioState = useChatStore((state) => state.audioState);

  const startRecording = useChatStore((state) => state.startRecording);
  const stopRecording = useChatStore((state) => state.stopRecording);
  console.log("rendered with audioState", audioState);
  return (
    <div className={classes.textAreaContainer}>
      <ChatTextInput className={classes.textArea} />
      {pushToTalkMode && (
        <Button
          sx={{ height: 72 }}
          compact
          className={classes.recorderButton}
          onClick={() => {
            if (audioState === "idle") {
              startRecording();
            } else if (audioState === "transcribing") {
              return;
            } else {
              stopRecording(true);
            }
          }}
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
      )}
    </div>
  );
};

const RecorderControls = () => {
  const { classes } = styles();

  const setPushToTalkMode = useChatStore((state) => state.setPushToTalkMode);
  const pushToTalkMode = useChatStore((state) => state.pushToTalkMode);

  const audioState = useChatStore((state) => state.audioState);
  const stopRecording = useChatStore((state) => state.stopRecording);

  const PushToTalkToggleIcon = pushToTalkMode
    ? IconMicrophoneOff
    : IconMicrophone;

  return (
    <div className={classes.recorderControls}>
      {audioState === "recording" && (
        <Button
          sx={{ height: 36 }}
          compact
          color="red"
          variant="filled"
          onClick={() => {
            stopRecording(false);
          }}
        >
          <IconX size={px("1.1rem")} stroke={1.5} />
        </Button>
      )}

      <Button
        sx={{ height: 36 }}
        compact
        variant={pushToTalkMode ? "filled" : "outline"}
        onClick={() => setPushToTalkMode(!pushToTalkMode)}
      >
        <PushToTalkToggleIcon size={20} />
      </Button>
    </div>
  );
};

export default function UIController() {
  const { classes } = styles();

  return (
    <div className={classes.container}>
      <PlayerControls />

      <ChatInput />

      <RecorderControls />
    </div>
  );
}
