import type { Meta, StoryObj } from "@storybook/web-components";
import { expect, userEvent, waitFor } from "@storybook/test";
import { html } from "lit";
import "../../../packages/editor/src/components/rich-text-editor/define.js";
import "../../../packages/kanban/src/components/kanban/define.js";
import type { FluidRichTextEditor } from "../../../packages/editor/src/components/rich-text-editor/fluid-rich-text-editor.js";
import type { FluidKanban } from "../../../packages/kanban/src/components/kanban/fluid-kanban.js";

const meta: Meta = {
  title: "Quality/Editing interaction contracts",
  parameters: { controls: { disable: true }, status: { type: "experimental" } }
};
export default meta;
type Story = StoryObj;

function editorFor(event: Event) {
  return (event.currentTarget as HTMLElement)
    .closest("section")!
    .querySelector<FluidRichTextEditor>("fluid-rich-text-editor")!;
}

const editorFixture = () => html`
  <section>
    <button>Before editor</button>
    <fluid-rich-text-editor label="Project note"></fluid-rich-text-editor>
    <button>After editor</button>
    <button
      @click=${(event: Event) => {
        editorFor(event).readOnly = true;
      }}
    >
      Make readonly
    </button>
    <button
      @click=${(event: Event) => {
        editorFor(event).readOnly = false;
      }}
    >
      Edit note
    </button>
    <button
      @click=${(event: Event) => {
        editorFor(event).value =
          '<p><a href="javascript:alert(1)" onclick="alert(2)">Unsafe link</a><strong>Safe content</strong></p>';
      }}
    >
      Load untrusted HTML
    </button>
    <button
      @click=${(event: Event) => {
        const editor = editorFor(event);
        const parent = editor.parentNode!;
        const next = editor.nextSibling;
        editor.remove();
        parent.insertBefore(editor, next);
      }}
    >
      Reconnect editor
    </button>
  </section>
`;

export const RichTextEditorContract: Story = {
  tags: ["interaction-contract"],
  parameters: { quality: { componentTag: "fluid-rich-text-editor" } },
  render: editorFixture,
  play: async ({ canvasElement }) => {
    const editor = canvasElement.querySelector<FluidRichTextEditor>("fluid-rich-text-editor")!;
    const textbox = editor.shadowRoot!.querySelector<HTMLElement>('[role="textbox"]')!;
    const bold = editor.shadowRoot!.querySelector<HTMLButtonElement>('[aria-label="Bold"]')!;
    const italic = editor.shadowRoot!.querySelector<HTMLButtonElement>('[aria-label="Italic"]')!;
    const controls = [...canvasElement.querySelectorAll<HTMLButtonElement>("section > button")];
    const events: CustomEvent<{ value: string }>[] = [];
    const record = (event: Event) => events.push(event as CustomEvent<{ value: string }>);
    editor.addEventListener("fluid-change", record);
    try {
      bold.focus();
      await userEvent.keyboard("{ArrowRight}");
      await expect(editor.shadowRoot!.activeElement).toBe(italic);
      await userEvent.keyboard("{Home}");
      await expect(editor.shadowRoot!.activeElement).toBe(bold);
      await userEvent.type(textbox, "Hello world");
      await expect(editor.value).toContain("Hello world");
      // Select the actual DOM content. Native keyboard selection is checked
      // independently in editing-interactions.spec.ts.
      textbox.focus();
      const range = document.createRange();
      range.selectNodeContents(textbox);
      const selection = document.getSelection()!;
      selection.removeAllRanges();
      selection.addRange(range);
      const beforeFormatting = events.length;
      // user-event 14 suppresses click after our canceled pointerdown, unlike
      // browser pointer activation. Keep that native case in Playwright and
      // exercise toolbar keyboard activation here without replacing its handler.
      bold.focus();
      await userEvent.keyboard("{Enter}");
      await waitFor(() => expect(textbox.querySelector("b,strong")).not.toBeNull());
      await expect(events.length).toBe(beforeFormatting + 1);
      await expect(events.at(-1)!.detail.value).toBe(editor.value);
      await userEvent.click(
        controls.find((control) => control.textContent?.trim() === "Make readonly")!
      );
      await waitFor(() => expect(textbox.getAttribute("aria-readonly")).toBe("true"));
      await expect(textbox.getAttribute("contenteditable")).toBe("false");
      await expect(
        [...editor.shadowRoot!.querySelectorAll("button")].every((button) => button.disabled)
      ).toBe(true);
      const beforeAssignment = events.length;
      await userEvent.click(
        controls.find((control) => control.textContent?.trim() === "Load untrusted HTML")!
      );
      await waitFor(() => expect(editor.value).toContain("Safe content"));
      await expect(textbox.querySelector("a")!.hasAttribute("href")).toBe(false);
      await expect(textbox.querySelector("a")!.hasAttribute("onclick")).toBe(false);
      await expect(events.length).toBe(beforeAssignment);
      await expect(
        events.every((event) => event.target === editor && event.bubbles && event.composed)
      ).toBe(true);
    } finally {
      editor.removeEventListener("fluid-change", record);
    }
  }
};

