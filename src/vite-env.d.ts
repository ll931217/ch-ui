/// <reference types="vite/client" />

declare const __CH_UI_VERSION__: string;

// Vite worker import support
declare module "*?worker" {
  const workerConstructor: new () => Worker;
  export default workerConstructor;
}

declare global {
  interface Window {
    MonacoEnvironment?: {
      getWorker?: () => Worker;
      getWorkerUrl?: (moduleId: string, label: string) => string;
    };
  }
}