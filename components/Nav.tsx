import {
  clearChats,
  deleteChat,
  setNavOpened,
  updateChat,
} from "@/stores/ChatActions";
import { useChatStore } from "@/stores/ChatStore";
import {
  ActionIcon,
  Box,
  Burger,
  createStyles,
  getStylesRef,
  Group,
  MediaQuery,
  Modal,
  Navbar,
  px,
  rem,
  Text,
  TextInput,
  Tooltip,
  useMantineColorScheme,
} from "@mantine/core";
import { useDisclosure, useMediaQuery } from "@mantine/hooks";
import {
  IconArrowRight,
  IconEdit,
  IconKey,
  IconMoon,
  IconPlus,
  IconSettings,
  IconSun,
  IconTrash,
} from "@tabler/icons-react";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import { useRef, useState } from "react";
import ClearChatsButton from "./ClearChatsButton";
import KeyModal from "./KeyModal";
import SettingsModal from "./SettingsModal";

const useStyles = createStyles((theme) => ({
  header: {
    paddingBottom: theme.spacing.md,
    marginBottom: `calc(${theme.spacing.md} * 1.5)`,
    borderBottom: `${rem(1)} solid ${
      theme.colorScheme === "dark" ? theme.colors.dark[4] : theme.colors.gray[2]
    }`,
  },

  footer: {
    paddingTop: theme.spacing.md,
    marginTop: theme.spacing.md,
    borderTop: `${rem(1)} solid ${
      theme.colorScheme === "dark" ? theme.colors.dark[4] : theme.colors.gray[2]
    }`,
  },

  link: {
    ...theme.fn.focusStyles(),
    display: "flex",
    alignItems: "center",
    textDecoration: "none",
    fontSize: theme.fontSizes.sm,
    color:
      theme.colorScheme === "dark"
        ? theme.colors.dark[1]
        : theme.colors.gray[7],
    padding: `${theme.spacing.xs} ${theme.spacing.xs}`,
    borderRadius: theme.radius.sm,
    fontWeight: 500,
    // im a noob
    flexGrow: "1 !important",

    "&:hover": {
      backgroundColor:
        theme.colorScheme === "dark"
          ? theme.colors.dark[6]
          : theme.colors.gray[0],
      color: theme.colorScheme === "dark" ? theme.white : theme.black,

      [`& .${getStylesRef("icon")}`]: {
        color: theme.colorScheme === "dark" ? theme.white : theme.black,
      },
    },
  },

  linkIcon: {
    ref: getStylesRef("icon"),
    color:
      theme.colorScheme === "dark"
        ? theme.colors.dark[2]
        : theme.colors.gray[6],
    marginRight: theme.spacing.sm,
  },

  linkActive: {
    "&, &:hover": {
      backgroundColor: theme.fn.variant({
        variant: "light",
        color: theme.primaryColor,
      }).background,
      color: theme.fn.variant({ variant: "light", color: theme.primaryColor })
        .color,
      [`& .${getStylesRef("icon")}`]: {
        color: theme.fn.variant({ variant: "light", color: theme.primaryColor })
          .color,
      },
    },
  },

  scrollbar: {
    scrollbarWidth: "thin",
    scrollbarColor: "transparent transparent",

    "&::-webkit-scrollbar": {
      width: "6px",
    },

    "&::-webkit-scrollbar-track": {
      background: "transparent",
    },

    "&::-webkit-scrollbar-thumb": {
      backgroundColor: "transparent",
      borderRadius: "20px",
    },
  },
}));

