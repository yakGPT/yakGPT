import { useState } from "react";
import {
  Button,
  Group,
  Box,
  Loader,
  Tabs,
  px,
  PasswordInput,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";

import { testKey as testKeyOpenAI } from "@/stores/OpenAI";
import { testKey as testKey11Labs } from "@/stores/ElevenLabs";
import { useChatStore } from "@/stores/ChatStore";
import { IconCheck, IconRobot, IconVolume, IconX } from "@tabler/icons-react";

export function APIPanel({
  name,
  initialKey,
  setKeyFun,
  descriptionAboveInput,
  descriptionBelowInput,
  validateKey,
  closeModal,
}: {
  name: string;
  initialKey: string | undefined;
  setKeyFun: (key: string) => void;
  descriptionAboveInput: string;
  descriptionBelowInput: React.ReactNode;
  validateKey: (key: string) => Promise<boolean>;
  closeModal: () => void;
}) {
  const [checkStatus, setCheckStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [apiKey, setApiKey] = useState(initialKey);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCheckStatus("idle");
    setApiKey(event.target.value);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (apiKey) {
      setCheckStatus("loading");

      const keyValid = await validateKey(apiKey);

      if (keyValid) {
        notifications.show({
          message: "Key saved!",
          color: "green",
        });
        setKeyFun(apiKey);
        setCheckStatus("success");
      } else {
        notifications.show({
          message: "Something went wrong",
          color: "red",
        });
        setCheckStatus("error");
      }
    }
  };

  const iconMap = {
    idle: null,
    loading: <Loader size={px("1rem")} />,
    success: <IconCheck color="green" size={px("1rem")} />,
    error: <IconX color="red" size={px("1rem")} />,
  };
  const icon = iconMap[checkStatus];
  console.log(apiKey);
  return (
    <div>
      <form onSubmit={handleSubmit}>
        <h2>🔑 {name}:</h2>
        <p>{descriptionAboveInput}</p>
        <PasswordInput
          label="API Key"
          placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
          icon={icon}
          value={apiKey}
          onChange={handleChange}
        />
        {descriptionBelowInput}
        <Group position="right" mt="md">
          <Button type="submit" disabled={initialKey === apiKey}>
            Save
          </Button>
          <Button onClick={closeModal} variant="light">
            Cancel
          </Button>
        </Group>
      </form>
    </div>
  );
}

export default function KeyModal({ close }: { close: () => void }) {
  const apiKeyOpenAI = useChatStore((state) => state.apiKey);
  const setApiKeyOpenAI = useChatStore((state) => state.setApiKey);

  const apiKey11Labs = useChatStore((state) => state.apiKey11Labs);
  const setApiKey11Labs = useChatStore((state) => state.setApiKey11Labs);

  return (
    <div>
      <Box mx="auto">
        <Tabs defaultValue="openai">
          <Tabs.List>
            <Tabs.Tab value="openai" icon={<IconRobot size={px("0.8rem")} />}>
              OpenAI
            </Tabs.Tab>
            <Tabs.Tab value="11labs" icon={<IconVolume size={px("0.8rem")} />}>
              Eleven Labs
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="openai" pt="xs">
            <APIPanel
              name="Enter Your OpenAI API Key"
              initialKey={apiKeyOpenAI}
              setKeyFun={setApiKeyOpenAI}
              descriptionAboveInput="You need an OpenAI API Key. Your API Key is stored locally on your browser and never sent anywhere else."
              descriptionBelowInput={
                <p>
                  → Get your API key from the{" "}
                  <a
                    target="_blank"
                    href="https://platform.openai.com/account/api-keys"
                  >
                    OpenAI dashboard
                  </a>
                  .
                </p>
              }
              validateKey={testKeyOpenAI}
              closeModal={close}
            />
          </Tabs.Panel>
          <Tabs.Panel value="11labs" pt="xs">
            <APIPanel
              name="Enter Your Eleven Labs API Key"
              initialKey={apiKey11Labs}
              setKeyFun={setApiKey11Labs}
              descriptionAboveInput="If you'd like to use TTS via Eleven Labs, you will need an Eleven Labs API Key. Your API Key is stored locally on your browser and never sent anywhere else. Note that cost estimation does not work for ElevenLabs, so watch your usage!"
              descriptionBelowInput={
                <p>
                  → Get your API key from your{" "}
                  <a
                    target="_blank"
                    href="https://beta.elevenlabs.io/speech-synthesis"
                  >
                    ElevenLabs profile
                  </a>
                  .
                </p>
              }
              validateKey={testKey11Labs}
              closeModal={close}
            />
          </Tabs.Panel>
        </Tabs>
      </Box>
    </div>
  );
}
