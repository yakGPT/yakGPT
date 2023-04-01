import { useState } from "react";
import { TextInput, Button, Group, Box, Loader } from "@mantine/core";
import { notifications } from "@mantine/notifications";

import { useForm } from "@mantine/form";
import { testKey } from "@/stores/OpenAI";
import { useChatStore } from "@/stores/ChatStore";
import { IconCheck, IconX } from "@tabler/icons-react";

export default function KeyModal({ close }: { close: () => void }) {
  const apiKey = useChatStore((state) => state.apiKey);
  const setApiKey = useChatStore((state) => state.setApiKey);
  const [checkStatus, setCheckStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  const form = useForm({
    initialValues: {
      key: apiKey ? apiKey.slice(0, 3) + "..." + apiKey.slice(-4) : "",
    },

    validate: {
      key: (value) =>
        /^sk-[a-zA-Z0-9]{48}$/.test(value) ? null : "Invalid Key format",
    },
  });

  const iconMap = {
    idle: null,
    loading: <Loader size="xs" />,
    success: <IconCheck color="green" size="xs" />,
    error: <IconX color="red" size="xs" />,
  };
  const icon = iconMap[checkStatus];

  return (
    <div>
      <h2>🔑 Enter Your OpenAI API Key:</h2>
      <p>
        You need an OpenAI API Key. Your API Key is stored locally on your
        browser and never sent anywhere else.
      </p>

      <Box mx="auto">
        <form
          onSubmit={form.onSubmit(async ({ key }) => {
            setCheckStatus("loading");
            const keyValid = await testKey(key);

            if (keyValid) {
              notifications.show({ message: "Key saved!", color: "green" });

              setApiKey(key);
              close();
            } else if (keyValid === false) {
              form.setErrors({ key: "Key authentication failed" });
            } else {
              notifications.show({
                message: "Something went wrong",
                color: "red",
              });
            }
            setCheckStatus("idle");
          })}
        >
          <TextInput
            withAsterisk
            label="API Key"
            placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            rightSection={icon}
            {...form.getInputProps("key")}
          />

          <Group position="right" mt="md">
            <Button type="submit" disabled={!form.isDirty("key")}>
              Save
            </Button>
            <Button onClick={close} variant="light">
              Cancel
            </Button>
          </Group>
        </form>
      </Box>
      <p>
        → Get your API key from{" "}
        <a
          href="https://platform.openai.com/account/api-keys"
          target="_blank"
          rel="noreferrer"
        >
          Open AI dashboard
        </a>
        .
      </p>
    </div>
  );
}
