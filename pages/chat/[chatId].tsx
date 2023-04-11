import ChatDisplay from "@/components/ChatDisplay";
import { GetServerSideProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

export default function Home() {
  return <ChatDisplay />;
}

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? "en", [
        "common",
        "nav",
        "new_chat",
        "key_modal",
        "hero",
      ])),
      // Will be passed to the page component as props
    },
  };
};
