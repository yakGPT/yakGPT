import React from "react";
import { v4 as uuidv4 } from "uuid";
import { useChatStore } from "@/stores/ChatStore";
import { Container, rem, useMantineTheme } from "@mantine/core";
import { Carousel } from "@mantine/carousel";
import { useMediaQuery } from "@mantine/hooks";
import { useTranslation } from "next-i18next";

import {
  IconArrowDown,
  IconArrowLeft,
  IconArrowRight,
} from "@tabler/icons-react";
import BGCard from "./BGCard";

import dalai_lama from "../public/chars/dalai_lama.png";
import debate from "../public/chars/debate.png";
import elon_musk from "../public/chars/elon_musk.png";
import expert from "../public/chars/expert.png";
import idea_generator from "../public/chars/idea_generator.png";
import marcus_aurelius from "../public/chars/marcus_aurelius.png";
import oprah from "../public/chars/oprah.png";
import philosopher from "../public/chars/philosopher.png";
import stephen_hawking from "../public/chars/stephen_hawking.png";
import therapist from "../public/chars/therapist.png";
import tolle from "../public/chars/tolle.png";
import { useRouter } from "next/router";
import { addChat, setChosenCharacter } from "@/stores/ChatActions";
import { submitMessage } from "@/stores/SubmitMessage";

const scriptBase = ({
  character,
  characterDescription,
}: {
  character: string;
  characterDescription: string;
}) => {
  return `I’m having trouble with a scene in my screenplay where a person has a conversation with a ${character}.

 ${characterDescription && `Description: ${characterDescription}`}

I have written all of the person's lines already, but I haven’t written any of the lines for the ${character}. So what I’d like to do is give you the person’s lines, and have you provide a response for the ${character}.
I’ll give you the person’s lines one at a time, so only give me a single line of dialogue from the ${character} each time, and then wait for me to tell you the next line from the person, and we’ll simply repeat that process until the scene is complete.

Stay in character!

The person’s first line is:

Hello
`;
};

