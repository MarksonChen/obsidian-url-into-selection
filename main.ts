import { MarkdownView, Plugin } from "obsidian";
import * as CodeMirror from "codemirror";
import { PluginSettings, UrlIntoSelectionSettingsTab, DEFAULT_SETTINGS, NothingSelected } from "setting";

interface WordBoundaries {
  start: { line: number; ch: number };
  end: { line: number; ch: number };
}

export default class UrlIntoSelection extends Plugin {
  settings: PluginSettings;

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new UrlIntoSelectionSettingsTab(this.app, this));
    this.addCommand({
      id: "paste-url-into-selection",
      name: "",
      callback: async () => {
        const editor = this.getEditor();
        const clipboardText = await navigator.clipboard.readText();
        this.urlIntoSelection(
          editor,
          clipboardText,
          this.settings.nothingSelected === NothingSelected.autoSelect
        );
      },
    });

    this.registerCodeMirror((cm: CodeMirror.Editor) => {
      cm.on("paste", (cm, e) =>
        this.urlIntoSelection(
          cm,
          e,
          this.settings.nothingSelected === NothingSelected.autoSelect
        )
      );
    });
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  private getEditor(): CodeMirror.Editor {
    let activeLeaf = this.app.workspace.activeLeaf;
    if (activeLeaf.view instanceof MarkdownView) {
      return activeLeaf.view.sourceMode.cmEditor;
    } else throw new Error("activeLeaf.view not MarkdownView");
  }

  private isUrl(text: string): boolean {
    let urlRegex = new RegExp(this.settings.regex);
    return urlRegex.test(text);
  }

  /**
   * @param cm CodeMirror Instance
   * @param cbString text on clipboard
   */
  private urlIntoSelection(
    cm: CodeMirror.Editor,
    cbString: string,
    autoselect: boolean
  ): void;
  /**
   * @param cm CodeMirror Instance
   * @param cbEvent clipboard event
   */
  private urlIntoSelection(
    cm: CodeMirror.Editor,
    cbEvent: ClipboardEvent,
    autoselect: boolean
  ): void;
  private urlIntoSelection(
    cm: CodeMirror.Editor,
    cb: string | ClipboardEvent,
    autoselect: boolean
  ): void {
    let selectedText: string | null = null;
    let word: WordBoundaries | null = null;

    if (cm.somethingSelected()) {
      selectedText = cm.getSelection().trim();
    } else if (autoselect) {
      word = getWordBoundaries(cm);
      selectedText = cm.getRange(word.start, word.end);
    }

    const clipboardText = (typeof cb === "string"
      ? cb
      : cb.clipboardData.getData("text")
    ).trim();

    if (selectedText) {
      if (this.isUrl(clipboardText)) {
        // disable default copy behavior
        if (typeof cb !== "string") cb.preventDefault();
        replace(cm, `[${selectedText}](${clipboardText})`, word);
      } else if (this.isUrl(selectedText)) {
        // disable default copy behavior
        if (typeof cb !== "string") cb.preventDefault();
        replace(cm, `[${clipboardText}](${selectedText})`, word);
      }
    }
  }
}

function getWordBoundaries(editor: CodeMirror.Editor): WordBoundaries {
  const cursor = editor.getCursor();

  let wordBoundaries: WordBoundaries;
  if (editor.getTokenTypeAt(cursor) === "url") {
    const { start: startCh, end: endCh } = editor.getTokenAt(cursor);
    const line = cursor.line;
    wordBoundaries = { start: { line, ch: startCh }, end: { line, ch: endCh } };
  } else {
    const { anchor: start, head: end } = editor.findWordAt(cursor);
    wordBoundaries = { start, end };
  }
  return wordBoundaries;
}

function replace(
  cm: CodeMirror.Editor,
  replaceText: string,
  word?: WordBoundaries
): void {
  if (word && word.start && word.end)
    cm.replaceRange(replaceText, word.start, word.end);
  // if word is null or undefined
  else cm.replaceSelection(replaceText);
}
