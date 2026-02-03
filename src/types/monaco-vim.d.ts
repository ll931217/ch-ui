declare module "monaco-vim" {
  import type { editor } from "monaco-editor";

  export interface VimModeInstance {
    dispose: () => void;
  }

  export function initVimMode(
    editor: editor.IStandaloneCodeEditor,
    statusBar: HTMLElement
  ): VimModeInstance;

  export const VimMode: {
    Vim: {
      defineEx: (name: string, prefix: string, callback: () => void) => void;
      defineOperator: (name: string, callback: (cm: any, args: any, ranges: any) => void) => void;
      defineAction: (name: string, callback: (cm: any, args: any) => void) => void;
      mapCommand: (keys: string, type: string, name: string, args?: Record<string, any>) => void;
      map: (lhs: string, rhs: string, context?: string) => void;
      getVim: (cm: any) => any;
    };
  };
}
