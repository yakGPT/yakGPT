import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk";

export async function testKey(
  subscriptionKey: string,
  serviceRegion?: string
): Promise<boolean> {
  var speechConfig = SpeechSDK.SpeechConfig.fromSubscription(
    subscriptionKey,
    serviceRegion || "eastus"
  );

  // @ts-ignore - null is for audioConfig to prevent it from auto-speaking
  const synthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig, null);

  let inputText = "Key saved.";

  const resultPromise = new Promise<boolean>((resolve) => {
    synthesizer.speakTextAsync(
      inputText,
      function (result) {
        synthesizer.close();
        if (
          result.reason === SpeechSDK.ResultReason.SynthesizingAudioCompleted
        ) {
          console.log(
            "Speech synthesized to speaker for text [",
            inputText,
            "]."
          );
          resolve(true);
        } else if (result.reason === SpeechSDK.ResultReason.Canceled) {
          console.log("Speech synthesis canceled.");
          resolve(false);
        }
      },
      function (error) {
        synthesizer.close();
        console.log("Error:", error);
        resolve(false);
      }
    );
  });

  return resultPromise;
}

function createSSML(
  text: string,
  voice: string = "en-US-JaneNeural",
  style: string = "friendly"
): string {
  let expressAs = "";

  if (style) {
    expressAs = `<mstts:express-as style="${style}">${text}</mstts:express-as>`;
  } else {
    expressAs = text;
  }

  return `<speak xmlns="http://www.w3.org/2001/10/synthesis"
                xmlns:mstts="http://www.w3.org/2001/mstts"
                xmlns:emo="http://www.w3.org/2009/10/emotionml"
                version="1.0"
                xml:lang="en-US">
                  <voice name="${voice}">
                    ${expressAs}
                  </voice>
                </speak>`;
}

export async function genAudio(
  text: string,
  subscriptionKey: string,
  serviceRegion?: string,
  voice?: string,
  style?: string
): Promise<ArrayBuffer | null> {
  var speechConfig = SpeechSDK.SpeechConfig.fromSubscription(
    subscriptionKey,
    serviceRegion || "eastus"
  );
  speechConfig.speechSynthesisOutputFormat =
    SpeechSDK.SpeechSynthesisOutputFormat.Audio16Khz64KBitRateMonoMp3;

  // @ts-ignore - null is for audioConfig to prevent it from auto-speaking
  const synthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig, null);

  const ssmlText = createSSML(text, voice, style);

  const resultPromise = new Promise<ArrayBuffer | null>((resolve) => {
    synthesizer.speakSsmlAsync(
      ssmlText,
      function (result) {
        synthesizer.close();
        if (
          result.reason === SpeechSDK.ResultReason.SynthesizingAudioCompleted
        ) {
          const audioData = result.audioData;
          console.log(`Audio data byte size: ${audioData.byteLength}.`);
          resolve(audioData);
        } else if (result.reason === SpeechSDK.ResultReason.Canceled) {
          console.log("Speech synthesis canceled.");
          resolve(null);
        }
      },
      function (error) {
        synthesizer.close();
        console.log("Error:", error);
        resolve(null);
      }
    );
  });

  return resultPromise;
}

export async function getVoices(
  subscriptionKey: string,
  serviceRegion?: string
): Promise<SpeechSDK.VoiceInfo[] | null> {
  try {
    const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(
      subscriptionKey,
      serviceRegion || "eastus"
    );
    // @ts-ignore - null is for audioConfig to prevent it from auto-speaking
    const synthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig, null);
    const result = await synthesizer.getVoicesAsync();
    return result.voices;
  } catch (error) {
    console.error("Error getting available voices:", error);
    return null;
  }
}

export type Voice = SpeechSDK.VoiceInfo;
