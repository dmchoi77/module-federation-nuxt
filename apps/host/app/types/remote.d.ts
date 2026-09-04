declare module "remote/Widget" {
  import type { Component } from "vue";
  const component: Component;
  export default component;
}

declare module "remote/Counter" {
  import type { Component } from "vue";
  const component: Component;
  export default component;
}

declare module "remote/bridge/export-app" {
  const createProvider: () => {
    render: (info: Record<string, unknown>) => void | Promise<void>;
    destroy: (info: { dom: HTMLElement }) => void;
  };
  export default createProvider;
}
