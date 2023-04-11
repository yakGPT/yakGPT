import React, { useState, MouseEvent } from "react";
import { IconCheck, IconTrash } from "@tabler/icons-react";
import { useTranslation } from "next-i18next";

interface Props {
  clearHandler: () => void;
  classes: {
    link: string;
    linkIcon: string;
  };
}

const ClearChatsButton: React.FC<Props> = ({ clearHandler, classes }) => {
  const [awaitingConfirmation, setAwaitingConfirmation] =
    useState<boolean>(false);

  const { t } = useTranslation("nav");

  const clickHandler = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();

    if (awaitingConfirmation) {
      clearHandler();
      setAwaitingConfirmation(false);
    } else {
      setAwaitingConfirmation(true);
    }
  };

  const cancelConfirmation = () => {
    setAwaitingConfirmation(false);
  };

  return (
    <a
      href="#"
      className={classes.link}
      onClick={clickHandler}
      onBlur={cancelConfirmation}
    >
      {awaitingConfirmation ? (
        <>
          <IconCheck className={classes.linkIcon} stroke={1.5} />
          <span>{t("Confirm Clear Chats")}</span>
        </>
      ) : (
        <>
          <IconTrash className={classes.linkIcon} stroke={1.5} />
          <span>{t("Clear Chats")}</span>
        </>
      )}
    </a>
  );
};

export default ClearChatsButton;