export default function NavbarSimple() {
  const { classes, cx, theme } = useStyles();

  const router = useRouter();
  const activeChatId = router.query.chatId as string | undefined;
  const { t } = useTranslation("nav");
  const [openedKeyModal, { open: openKeyModal, close: closeKeyModal }] =
    useDisclosure(false);
  const [
    openedSettingsModal,
    { open: openSettingsModal, close: closeSettingsModal },
  ] = useDisclosure(false);
  const [openedTitleModal, { open: openTitleModal, close: closeTitleModal }] =
    useDisclosure(false);

  const chats = useChatStore((state) => state.chats);
  const navOpened = useChatStore((state) => state.navOpened);

  const [editedTitle, setEditedTitle] = useState("");

  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const Icon = colorScheme === "dark" ? IconSun : IconMoon;

  const isSmall = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);

  const links = chats.map((chat) => (
    <Group
      position="apart"
      key={chat.id}
      sx={{
        position: "relative",
        maskImage:
          chat.id === activeChatId
            ? ""
            : "linear-gradient(to right, black 80%, transparent 110%)",
      }}
    >
      <a
        className={cx(classes.link, {
          [classes.linkActive]: chat.id === activeChatId,
        })}
        href="#"
        onClick={(event) => {
          event.preventDefault();
          router.push(`/chat/${chat.id}`);
          if (isSmall) {
            setNavOpened(false);
          }
        }}
      >
        <Box>
          <Text size="xs" weight={500} color="dimmed" truncate>
            {chat.title || "Untitled"}
          </Text>
        </Box>
      </a>
      {chat.id === activeChatId && (
        <>
          <Tooltip label={t("Delete")} withArrow position="right">
            <a
              href="#"
              onClick={(event) => {
                event.preventDefault();
                deleteChat(chat.id);
                router.push("/");
              }}
              style={{
                position: "absolute",
                right: -5,
              }}
            >
              <ActionIcon
                variant="default"
                size={18}
                sx={{
                  boxShadow: `8px 0 16px 20px ${
                    theme.colorScheme === "dark"
                      ? theme.colors.dark[7]
                      : "white"
                  }`,
                }}
              >
                <IconTrash size={px("0.8rem")} stroke={1.5} />
              </ActionIcon>
            </a>
          </Tooltip>
          <Tooltip label={t("Edit")} withArrow position="right">
            <a
              href="#"
              onClick={(event) => {
                event.preventDefault();
                openTitleModal();
                if (isSmall) setNavOpened(false);
                setEditedTitle(chat.title!);
                setTimeout(() => {
                  editTitleInputRef.current?.select();
                }, 100);
              }}
              style={{
                position: "absolute",
                right: 15,
              }}
            >
              <ActionIcon variant="default" size={18}>
                <IconEdit size={px("0.8rem")} stroke={1.5} />
              </ActionIcon>
            </a>
          </Tooltip>
        </>
      )}
    </Group>
  ));

  links.reverse();

  const submitEditedTitle = () => {
    if (editedTitle.trim()) {
      updateChat({ id: activeChatId, title: editedTitle });
    }
    closeTitleModal();
  };
  const editTitleInputRef = useRef<HTMLInputElement>(null);

  return (
    <Navbar
      height={"100%"}
      p="md"
      hiddenBreakpoint="sm"
      hidden={!navOpened}
      width={{ sm: 200, lg: 250 }}
      sx={{ zIndex: 1001 }}
    >
      <MediaQuery smallerThan="sm" styles={{ display: "none" }}>
        <Navbar.Section className={classes.header}>
          <a
            href="#"
            className={classes.link}
            onClick={(event) => {
              event.preventDefault();
              router.push("/");
            }}
          >
            <IconPlus className={classes.linkIcon} stroke={1.5} />
            <span>{t("New Chat")}</span>
            <MediaQuery largerThan="sm" styles={{ display: "none" }}>
              <Burger
                opened={navOpened}
                onClick={() => setNavOpened(!navOpened)}
                size="sm"
                color={theme.colors.gray[6]}
                mr="xl"
              />
            </MediaQuery>
          </a>
        </Navbar.Section>
      </MediaQuery>

      <MediaQuery smallerThan="sm" styles={{ marginTop: rem(36) }}>
        <Navbar.Section
          grow
          mx="-xs"
          px="xs"
          className={classes.scrollbar}
          style={{
            overflowX: "hidden",
            overflowY: "scroll",
          }}
        >
          {links}
        </Navbar.Section>
      </MediaQuery>
      <Navbar.Section className={classes.footer}>
        {links?.length > 0 && (
          <ClearChatsButton
            classes={classes}
            clearHandler={() => {
              clearChats();
              router.push("/");
            }}
          />
        )}

        <a
          href="#"
          className={classes.link}
          onClick={() => toggleColorScheme()}
        >
          <Icon className={classes.linkIcon} stroke={1.5} />
          <span>
            {colorScheme === "light" ? t("Dark theme") : t("Light theme")}
          </span>
        </a>

        <Modal opened={openedKeyModal} onClose={closeKeyModal} title="API Keys">
          <KeyModal close={closeKeyModal} />
        </Modal>

        <a
          href="#"
          className={classes.link}
          onClick={(event) => {
            event.preventDefault();
            openedSettingsModal && closeSettingsModal();
            openKeyModal();
            if (isSmall) setNavOpened(false);
          }}
        >
          <IconKey className={classes.linkIcon} stroke={1.5} />
          <span>{t("API Keys")}</span>
        </a>

        <Modal
          opened={openedSettingsModal}
          onClose={closeSettingsModal}
          title="Settings"
        >
          <SettingsModal close={closeSettingsModal} />
        </Modal>

        <a
          href="#"
          className={classes.link}
          onClick={(event) => {
            event.preventDefault();
            openedKeyModal && closeKeyModal();
            openSettingsModal();

            if (isSmall) setNavOpened(false);
          }}
        >
          <IconSettings className={classes.linkIcon} stroke={1.5} />
          <span>{t("Settings")}</span>
        </a>
      </Navbar.Section>
      <Modal
        opened={openedTitleModal}
        onClose={closeTitleModal}
        title="Set Chat Title"
      >
        <TextInput
          ref={editTitleInputRef}
          type="text"
          value={editedTitle}
          onChange={(e) => setEditedTitle(e.target.value)}
          rightSection={
            <ActionIcon onClick={() => submitEditedTitle()}>
              <IconArrowRight size={px("1.2rem")} stroke={1.5} />
            </ActionIcon>
          }
          onKeyPress={(event) => {
            if (event.key === "Enter") {
              submitEditedTitle();
            }
          }}
        />
      </Modal>
    </Navbar>
  );
}