const kanbanFixture = () => html`
  <section>
    <button>Before board</button>
    <fluid-kanban
      .columns=${[
        {
          id: "todo",
          title: "To do",
          cards: [
            { id: "alpha", title: "Alpha" },
            { id: "bravo", title: "Bravo" }
          ]
        },
        { id: "doing", title: "In progress", cards: [{ id: "charlie", title: "Charlie" }] },
        { id: "done", title: "Done", cards: [] }
      ]}
    ></fluid-kanban>
    <button>After board</button>
    <button
      @click=${(event: Event) => {
        const board = (event.currentTarget as HTMLElement)
          .closest("section")!
          .querySelector("fluid-kanban")!;
        const parent = board.parentNode!;
        const next = board.nextSibling;
        board.remove();
        parent.insertBefore(board, next);
      }}
    >
      Reconnect board
    </button>
  </section>
`;

export const KanbanMoveContract: Story = {
  tags: ["interaction-contract"],
  parameters: { quality: { componentTag: "fluid-kanban" } },
  render: kanbanFixture,
  play: async ({ canvasElement }) => {
    const board = canvasElement.querySelector<FluidKanban>("fluid-kanban")!;
    const card = () => board.shadowRoot!.querySelector<HTMLElement>('[data-card-id="alpha"]')!;
    const ids = () => board.columns.map((column) => column.cards.map((item) => item.id));
    const events: CustomEvent[] = [];
    const record = (event: Event) => events.push(event as CustomEvent);
    board.addEventListener("fluid-move", record);
    try {
      await userEvent.click(card().querySelector<HTMLButtonElement>('[data-move="next"]')!);
      await waitFor(() => expect(ids()).toEqual([["bravo"], ["alpha", "charlie"], []]));
      await expect(board.shadowRoot!.activeElement).toBe(card());
      await userEvent.keyboard(" {ArrowRight}");
      await waitFor(() => expect(ids()).toEqual([["bravo"], ["charlie"], ["alpha"]]));
      await waitFor(() => expect(board.shadowRoot!.activeElement).toBe(card()));
      await userEvent.keyboard("{Escape}");
      await waitFor(() => expect(ids()).toEqual([["bravo"], ["alpha", "charlie"], []]));
      await expect(card().getAttribute("aria-grabbed")).toBe("false");
      await userEvent.click(card().querySelector<HTMLButtonElement>('[data-move="down"]')!);
      await waitFor(() => expect(ids()).toEqual([["bravo"], ["charlie", "alpha"], []]));
      await expect(events.map((event) => event.detail)).toEqual([
        { cardId: "alpha", fromColumn: "todo", toColumn: "doing", index: 0 },
        { cardId: "alpha", fromColumn: "doing", toColumn: "done", index: 0 },
        { cardId: "alpha", fromColumn: "done", toColumn: "doing", index: 0 },
        { cardId: "alpha", fromColumn: "doing", toColumn: "doing", index: 1 }
      ]);
      await expect(
        events.every((event) => event.target === board && event.bubbles && event.composed)
      ).toBe(true);
      await expect(board.shadowRoot!.querySelector('[role="status"]')!.textContent).toContain(
        "position 2 of 2"
      );
    } finally {
      board.removeEventListener("fluid-move", record);
    }
  }
};

export const EditorKeyboardFixture: Story = { render: editorFixture };
export const KanbanKeyboardFixture: Story = { render: kanbanFixture };
