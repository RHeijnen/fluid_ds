/** Wrapper props are explicitly mapped by @lit/react. */
export function eventProp(eventName) {
  return `on${eventName
    .split("-")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join("")}`;
}

/** React 19 native custom-element listeners preserve case and punctuation. */
export function nativeEventTypes(events) {
  return events
    .map((event) => {
      const name = typeof event === "string" ? event : event.name;
      const type = typeof event === "string" ? "CustomEvent<unknown>" : event.type.text;
      return `${JSON.stringify(`on${name}`)}?: (event: ${type}) => void;`;
    })
    .join(" ");
}
