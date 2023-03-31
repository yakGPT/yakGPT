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
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconBraces, IconSettings } from "@tabler/icons-react";
import { useEffect, useState } from "react";

export default function SettingsModal({ close }: { close: () => void }) {
  const [models, setModels] = useState<string[]>([]);
  const [loadingModels, setLoadingModels] = useState(true);

  const apiKey = useChatStore((state) => state.apiKey);
  const settingsForm = useChatStore((state) => state.settingsForm);
  const updateSettingsForm = useChatStore((state) => state.updateSettingsForm);
  const defaultSettings = useChatStore((state) => state.defaultSettings);

  useEffect(() => {
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
      } finally {
        setLoadingModels(false);
      }
    }

    fetchData();
  }, [apiKey]);

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
            <Tabs.Tab value="general" icon={<IconSettings size="0.8rem" />}>
              General
            </Tabs.Tab>
            <Tabs.Tab value="advanced" icon={<IconBraces size="0.8rem" />}>
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
