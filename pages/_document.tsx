import { createGetInitialProps } from "@mantine/next";
import Document, { Head, Html, Main, NextScript } from "next/document";

const getInitialProps = createGetInitialProps();

export default class _Document extends Document {
  static getInitialProps = getInitialProps;

  render() {
    return (
      <Html>
        <Head />
        <body>
          <Main />
          <NextScript />

          {/* Only load eruda if ?eruda=true in URL */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                  (function() {
                    const urlParams = new URLSearchParams(window.location.search);
                    if (urlParams.has('eruda') && urlParams.get('eruda') === 'true') {
                      const script = document.createElement('script');
                      script.src = '//cdn.jsdelivr.net/npm/eruda';
                      document.body.appendChild(script);
                      script.onload = function() {
                        eruda.init();
                      };
                    }
                  })();
                `,
            }}
          />

          <script
            async
            src="https://cdn.jsdelivr.net/npm/opus-media-recorder@latest/OpusMediaRecorder.umd.js"
          ></script>
          <script
            async
            src="https://cdn.jsdelivr.net/npm/opus-media-recorder@latest/encoderWorker.umd.js"
          ></script>
        </body>
      </Html>
    );
  }
}
