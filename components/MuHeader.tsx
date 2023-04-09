import {
  createStyles,
  Header,
  Group,
  ActionIcon,
  Container,
  Burger,
  rem,
  Text,
  MediaQuery,
  Divider,
  px,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { IconBrandGithub, IconPlus } from "@tabler/icons-react";
import { useChatStore } from "@/stores/ChatStore";
import { getModelInfo, modelInfos } from "@/stores/Model";
import { useRouter } from "next/router";
import { addChat, setNavOpened } from "@/stores/ChatActions";

const useStyles = createStyles((theme) => ({
  inner: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    height: rem(36),

    [theme.fn.smallerThan("sm")]: {
      justifyContent: "flex-start",
    },
  },

  links: {
    width: rem(260),

    [theme.fn.smallerThan("sm")]: {
      display: "none",
    },
  },

  social: {
    width: rem(260),

    [theme.fn.smallerThan("sm")]: {
      width: "auto",
      marginLeft: "auto",
    },
  },

  burger: {
    marginRight: theme.spacing.md,

    [theme.fn.largerThan("sm")]: {
      display: "none",
    },
  },

  link: {
    display: "block",
    lineHeight: 1,
    padding: `${rem(8)} ${rem(12)}`,
    borderRadius: theme.radius.sm,
    textDecoration: "none",
    color:
      theme.colorScheme === "dark"
        ? theme.colors.dark[0]
        : theme.colors.gray[7],
    fontSize: theme.fontSizes.sm,
    fontWeight: 500,

    "&:hover": {
      backgroundColor:
        theme.colorScheme === "dark"
          ? theme.colors.dark[6]
          : theme.colors.gray[0],
    },
  },

  linkActive: {
    "&, &:hover": {
      backgroundColor: theme.fn.variant({
        variant: "light",
        color: theme.primaryColor,
      }).background,
      color: theme.fn.variant({ variant: "light", color: theme.primaryColor })
        .color,
    },
  },
}));

export default function MuHeader({ children }: any) {
  const { classes, theme } = useStyles();
  const chats = useChatStore((state) => state.chats);
  const router = useRouter();
  const activeChatId = router.query.chatId as string | undefined;

  const activeChat = chats.find((chat) => chat.id === activeChatId);

  const activeModel = useChatStore((state) => state.settingsForm.model);

  const navOpened = useChatStore((state) => state.navOpened);

  const isSmall = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);
  const isKnownModel = modelInfos[activeModel] !== undefined;
  const modelInfo = getModelInfo(activeModel);

  return (
    <Header height={36} mb={120} sx={{ zIndex: 1002 }}>
      <Container className={classes.inner}>
        <MediaQuery largerThan="sm" styles={{ display: "none", width: 0 }}>
          <Burger
            opened={navOpened}
            onClick={() => setNavOpened(!navOpened)}
            size="sm"
            color={theme.colors.gray[6]}
          />
        </MediaQuery>
        <MediaQuery
          largerThan="sm"
          styles={{ width: "100%", justifyContent: "center" }}
        >
          <Group spacing={5} className={classes.social} noWrap c="dimmed">
            {activeChat?.chosenCharacter ? (
              <>
                <MediaQuery smallerThan="md" styles={{ display: "none" }}>
                  <Text size="sm">{activeChat?.chosenCharacter}</Text>
                </MediaQuery>
                <MediaQuery smallerThan="md" styles={{ display: "none" }}>
                  <Divider size="xs" orientation="vertical" />
                </MediaQuery>
              </>
            ) : null}
            <Text size="sm">{modelInfo.displayName}</Text>
            {isKnownModel && (
              <>
                <Divider size="xs" orientation="vertical" />
                <Text size="sm">
                  ${(activeChat?.costIncurred || 0).toFixed(2)}
                </Text>
              </>
            )}
          </Group>
        </MediaQuery>

        <Group spacing={0} className={classes.social} position="right" noWrap>
          <MediaQuery largerThan="sm" styles={{ display: "none", width: 0 }}>
            <ActionIcon
              onClick={() => {
                addChat(router);
                if (isSmall) {
                  setNavOpened(false);
                }
              }}
              size="lg"
            >
              <IconPlus
                size={px("1.5rem")}
                stroke={1.5}
                color={theme.colors.gray[6]}
              />
            </ActionIcon>
          </MediaQuery>
          <MediaQuery smallerThan="sm" styles={{ display: "none", width: 0 }}>
            <ActionIcon
              sx={{ opacity: 0.8 }}
              onClick={() => {
                window.open("https://github.com/yakGPT/yakGPT", "_blank");
              }}
            >
              <IconBrandGithub size={px("1.5rem")} />
            </ActionIcon>
          </MediaQuery>
        </Group>
      </Container>
    </Header>
  );
}
