import {
  createStyles,
  Image,
  Container,
  Title,
  Button,
  Group,
  Text,
  List,
  ThemeIcon,
  rem,
  Modal,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconBrandGithub, IconCheck } from "@tabler/icons-react";
import KeyModal from "./KeyModal";
import { useTranslation } from "next-i18next";

const useStyles = createStyles((theme) => ({
  inner: {
    display: "flex",
    justifyContent: "space-between",
    paddingTop: `calc(${theme.spacing.xl} * 4)`,
    paddingBottom: `calc(${theme.spacing.xl} * 4)`,
  },

  content: {
    maxWidth: rem(480),
    marginRight: `calc(${theme.spacing.xl} * 3)`,

    [theme.fn.smallerThan("md")]: {
      maxWidth: "100%",
      marginRight: 0,
    },
  },

  title: {
    color: theme.colorScheme === "dark" ? theme.white : theme.black,
    fontFamily: `Greycliff CF, ${theme.fontFamily}`,
    fontSize: rem(44),
    lineHeight: 1.2,
    fontWeight: 900,

    [theme.fn.smallerThan("xs")]: {
      fontSize: rem(28),
    },
  },

  control: {
    [theme.fn.smallerThan("xs")]: {
      flex: 1,
    },
  },

  image: {
    flex: 1,

    [theme.fn.smallerThan("md")]: {
      display: "none",
    },
  },

  highlight: {
    position: "relative",
    backgroundColor: theme.fn.variant({
      variant: "light",
      color: theme.primaryColor,
    }).background,
    borderRadius: theme.radius.sm,
    padding: `${rem(4)} ${rem(12)}`,
  },
}));

export default function Hero() {
  const { classes } = useStyles();
  const [opened, { open, close }] = useDisclosure(false);

  const { t } = useTranslation("hero");

  return (
    <div>
      <Container>
        <div className={classes.inner}>
          <div className={classes.content}>
            <Title className={classes.title}>
              <span className={classes.highlight}>YakGPT</span>
            </Title>
            <Text color="dimmed" mt="md">
              {t("A simple, locally running ChatGPT UI.")}
            </Text>

            <List
              mt={30}
              spacing="sm"
              size="sm"
              icon={
                <ThemeIcon size={20} radius="xl">
                  <IconCheck size={rem(12)} stroke={1.5} />
                </ThemeIcon>
              }
            >
              <List.Item>
                <b>{t("Run locally on browser")}</b> –{" "}
                {t("no need to install any applications")}
              </List.Item>
              <List.Item>
                <b>{t("Faster than the official UI")}</b> –{" "}
                {t("connect directly to the API")}
              </List.Item>
              <List.Item>
                <b>{t("Easy mic integration")}</b> – {t("no more typing!")}
              </List.Item>
              <List.Item>
                <b>{t("Use your own API key")}</b> –{" "}
                {t("ensure your data privacy and security")}
              </List.Item>
            </List>

            <Group mt={30}>
              <Button
                radius="xl"
                size="md"
                className={classes.control}
                onClick={open}
              >
                {t("Enter API Key")}
              </Button>
              <Button
                component="a"
                href="https://github.com/yakGPT/yakGPT"
                variant="default"
                radius="xl"
                size="md"
                className={classes.control}
                leftIcon={<IconBrandGithub size={20} />}
              >
                {t("Source Code")}
              </Button>
            </Group>
          </div>
        </div>
        <Modal opened={opened} onClose={close} title="API Key">
          <KeyModal close={close} />
        </Modal>
      </Container>
    </div>
  );
}
