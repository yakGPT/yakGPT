import ChatDisplay from "@/components/ChatDisplay";
import Hero from "@/components/Hero";
import { useChatStore } from "@/stores/ChatStore";

export default function Home() {
  const apiKey = useChatStore((state) => state.apiKey);

  return apiKey ? <ChatDisplay /> : <Hero />;
}
