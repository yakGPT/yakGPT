import { useChatStore } from "@/stores/ChatStore";
import { Button, Loader, px, createStyles, MantineTheme } from "@mantine/core";
import {
  IconMicrophone,
  IconMicrophoneOff,
  IconX,
  IconPlayerPlay,
  IconPlayerPause,
  IconVolumeOff,
  IconVolume,
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
    paddingBottom: 16,
    paddingLeft: 8,
    paddingRight: 8,
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

  const PlayerToggleIcon = playerMode ? IconVolumeOff : IconVolume;

  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const setIsPlaying = usePlayerStore((state) => state.setIsPlaying);

  const PlayPauseIcon = isPlaying ? IconPlayerPause : IconPlayerPlay;

  return (
    <div className={classes.playerControls}>
      <Button
        sx={{ height: 36, borderRadius: "8px 0px 0px 0px" }}
        compact
        variant={playerMode ? "filled" : "light"}
        onClick={() => setIsPlaying(!isPlaying)}
      >
        {playerMode && <PlayPauseIcon size={20} />}
      </Button>

      <Button
        sx={{ height: 36, borderRadius: "0px 0px 0px 8px" }}
        compact
        variant={playerMode ? "filled" : "light"}
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
  const showTextDuringPTT = useChatStore((state) => state.showTextDuringPTT);
  const showTextInput = !pushToTalkMode || showTextDuringPTT;
  console.log("rendered with audioState", audioState);
  return (
    <div className={classes.textAreaContainer}>
      {showTextInput && <ChatTextInput className={classes.textArea} />}
      {pushToTalkMode && (
        <Button
          sx={{
            height: 72,
            borderRadius: "0px 0px 0px 0px",
            width: showTextInput ? "72px" : "100%",
          }}
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

  const showCancelButton = audioState === "recording";

  return (
    <div className={classes.recorderControls}>
      {showCancelButton ? (
        <Button
          sx={{ height: 36, borderRadius: "0px 8px 0px 0px" }}
          compact
          color="red"
          variant="filled"
          onClick={() => {
            stopRecording(false);
          }}
        >
          <IconX size={px("1.1rem")} stroke={1.5} />
        </Button>
      ) : (
        <Button
          sx={{ height: 36, borderRadius: "0px 8px 0px 0px" }}
          compact
          variant="light"
        ></Button>
      )}

      <Button
        sx={{ height: 36, borderRadius: "0px 0px 8px 0px" }}
        compact
        variant={pushToTalkMode ? "filled" : "light"}
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
