import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { useChatStore } from "@/stores/ChatStore";
import {
  ActionIcon,
  useMantineTheme,
  Textarea,
  rem,
  Group,
  px,
} from "@mantine/core";
import { IconArrowRight, IconMicrophone, IconX } from "@tabler/icons-react";

export default function ChatInput() {
  const theme = useMantineTheme();
  const [value, setValue] = useState("");

  const submitMessage = useChatStore((state) => state.submitMessage);

  const apiState = useChatStore((state) => state.apiState);
  const abortRequest = useChatStore((state) => state.abortCurrentRequest);

  const setPushToTalkMode = useChatStore((state) => state.setPushToTalkMode);
  const pushToTalkMode = useChatStore((state) => state.pushToTalkMode);

  const editingMessage = useChatStore((state) => state.editingMessage);
  const setEditingMessage = useChatStore((state) => state.setEditingMessage);

  const doSubmit = () => {
    if (apiState === "loading") {
      abortRequest();
      return;
    }
    if (editingMessage) {
      setEditingMessage(undefined);
    }
    submitMessage({
      id: editingMessage?.id || uuidv4(),
      content: value,
      role: editingMessage?.role || "user",
    });
    setValue("");
  };

  const cancelEdit = () => {
    setEditingMessage(undefined);
    setValue("");
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    event.stopPropagation();
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      doSubmit();
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(event.target.value);
  };

  const icon =
    apiState === "loading" ? (
      <IconX size={px("1.1rem")} stroke={1.5} />
    ) : (
      <IconArrowRight size={px("1.1rem")} stroke={1.5} />
    );

  // Whenever editingMessage changes, update the value
  useEffect(() => {
    if (editingMessage) {
      setValue(editingMessage.content);
      // Focus on the input
      setTimeout(() => {
        const input = document.querySelector("textarea");
        if (input) {
          input.focus();
        }
      }, 0);
    }
  }, [editingMessage]);

  if (pushToTalkMode) return null;

  return (
    <Textarea
      autosize
      maxRows={5}
      sx={{
        position: "relative",
      }}
      radius="sm"
      size="md"
      onKeyDown={handleKeyDown}
      onKeyUp={(e) => e.stopPropagation()}
      onChange={handleChange}
      value={value}
      icon={
        <ActionIcon
          size={32}
          radius="xl"
          color={theme.primaryColor}
          variant="filled"
          onClick={() => setPushToTalkMode(true)}
          sx={{ pointerEvents: "all" }}
        >
          <IconMicrophone size={px("1.1rem")} stroke={1.5} />
        </ActionIcon>
      }
      rightSection={
        <Group>
          {editingMessage && (
            <ActionIcon
              size={32}
              radius="xl"
              color={"red"}
              variant="filled"
              onClick={() => cancelEdit()}
              sx={{
                position: "absolute",
                bottom: rem(7.5),
                right: rem(7.5 + 5 + 32),
              }}
            >
              <IconX size={px("1.1rem")} stroke={1.5} />
            </ActionIcon>
          )}
          <ActionIcon
            size={32}
            radius="xl"
            color={apiState === "loading" ? "red" : theme.primaryColor}
            variant="filled"
            onClick={() => doSubmit()}
            sx={{ position: "absolute", bottom: rem(7.5), right: rem(7.5) }}
          >
            {icon}
          </ActionIcon>
        </Group>
      }
      placeholder=""
      rightSectionWidth={42}
    />
  );
}
