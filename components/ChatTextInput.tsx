import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { useChatStore } from "@/stores/ChatStore";
import {
  ActionIcon,
  useMantineTheme,
  Textarea,
  Group,
  px,
} from "@mantine/core";
import { IconArrowRight, IconPlayerStop, IconX } from "@tabler/icons-react";

export default function ChatInput({ className }: { className?: string }) {
  const theme = useMantineTheme();
  const [value, setValue] = useState("");

  const submitMessage = useChatStore((state) => state.submitMessage);

  const apiState = useChatStore((state) => state.apiState);
  const abortRequest = useChatStore((state) => state.abortCurrentRequest);

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
    if (
      !event.nativeEvent.isComposing &&
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      doSubmit();
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(event.target.value);
  };

  const Icon = apiState === "loading" ? IconPlayerStop : IconArrowRight;

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

  return (
    <Textarea
      className={className}
      autosize
      maxRows={5}
      minRows={2}
      sx={{
        position: "relative",
      }}
      radius="sm"
      size="md"
      onKeyDown={handleKeyDown}
      onKeyUp={(e) => e.stopPropagation()}
      onChange={handleChange}
      value={value}
      rightSection={
        <Group>
          {editingMessage && (
            <ActionIcon
              size={32}
              color={"red"}
              variant="filled"
              onClick={() => cancelEdit()}
              sx={{
                position: "absolute",
                bottom: "2px",
                right: "36px",
              }}
            >
              <IconX size={px("1.1rem")} stroke={1.5} />
            </ActionIcon>
          )}
          <ActionIcon
            size={32}
            color={apiState === "loading" ? "red" : theme.primaryColor}
            onClick={() => doSubmit()}
            sx={{ position: "absolute", bottom: "2px", right: "2px" }}
          >
            <Icon size={px("1.1rem")} stroke={1.5} />
          </ActionIcon>
        </Group>
      }
      placeholder=""
      rightSectionWidth={42}
    />
  );
}
