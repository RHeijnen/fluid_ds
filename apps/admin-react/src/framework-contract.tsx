import { StrictMode, useCallback, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import type {
  FluidInput as InputElement,
  FluidInputInputEvent,
  FluidInputChangeEvent,
  FluidTypeaheadInputEvent,
  FluidTypeaheadChangeDetail,
  TypeaheadOption
} from "@fluid-ds/components";
import { FluidInput } from "@fluid-ds/react/input";
import { FluidButton } from "@fluid-ds/react/button";
import { FluidCard } from "@fluid-ds/react/card";
import { FluidTypeahead } from "@fluid-ds/react/typeahead";
import "@fluid-ds/react/jsx";
import "@fluid-ds/tokens/base.css";
import "@fluid-ds/tokens/light.css";
import "@fluid-ds/tokens/dark.css";
import "@fluid-ds/themes/midnight.css";
import "@fluid-ds/themes/corporate.css";

// This independent entry deliberately does not import register-fluid or App.
// The negative variant proves the browser assertion detects a missing listener.
const omitWrapperListener =
  new URLSearchParams(location.search).get("negative") === "wrapper-event";

function valueFrom(
  event: FluidInputInputEvent | FluidInputChangeEvent | FluidTypeaheadInputEvent
): string {
  if (
    typeof event.detail !== "object" ||
    event.detail === null ||
    typeof event.detail.value !== "string"
  ) {
    throw new Error("Expected a value-bearing Fluid event");
  }
  return event.detail.value;
}

function Contract() {
  const [value, setValue] = useState("");
  const [events, setEvents] = useState<string[]>([]);
  const [changes, setChanges] = useState<string[]>([]);
  const [nativeEvents, setNativeEvents] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState<Record<string, FormDataEntryValue>[]>([]);
  const [mounted, setMounted] = useState(true);
  const [disabled, setDisabled] = useState(false);
  const [revision, setRevision] = useState(0);
  const [refState, setRefState] = useState("empty");
  const [refClears, setRefClears] = useState(0);
  const inputRef = useRef<InputElement | null>(null);
  const receiveRef = useCallback((element: InputElement | null) => {
    inputRef.current = element;
    setRefState(element?.localName ?? "empty");
    if (!element) setRefClears((previous) => previous + 1);
  }, []);
  const [options, setOptions] = useState<TypeaheadOption[]>([
    { value: "nl", label: "Netherlands", data: { region: "EU", revision: 1 } }
  ]);
  const [selection, setSelection] = useState<FluidTypeaheadChangeDetail | null>(null);
  const [queries, setQueries] = useState<string[]>([]);
  const [pressed, setPressed] = useState<boolean[]>([]);
  const [activations, setActivations] = useState<
    { detail: null; cancelable: boolean; defaultPrevented: boolean }[]
  >([]);

  return (
    <main style={{ maxWidth: "40rem", margin: "2rem auto", padding: "1rem" }}>
      <h1>React 19 packed runtime contract</h1>
      <FluidCard id="contract-card">
        <h2 slot="header">Header {revision}</h2>
        <form
          id="contract-form"
          onSubmit={(event) => {
            event.preventDefault();
            const data = Object.fromEntries(new FormData(event.currentTarget));
            setSubmitted((previous) => [...previous, data]);
          }}
          onReset={() => setValue("")}
        >
          {mounted && (
            <FluidInput
              id="wrapped-input"
              ref={receiveRef}
              name="project"
              label="Project"
              required
              value={value}
              disabled={disabled}
              onFluidInput={
                omitWrapperListener
                  ? undefined
                  : (event) => {
                      const next = valueFrom(event);
                      setEvents((previous) => [...previous, next]);
                      setValue(next);
                    }
              }
              onFluidChange={(event) => setChanges((previous) => [...previous, valueFrom(event)])}
            >
              <span slot="prefix">Prefix {revision}</span>
            </FluidInput>
          )}
          <FluidButton type="submit">Submit project</FluidButton>
          <FluidButton type="reset">Reset project</FluidButton>
          <FluidButton
            type="submit"
            onFluidClick={(event) => {
              if (event.detail !== null || !event.cancelable)
                throw new Error("Expected cancelable null-detail button activation");
              event.preventDefault();
              setActivations((previous) => [
                ...previous,
                {
                  detail: event.detail,
                  cancelable: event.cancelable,
                  defaultPrevented: event.defaultPrevented
                }
              ]);
            }}
          >
            Cancel submit
          </FluidButton>
        </form>
        <p slot="footer">Footer {revision}</p>
      </FluidCard>
      <button type="button" onClick={() => inputRef.current?.focus()}>
        Focus ref
      </button>
      <button type="button" onClick={() => setMounted((previous) => !previous)}>
        Toggle field
      </button>
      <button type="button" onClick={() => setDisabled((previous) => !previous)}>
        Toggle disabled
      </button>
      <button type="button" onClick={() => setRevision((previous) => previous + 1)}>
        Rerender children
      </button>
      <button type="button" onClick={() => setValue("External")}>
        Set controlled value
      </button>
      <fluid-input
        id="native-input"
        label="Native JSX"
        onfluid-change={(event) => {
          setNativeEvents((previous) => [...previous, valueFrom(event)]);
        }}
      />
      <FluidTypeahead
        id="object-input"
        label="Country"
        options={options}
        onFluidInput={(event) => setQueries((previous) => [...previous, valueFrom(event)])}
        onFluidChange={(event) => setSelection(event.detail)}
      />
      <button
        type="button"
        onClick={() =>
          setOptions([{ value: "de", label: "Germany", data: { region: "EU", revision: 2 } }])
        }
      >
        Replace options
      </button>
      <FluidButton
        toggle
        onFluidChange={(event) => {
          if (typeof event.detail.pressed !== "boolean")
            throw new Error("Expected boolean button toggle payload");
          setPressed((previous) => [...previous, event.detail.pressed]);
        }}
      >
        Toggle pressed
      </FluidButton>
      <output id="events">{JSON.stringify(events)}</output>
      <output id="changes">{JSON.stringify(changes)}</output>
      <output id="native-events">{JSON.stringify(nativeEvents)}</output>
      <output id="submitted">{JSON.stringify(submitted)}</output>
      <output id="controlled-value">{value}</output>
      <output id="selection">{JSON.stringify(selection)}</output>
      <output id="queries">{JSON.stringify(queries)}</output>
      <output id="pressed">{JSON.stringify(pressed)}</output>
      <output id="activations">{JSON.stringify(activations)}</output>
      <output id="ref-state">{refState}</output>
      <output id="ref-clears">{refClears}</output>
    </main>
  );
}

createRoot(document.getElementById("contract-root")!).render(
  <StrictMode>
    <Contract />
  </StrictMode>
);
