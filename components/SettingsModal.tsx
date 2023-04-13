import { useChatStore } from "@/stores/ChatStore";
import {
  TextInput,
  Button,
  Group,
  Box,
  Text,
  Slider,
  Select,
  Tabs,
  Autocomplete,
  Switch,
  NumberInput,
  px,
  Accordion,
  Title,
} from "@mantine/core";
import ISO6391 from "iso-639-1";
import { useForm } from "@mantine/form";
import { IconBraces, IconMicrophone, IconSettings } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import * as ElevenLabs from "@/stores/ElevenLabs";
import { refreshModels, updateSettingsForm } from "@/stores/ChatActions";
import * as Azure from "@/stores/AzureSDK";
import { azureCandidateLanguages } from "./azureLangs";

function getLanguages() {
  const languageCodes = ISO6391.getAllCodes();
  return languageCodes.map((code) => ({
    label: `${ISO6391.getName(code)} (${code})`,
    value: code,
  }));
}

export default function SettingsModal({ close }: { close: () => void }) {
  const modelChoicesChat =
    useChatStore((state) => state.modelChoicesChat) || [];
  const [voices11Labs, setVoices11Labs] = useState<ElevenLabs.Voice[]>([]);
  const [voicesAzure, setVoicesAzure] = useState<Azure.Voice[]>([]);
  const [voiceStylesAzure, setVoiceStylesAzure] = useState<string[]>([]);

  const apiKey11Labs = useChatStore((state) => state.apiKey11Labs);
  const apiKeyAzure = useChatStore((state) => state.apiKeyAzure);
  const apiKeyAzureRegion = useChatStore((state) => state.apiKeyAzureRegion);
  const settingsForm = useChatStore((state) => state.settingsForm);
  const defaultSettings = useChatStore((state) => state.defaultSettings);

  useEffect(() => {
    refreshModels();
  }, []);

  useEffect(() => {
    // Load 11Labs voices11Labs
    async function fetchData() {
      if (!apiKey11Labs) return;

      try {
        const voices11Labs = await ElevenLabs.getVoices(apiKey11Labs);
        setVoices11Labs(voices11Labs);
      } catch (error) {
        console.error("Failed to fetch models:", error);
      }
    }

    fetchData();
  }, [apiKey11Labs]);

  const form = useForm({
    initialValues: settingsForm,
    validate: {
      logit_bias: (value) => {
        try {
          if (value === "") return null;
          const parsed = JSON.parse(value);
          if (typeof parsed !== "object" || Array.isArray(parsed))
            throw new Error();
          for (const key in parsed) {
            const num = parsed[key];
            if (!Number.isFinite(num) || num < -100 || num > 100)
              throw new Error();
          }
          return null;
        } catch {
          return "Logit bias must be a valid JSON object with keys representing token IDs and values between -100 and 100";
        }
      },
    },
  });

  useEffect(() => {
    // Load Azure voices
    async function fetchData() {
      if (!apiKeyAzure || !apiKeyAzureRegion) return;
      const voices = await Azure.getVoices(apiKeyAzure, apiKeyAzureRegion);
      if (!voices) return;
      setVoicesAzure(voices);
    }

    fetchData();
  }, [apiKeyAzure, apiKeyAzureRegion]);

  useEffect(() => {
    setVoiceStylesAzure(
      voicesAzure.find(
        (voice) => voice.shortName === form.values.voice_id_azure
      )?.styleList || []
    );
  }, [voicesAzure, form.values.voice_id_azure]);

  const languages = getLanguages();
  const langDisplayToCode = languages.reduce((acc, cur) => {
    acc[cur.label] = cur.value;
    return acc;
  }, {} as Record<string, string>);

  return (
    <Box mx="auto">
      <form
        onSubmit={form.onSubmit((values) => {
          updateSettingsForm(values);
          close();
        })}
      >
        <Tabs defaultValue="openai">
          <Tabs.List>
            <Tabs.Tab
              value="openai"
              icon={<IconSettings size={px("0.8rem")} />}
            >
              OpenAI
            </Tabs.Tab>
            <Tabs.Tab
              value="azure"
              icon={<IconMicrophone size={px("0.8rem")} />}
            >
              Azure
            </Tabs.Tab>
            <Tabs.Tab value="11labs" icon={<IconBraces size={px("0.8rem")} />}>
              ElevenLabs
            </Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="openai" pt="xs">
            <Accordion defaultValue="general">
              <Accordion.Item value="general">
                <Accordion.Control>GPT - General</Accordion.Control>
                <Accordion.Panel>
                  <Select
                    required
                    label="Model"
                    placeholder="Select a model"
                    value={form.values.model}
                    onChange={(value) => form.setFieldValue("model", value!)}
                    data={modelChoicesChat.map((model) => ({
                      label: model,
                      value: model,
                    }))}
                  ></Select>
                  <Text mt="lg" size="sm">
                    Sampling temperature ({form.values.temperature})
                  </Text>
                  <Slider
                    value={form.values.temperature}
                    min={0}
                    max={2}
                    step={0.1}
                    precision={1}
                    onChange={(value) =>
                      form.setFieldValue("temperature", value)
                    }
                  />
                  <Switch
                    mt="xl"
                    checked={form.values.auto_title}
                    label="Automatically use model to find chat title"
                    onChange={(event) =>
                      form.setFieldValue(
                        "auto_title",
                        event.currentTarget.checked
                      )
                    }
                  />
                </Accordion.Panel>
              </Accordion.Item>

              <Accordion.Item value="advanced">
                <Accordion.Control>GPT - Advanced</Accordion.Control>
                <Accordion.Panel>
                  <Text mt="lg" size="sm">
                    Top P ({form.values.top_p})
                  </Text>
                  <Slider
                    value={form.values.top_p}
                    min={0}
                    max={1}
                    step={0.01}
                    precision={2}
                    onChange={(value) => form.setFieldValue("top_p", value)}
                  />

                  <Text mt="lg" size="sm">
                    N ({form.values.n})
                  </Text>
                  <Slider
                    value={form.values.n}
                    min={1}
                    max={10}
                    step={1}
                    onChange={(value) => form.setFieldValue("n", value)}
                  />
                  <TextInput
                    mt="lg"
                    label="Stop"
                    placeholder="Up to 4 sequences where the API will stop generating further tokens"
                    {...form.getInputProps("stop")}
                  />

                  <Text mt="lg" size="sm">
                    Max Tokens (
                    {form.values.max_tokens === 0
                      ? "Unlimited"
                      : form.values.max_tokens}
                    )
                  </Text>
                  <Slider
                    value={form.values.max_tokens}
                    min={0}
                    max={4000}
                    step={1}
                    onChange={(value) =>
                      form.setFieldValue("max_tokens", value)
                    }
                  />

                  <Text mt="lg" size="sm">
                    Presence Penalty ({form.values.presence_penalty})
                  </Text>
                  <Slider
                    value={form.values.presence_penalty}
                    min={-2}
                    max={2}
                    step={0.1}
                    precision={1}
                    onChange={(value) =>
                      form.setFieldValue("presence_penalty", value)
                    }
                  />

                  <Text mt="lg" size="sm">
                    Frequency Penalty ({form.values.frequency_penalty})
                  </Text>
                  <Slider
                    value={form.values.frequency_penalty}
                    min={-2}
                    max={2}
                    step={0.1}
                    precision={1}
                    onChange={(value) =>
                      form.setFieldValue("frequency_penalty", value)
                    }
                  />

                  <TextInput
                    mt="lg"
                    label="Logit Bias"
                    placeholder='{"token_id": 0.5, "token_id_2": -0.5}'
                    {...form.getInputProps("logit_bias")}
                  />
                </Accordion.Panel>
              </Accordion.Item>
              <Accordion.Item value="whisper">
                <Accordion.Control>Whisper (Speech to Text)</Accordion.Control>
                <Accordion.Panel>
                  <Switch
                    pb="md"
                    checked={form.values.auto_detect_language}
                    label="Auto-detect language"
                    onChange={(event) => {
                      form.setFieldValue(
                        "auto_detect_language",
                        event.currentTarget.checked
                      );
                    }}
                  />

                  <Autocomplete
                    disabled={form.values.auto_detect_language}
                    label="Spoken language (choosing gives better accuracy)"
                    value={form.values.spoken_language}
                    onChange={(value) => {
                      form.setFieldValue("spoken_language", value!);
                      form.setFieldValue(
                        "spoken_language_code",
                        langDisplayToCode[value!]
                      );
                    }}
                    data={getLanguages().map((lang) => lang.label)}
                  />
                </Accordion.Panel>
              </Accordion.Item>
            </Accordion>
          </Tabs.Panel>
          <Tabs.Panel value="azure" pt="xs">
            <Title pt="xs" pb="md" order={4}>
              Speech to Text
            </Title>
            <Switch
              pb="md"
              checked={form.values.auto_detect_language_azure}
              label="Auto-detect language"
              onChange={(event) => {
                form.setFieldValue(
                  "auto_detect_language_azure",
                  event.currentTarget.checked
                );
              }}
            />
            <Autocomplete
              disabled={form.values.auto_detect_language_azure}
              label="Spoken language (choosing gives better accuracy)"
              value={form.values.spoken_language_azure}
              onChange={(value) => {
                const key = Object.entries(azureCandidateLanguages).find(
                  ([, v]) => v === value
                );
                if (key) {
                  form.setFieldValue("spoken_language_code_azure", key[0]);
                }

                form.setFieldValue("spoken_language_azure", value!);
              }}
              data={Object.values(azureCandidateLanguages)}
            />
            <NumberInput
              label="Message submit debounce (milliseconds)"
              value={form.values.submit_debounce_ms}
              onChange={(value) => {
                if (typeof value === "number") {
                  form.setFieldValue("submit_debounce_ms", value);
                }
              }}
            />
            <Title pt="md" pb="sm" order={4}>
              Text to Speech
            </Title>
            <Autocomplete
              label="Voice"
              placeholder="Select a voice"
              value={form.values.voice_id_azure}
              onChange={(value) => {
                setVoiceStylesAzure(
                  voicesAzure.find((voice) => voice.shortName === value)
                    ?.styleList || []
                );
                form.setFieldValue("voice_id_azure", value!);
              }}
              data={voicesAzure.map((voice) => ({
                label: voice.shortName,
                value: voice.shortName,
              }))}
            ></Autocomplete>
            <Select
              label="Voice style"
              disabled={voiceStylesAzure.length === 0}
              placeholder="Select a voice style"
              value={form.values.spoken_language_style}
              onChange={(value) =>
                form.setFieldValue("spoken_language_style", value!)
              }
              data={voiceStylesAzure}
            ></Select>
          </Tabs.Panel>
          <Tabs.Panel value="11labs" pt="xs">
            <Select
              required
              label="Voice"
              placeholder="Select a voice"
              value={form.values.voice_id}
              onChange={(value) => form.setFieldValue("voice_id", value!)}
              data={voices11Labs.map((voice) => ({
                label: voice.name,
                value: voice.voice_id,
              }))}
            ></Select>
          </Tabs.Panel>
          <Group position="apart" mt="lg">
            <Button
              variant="light"
              onClick={() => {
                form.setValues(defaultSettings);
              }}
            >
              Reset
            </Button>
            <Button type="submit">Save</Button>
          </Group>
        </Tabs>
      </form>
    </Box>
  );
}
