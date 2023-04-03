import { useChatStore } from "@/stores/ChatStore";
import { fetchModels } from "@/stores/OpenAI";
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
  px,
} from "@mantine/core";
import ISO6391 from "iso-639-1";
import { useForm } from "@mantine/form";
import { IconBraces, IconMicrophone, IconSettings } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { Voice, getVoices } from "@/stores/ElevenLabs";

function getLanguages() {
  const languageCodes = ISO6391.getAllCodes();
  return languageCodes.map((code) => ({
    label: `${ISO6391.getName(code)} (${code})`,
    value: code,
  }));
}

export default function SettingsModal({ close }: { close: () => void }) {
  const [models, setModels] = useState<string[]>([]);
  const [voices, setVoices] = useState<Voice[]>([]);

  const apiKey = useChatStore((state) => state.apiKey);
  const apiKey11Labs = useChatStore((state) => state.apiKey11Labs);
  const settingsForm = useChatStore((state) => state.settingsForm);
  const updateSettingsForm = useChatStore((state) => state.updateSettingsForm);
  const defaultSettings = useChatStore((state) => state.defaultSettings);

  useEffect(() => {
    // Load OpenAI models
    async function fetchData() {
      if (!apiKey) return;

      try {
        const modelIDs = await fetchModels(apiKey);
        // Use only models that start with gpt-3.5 or gpt-4
        setModels(
          modelIDs.filter(
            (id) => id.startsWith("gpt-3.5") || id.startsWith("gpt-4")
          )
        );
      } catch (error) {
        console.error("Failed to fetch models:", error);
      }
    }

    fetchData();
  }, [apiKey]);

  useEffect(() => {
    // Load 11Labs voices
    async function fetchData() {
      if (!apiKey11Labs) return;

      try {
        const voices = await getVoices(apiKey11Labs);
        setVoices(voices);
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
        <Tabs defaultValue="general">
          <Tabs.List>
            <Tabs.Tab
              value="general"
              icon={<IconSettings size={px("0.8rem")} />}
            >
              General
            </Tabs.Tab>
            <Tabs.Tab
              value="audio"
              icon={<IconMicrophone size={px("0.8rem")} />}
            >
              Audio
            </Tabs.Tab>
            <Tabs.Tab
              value="advanced"
              icon={<IconBraces size={px("0.8rem")} />}
            >
              Advanced
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="general" pt="xs">
            <Select
              required
              label="Model"
              placeholder="Select a model"
              value={form.values.model}
              onChange={(value) => form.setFieldValue("model", value!)}
              data={models.map((model) => ({ label: model, value: model }))}
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
              onChange={(value) => form.setFieldValue("temperature", value)}
            />
            <Switch
              mt="xl"
              checked={form.values.auto_title}
              label="Automatically use model to find chat title"
              onChange={(event) =>
                form.setFieldValue("auto_title", event.currentTarget.checked)
              }
            />
          </Tabs.Panel>
          <Tabs.Panel value="audio" pt="xs">
            <h2>Speech Recognition</h2>
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
            <h2>Text To Speech</h2>
            <Select
              required
              label="Voice"
              placeholder="Select a voice"
              value={form.values.voice_id}
              onChange={(value) => form.setFieldValue("voice_id", value!)}
              data={voices.map((voice) => ({
                label: voice.name,
                value: voice.voice_id,
              }))}
            ></Select>
          </Tabs.Panel>

          <Tabs.Panel value="advanced" pt="xs">
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
              onChange={(value) => form.setFieldValue("max_tokens", value)}
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
          </Tabs.Panel>

          <Group position="right" mt="lg">
            <Button type="submit">Save</Button>
            <Button
              variant="light"
              onClick={() => {
                form.setValues(defaultSettings);
              }}
            >
              Reset
            </Button>
          </Group>
        </Tabs>
      </form>
    </Box>
  );
}