const characters = {
  "Expert in Everything": {
    shortDescription: "Ask me anything!",
    avatar: expert,
    prompt: `I want you to act as a a world-leading expert in whatever I'm about to ask you.`,
  },
  Therapist: {
    shortDescription: "Techniques to change your beliefs",
    characterDescription:
      "World-class therapist with a specialization in Cognitive Behavioral Therapy",
    avatar: therapist,
  },
  "Idea Generator": {
    shortDescription: "Brainstorming",
    avatar: idea_generator,
    prompt: `  Rules:
1. During our conversation, please speak as both an expert in all topics, maintaining a conversational tone, and as a deterministic computer.  Kindly adhere to my requests with precision.
2. Stop where I ask you to stop

# (1) Introduction
1. While Loop (While I still want to answer your clarifying questions):
2. Kindly ask one clarifying question after I share my idea.
3. Summarize and expand on the idea with the new information.
4. Ask me if I want to “(1) Continue Refining the Idea”, “(2) Talk with a Panel of Experts”, or “(3) Move On to High Level Plan”.
5. End While Loop if 2 or 3 are chosen.

# (2) Panel of Experts:
1. Create for me a panel of experts in the topic with a random number of members. You create their names and areas of expertise.
2. You ask the panelists to come up with questions and advice to improve the idea.
3. Tell me the number of questions the Panel has come up with.
4. Tell me I can ask the Panel for advice or hear the Panel’s questions.
5. You introduce the panel and each panelist.
6. Ask the panel to ask me one question.
7. While Loop (While I still want to answer the Panels questions):
8. The Panel automatically chooses 1 question and asks that 1 question.
9. The Panel summarizes my response and adds it to the idea.
10. The Panel may ask a follow-up, clarifying question based on my response.
11. Ask me if I want to “(1) Continue answering the Panels Questions”, “(2) Ask a Panel of Experts for Advice”, or “(3) Move On to High Level Plan”.
12. End While Loop if 2 or 3 are chosen.
13. Repeat until everyone has asked me their questions.
14. Combine similar ideas into a coherent one to avoid duplication.
15. Reorder the ideas list based on stated knowledge, experience, and steps needed to complete the idea
16. Show me the ideas in a markdown list with # at the beginning after converting them from questions to statements for review before adding them to the Unique Idea list.
17. Compile a markdown table highlighting all the aspects of my idea that make it unique:

| Number | Unique Aspect | Why it’s Unique |
|-|-|-|

# (3) Planning
## High-Level Plan
After I finish, you create "Your Idea" summary and detailed plan as a markdown list with #, Plan Phase, and Summary.

Stop here and let's review your high-level plan and ensure it aligns with my goals. Do you want to discuss Milestones or move on to Tasks?

## Milestones
List each phase with work type in a markdown table:

| Number | Plan Phase | Milestone Summary | Description |
|-|-|-|-|

Stop here and let's review the milestones you proposed and ensure they align with my high-level plan. Do you want to discuss Tasks move on to Resources?

## Tasks
Break milestones into detailed small tasks in a markdown table, without dividing into phases:

| Number | Milestone Phase | Task Type | Summary |
|-|-|-|-|

Stop here and let's review the tasks you proposed and ensure they match my milestones. Should we review the Resources section or move on to Raid Chart?

## Resources
Create a markdown table with this format:

| Number | Milestone Summary | Resources | Skills | Expertise |
|-|-|-|-|-|

Stop here and let's review the Resources you proposed and ensure they match my needs. Should we review the Raid Chart section or move on to Summary?

## RAID Chart
create a detailed raid analysis from the tasks into a markdown table

| Number | Task Type | Description | Type | Criticality | Next Actions | Owner |
|-|-|-|-|-|-|-|

Stop here and let's review the Raid Chart you proposed and ensure they match my needs. Should we review the Summary section or move on to the Bonus Section?

## Plan Summary
in the 50 words, summarize the plan

## Share with Others
In the form of a tweet, summarize the plan. append the hashtag #CreateWithMe

also please ask me if i want to go over the Bonus: Project Gantt Chart part or skip it and move on to the Bonus: CSV Output or just stop

## Bonus: Project Gannt Chart
in a Markdown table:
* Add UUID#, Plan Phase Type, and Milestone Type at the beginning
* Include predecessor id, successor id, critical path id, and free slack at the end.

## BONUS: CSV Output
Output detailed task list in CSV format with UUID, task name, summary, start date, end date, duration, predecessors, and resources using "|" separator.


Before we begin, repeat this "Hi! I’m here to guide you with a prompt-based interface to flesh out your idea from beginning to end. Ever wonder what it would take to get that app idea off the ground or planning your next party? I can help you come up with ideas from beginning to end and help you identify what you need and identify pitfalls too. Oh, and I also give tailored advice based on your prompts.”

Repeat this verbatim, “Tell me about an idea you have, like: "Beach-themed birthday party" or "I want to build a web service that uses machine learning with a freemium model."

Ask me what my idea is.`,
  },
  Philosopher: {
    shortDescription: "Ethics, logic, and reasoning",
    avatar: philosopher,
    prompt: `I want you to act as a philosopher. I will provide some topics or questions related to the study of philosophy, and it will be your job to explore these concepts in depth. This could involve conducting research into various philosophical theories, proposing new ideas or finding creative solutions for solving complex problems. My first request is "I need help developing an ethical framework for decision making."`,
  },
  "Debate Champion": {
    shortDescription: "Articulate and quick-witted",
    avatar: debate,
  },
  Stoic: {
    shortDescription: "Acceptance, virtue, resilience",
    avatar: marcus_aurelius,
  },
  "Stephen Hawking": {
    shortDescription: "Renowned theoretical physicist",
    avatar: stephen_hawking,
  },
  "Dalai Lama": {
    shortDescription: "Spiritual leader of Tibetan Buddhism",
    avatar: dalai_lama,
  },
  "Oprah Winfrey": {
    shortDescription: "Television host, actress and producer",
    avatar: oprah,
  },
  "Eckhart Tolle": {
    shortDescription: "Spiritual teacher",
    avatar: tolle,
  },
  "Elon Musk": {
    shortDescription: "Visionary entrepreneur",
    avatar: elon_musk,
  },
};

function CardsCarousel({ children }: { children: React.ReactNode }) {
  const theme = useMantineTheme();
  const mobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);

  const slides = React.Children.map(children, (theirChildren, index) => (
    <Carousel.Slide key={index}>{theirChildren}</Carousel.Slide>
  ));

  return (
    <Carousel
      slideSize="30.5%"
      breakpoints={[{ maxWidth: "sm", slideSize: "100%", slideGap: rem(2) }]}
      slideGap="xl"
      slidesToScroll={mobile ? 1 : 3}
      controlsOffset="xs"
      nextControlIcon={<IconArrowRight size={16} />}
      previousControlIcon={<IconArrowLeft size={16} />}
      sx={{ maxWidth: "90vw" }}
    >
      {slides}
    </Carousel>
  );
}

export default function NewChatCarousel() {
  const router = useRouter();

  const { t } = useTranslation("new_chat");
  return (
    <Container py="xl">
      <h2 style={{ textAlign: "center" }}>{t("Choose a prompt...")}</h2>
      <CardsCarousel>
        {Object.keys(characters).map((key) => {
          // @ts-ignore
          const character = characters[key];
          return (
            <BGCard
              key={key}
              title={key}
              image={character.avatar.src}
              description={character.shortDescription}
              onClick={(e) => {
                setChosenCharacter(key);
                addChat(router);
                submitMessage({
                  id: uuidv4(),
                  content:
                    character.prompt ||
                    scriptBase({
                      character: key,
                      characterDescription:
                        character.characterDescription || "",
                    }),
                  role: "system",
                });
              }}
            />
          );
        })}
      </CardsCarousel>
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
        }}
      >
        <h2>{t("Or start by simply typing below")}</h2>
        <IconArrowDown style={{ marginLeft: "0.5rem" }} />
      </div>
    </Container>
  );
}
