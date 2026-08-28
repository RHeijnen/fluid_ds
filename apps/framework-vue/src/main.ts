import { createApp } from "vue";
import "@fluid-ds/tokens/base.css";
import "@fluid-ds/tokens/light.css";
import App from "./App.vue";

createApp(App).mount("#app");

const tags = ["fluid-button", "fluid-card", "fluid-checkbox", "fluid-input"] as const;
const contractWindow = window as Window & {
  vueFluid?: Record<string, unknown>;
};
if (!contractWindow.vueFluid) throw new Error("Vue contract did not mount synchronously");

Object.assign(contractWindow.vueFluid, {
  ready: true,
  registered: false,
  registrationError: null,
  definitionsBeforeRegistration: Object.fromEntries(
    tags.map((tag) => [tag, customElements.get(tag) !== undefined])
  ),
  async register() {
    try {
      await Promise.all([
        import("@fluid-ds/components/define/button"),
        import("@fluid-ds/components/define/card"),
        import("@fluid-ds/components/define/checkbox"),
        import("@fluid-ds/components/define/input")
      ]);
      await Promise.all(tags.map((tag) => customElements.whenDefined(tag)));
      await Promise.all(
        tags.map((tag) => {
          const element = document.querySelector<
            HTMLElement & { updateComplete?: Promise<boolean> }
          >(tag);
          return element?.updateComplete ?? Promise.resolve(true);
        })
      );
      Object.assign(contractWindow.vueFluid!, { registered: true });
    } catch (error) {
      Object.assign(contractWindow.vueFluid!, {
        registrationError: String(error instanceof Error ? error.stack : error)
      });
      throw error;
    }
  }
});
