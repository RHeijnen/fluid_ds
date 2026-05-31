/** Push a toast onto the app's <fluid-toast> stack (imperative method). */
export function toast(message: string, variant = "success"): void {
  const el = document.getElementById("app-toast") as
    | (HTMLElement & { toast?: (o: { message: string; variant: string; duration: number }) => void })
    | null;
  el?.toast?.({ message, variant, duration: 3500 });
}

/** Read `detail.value` off a Fluid custom event (`fluid-change` / `fluid-input`). */
export function eventValue(e: Event): string {
  const detail = (e as CustomEvent<{ value?: string }>).detail;
  return String(detail?.value ?? "");
}
