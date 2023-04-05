import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk";

export async function testKey(
  subscriptionKey: string,
  serviceRegion?: string
): Promise<boolean> {
  var speechConfig = SpeechSDK.SpeechConfig.fromSubscription(
    subscriptionKey,
    serviceRegion || "eastus"
  );

  const synthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig);

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
