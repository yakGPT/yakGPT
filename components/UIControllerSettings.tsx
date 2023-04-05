import { update } from "@/stores/ChatActions";
import { useChatStore } from "@/stores/ChatStore";
import { Button, Menu, px } from "@mantine/core";
import { IconCheck, IconDotsVertical } from "@tabler/icons-react";
import React from "react";

function MenuItem({
  item,
}: {
  item: { text: string; checked: boolean; onClick?: () => void };
}) {
  return (
    <Menu.Item
      onClick={item.onClick}
      icon={
        <IconCheck
          style={{
            visibility: item.checked ? "visible" : "hidden",
          }}
          size={14}
        />
      }
    >
      {item.text}
    </Menu.Item>
  );
}

export default function UIController() {
  const showTextDuringPTT = useChatStore((state) => state.showTextDuringPTT);
  const modelChoiceSTT = useChatStore((state) => state.modelChoiceSTT);
  const autoSendStreamingSTT = useChatStore(
    (state) => state.autoSendStreamingSTT
  );

  const menuStructure = [
    {
      label: "Chat",
      items: [
        { text: "GPT 3.5", checked: true },
        { text: "GPT 4", checked: false },
      ],
    },
    {
      label: "Speech to Text",
      items: [
        {
          text: "Azure",
          checked: modelChoiceSTT === "azure",
          onClick: () => update({ modelChoiceSTT: "azure" }),
        },
        {
          text: "Whisper",
          checked: modelChoiceSTT === "whisper",
          onClick: () => update({ modelChoiceSTT: "whisper" }),
        },
      ],
    },
    {
      label: "Other",
      items: [
        {
          text: "Always show Text input",
          checked: showTextDuringPTT,
          onClick: () => update({ showTextDuringPTT: !showTextDuringPTT }),
        },
        {
          text: "Auto send text",
          checked: autoSendStreamingSTT,
          onClick: () =>
            update({ autoSendStreamingSTT: !autoSendStreamingSTT }),
        },
      ],
    },
  ];

  return (
    <Menu withArrow closeOnItemClick={false}>
      <Menu.Target>
        <Button
          sx={{ height: 36, borderRadius: "0px 8px 0px 0px" }}
          compact
          variant="light"
        >
          <IconDotsVertical size={px("1.1rem")} stroke={1.5} />
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        {menuStructure.map((section) => (
          <React.Fragment key={section.label}>
            <Menu.Label>{section.label}</Menu.Label>
            {section.items.map((item) => (
              <MenuItem key={item.text} item={item} />
            ))}
          </React.Fragment>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
}
