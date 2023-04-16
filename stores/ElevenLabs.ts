import { notifications } from "@mantine/notifications";

const BASE_URL = "https://api.elevenlabs.io/v1";

export const testKey = async (apiKey: string): Promise<boolean> => {
  try {
    const response = await fetch(`${BASE_URL}/voices`, {
      method: "GET",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

export type Voice = {
  voice_id: string;
  name: string;
};

export const genAudio = async ({
  text,
  key,
  region,
  voice,
  style,
}: {
  text: string;
  key: string;
  region?: string;
  voice?: string;
  style?: string;
}): Promise<string | undefined> => {
  try {
    const response = await fetch(`${BASE_URL}/text-to-speech/${voice}`, {
      method: "POST",
      headers: {
        Accept: "audio/mpeg",
        "xi-api-key": key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });
    if (!response.ok || !response.body) {
      const readBody = await response.text();
      let message = readBody;
      try {
        const json = JSON.parse(readBody);
        message = json.detail.message;
      } catch (e) {}
      notifications.show({
        title: "Error",
        message,
        color: "red",
      });
      throw new Error(
        `Network response was not ok ${response.ok} ${message} ${response.status}`
      );
    }
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const getVoices = async (apiKey: string): Promise<Voice[]> => {
  try {
    const response = await fetch(`${BASE_URL}/voices`, {
      method: "GET",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
    return data.voices;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
