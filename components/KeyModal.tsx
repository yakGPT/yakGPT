import { useState } from "react";
import {
  Button,
  Group,
  Box,
  Loader,
  Tabs,
  px,
  PasswordInput,
  TextInput,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useTranslation } from "next-i18next";

import { testKey as testKeyOpenAI } from "@/stores/OpenAI";
import { testKey as testKey11Labs } from "@/stores/ElevenLabs";
import { testKey as testKeyAzure } from "@/stores/AzureSDK";

import { useChatStore } from "@/stores/ChatStore";
import {
  IconBrandWindows,
  IconCheck,
  IconRobot,
  IconVolume,
  IconX,
} from "@tabler/icons-react";
import { update } from "@/stores/ChatActions";

export function APIPanel({
  name,
  initialKey,
  initialRegion,
  setKeyFun,
  setKeyFunRegion,
  descriptionAboveInput,
  descriptionBelowInput,
  validateKey,
  closeModal,
}: {
  name: string;
  initialKey: string | undefined;
  initialRegion?: string | undefined;
  setKeyFun: (key: string) => void;
  setKeyFunRegion?: (key: string) => void;
  descriptionAboveInput: string;
  descriptionBelowInput: React.ReactNode;
  validateKey: (key: string, region?: string) => Promise<boolean>;
  closeModal: () => void;
}) {
  const [checkStatus, setCheckStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [apiKey, setApiKey] = useState(initialKey);
  const [region, setRegion] = useState(initialRegion);
  const { t } = useTranslation("key_modal");

  const handleKeyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCheckStatus("idle");
    setApiKey(event.target.value);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (apiKey) {
      setCheckStatus("loading");

      const keyValid = await validateKey(apiKey, region);

      if (keyValid) {
        notifications.show({
          message: "Key saved!",
          color: "green",
        });
        setKeyFun(apiKey);
        if (setKeyFunRegion && region) {
          setKeyFunRegion(region);
        }
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
        <h2>{t(`🔑 ${name}:`)}</h2>
        <p>{t(`${descriptionAboveInput}`)}</p>
        <PasswordInput
          label="API Key"
          placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
          icon={icon}
          value={apiKey}
          onChange={handleKeyChange}
        />
        {setKeyFunRegion && (
          <TextInput
            label="Region"
            placeholder="westus"
            value={region}
            onChange={(event) => setRegion(event.target.value)}
          />
        )}
        {descriptionBelowInput}
        <Group position="right" mt="md">
          <Button
            type="submit"
            disabled={initialKey === apiKey && initialRegion === region}
          >
            {t("Save")}
          </Button>
          <Button onClick={closeModal} variant="light">
            {t("Cancel")}
          </Button>
        </Group>
      </form>
    </div>
  );
}

export default function KeyModal({ close }: { close: () => void }) {
  const apiKeyOpenAI = useChatStore((state) => state.apiKey);
  const apiKey11Labs = useChatStore((state) => state.apiKey11Labs);
  const apiKeyAzure = useChatStore((state) => state.apiKeyAzure);
  const apiKeyAzureRegion = useChatStore((state) => state.apiKeyAzureRegion);

  const setApiKeyOpenAI = (key: string) => update({ apiKey: key });
  const setApiKeyAzure = (key: string) => update({ apiKeyAzure: key });
  const setApiKeyAzureRegion = (region: string) =>
    update({ apiKeyAzureRegion: region });
  const setApiKey11Labs = (key: string) => update({ apiKey11Labs: key });

  const { t } = useTranslation("key_modal");

  return (
    <div>
      <Box mx="auto">
        <Tabs defaultValue="openai">
          <Tabs.List>
            <Tabs.Tab value="openai" icon={<IconRobot size={px("0.8rem")} />}>
              OpenAI
            </Tabs.Tab>
            <Tabs.Tab
              value="azure"
              icon={<IconBrandWindows size={px("0.8rem")} />}
            >
              Azure
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
                  {t("→ Get your API key from the ")}
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
          <Tabs.Panel value="azure" pt="xs">
            <APIPanel
              name="Enter Your Azure Speech API Key"
              initialKey={apiKeyAzure}
              initialRegion={apiKeyAzureRegion}
              setKeyFun={setApiKeyAzure}
              setKeyFunRegion={setApiKeyAzureRegion}
              descriptionAboveInput="If you'd like to use TTS via Azure, you will need an Azure Speech API Key. Your API Key is stored locally on your browser and never sent anywhere else. Note that cost estimation does not work for Azure, so watch your usage!"
              descriptionBelowInput={
                <p>
                  {t("→ Azure gives a $200 free credit on signup. ")}
                  <a
                    target="_blank"
                    href="https://carldesouza.com/get-a-microsoft-cognitive-services-subscription-key/"
                  >
                    {t("This guide explains the steps.")}
                  </a>
                </p>
              }
              validateKey={testKeyAzure}
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
                  {t("→ Get your API key from the ")}
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
