import {
  ApplicationRef,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  ViewChild,
  signal
} from "@angular/core";
import { bootstrapApplication } from "@angular/platform-browser";
import type {
  FluidCheckbox,
  FluidCheckboxChangeEvent,
  FluidInput,
  FluidInputChangeEvent,
  FluidInputInputEvent
} from "@fluid-ds/components";

type ContractEvent = { type: string; detail: unknown };

@Component({
  selector: "app-root",
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <fluid-card id="contract-card">
      <h1 id="slot-header" slot="header">Angular packed CSR contract</h1>
      <form id="contract-form" (submit)="onSubmit($event)">
        <fluid-input
          #project
          id="project"
          name="project"
          label="Project name"
          required
          [value]="projectName()"
          (fluid-input)="onInput($event)"
          (fluid-change)="onInputChange($event)"
        >
          <span id="slot-prefix" slot="prefix">Prefix</span>
        </fluid-input>
        <fluid-checkbox
          #approved
          id="approved"
          name="approved"
          value="yes"
          checked
          required
          (fluid-change)="onApproved($event)"
        >
          Approved
        </fluid-checkbox>
        <fluid-button id="save" type="submit">Save project</fluid-button>
        <button id="reset" type="reset">Reset project</button>
      </form>
      <p id="slot-footer" slot="footer">Angular footer</p>
    </fluid-card>
    <output id="contract-output" aria-live="polite">{{ output() }}</output>
  `
})
class ContractComponent {
  @ViewChild("project", { read: ElementRef }) projectRef?: ElementRef<FluidInput>;
  @ViewChild("approved", { read: ElementRef }) approvedRef?: ElementRef<FluidCheckbox>;

  readonly projectName = signal("Angular client consumer");
  readonly output = signal("Not submitted");
  readonly events: ContractEvent[] = [];
  readonly submissions: Array<Array<[string, FormDataEntryValue]>> = [];

  onInput(event: Event): void {
    const fluidEvent = event as FluidInputInputEvent;
    this.projectName.set(fluidEvent.detail.value);
    this.events.push({ type: fluidEvent.type, detail: fluidEvent.detail });
  }

  onInputChange(event: Event): void {
    const fluidEvent = event as FluidInputChangeEvent;
    this.projectName.set(fluidEvent.detail.value);
    this.events.push({ type: fluidEvent.type, detail: fluidEvent.detail });
  }

  onApproved(event: Event): void {
    const fluidEvent = event as FluidCheckboxChangeEvent;
    this.events.push({ type: fluidEvent.type, detail: fluidEvent.detail });
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    const values = [...new FormData(event.currentTarget as HTMLFormElement).entries()];
    this.submissions.push(values);
    this.output.set(JSON.stringify(values));
  }

  references() {
    return {
      input: this.projectRef?.nativeElement.localName,
      checkbox: this.approvedRef?.nativeElement.localName,
      inputMatchesDocument: this.projectRef?.nativeElement === document.querySelector("#project"),
      checkboxMatchesDocument:
        this.approvedRef?.nativeElement === document.querySelector("#approved")
    };
  }
}

const tags = ["fluid-button", "fluid-card", "fluid-checkbox", "fluid-input"] as const;

bootstrapApplication(ContractComponent)
  .then((application: ApplicationRef) => {
    const instance = application.components[0]?.instance as ContractComponent | undefined;
    if (!instance) throw new Error("Angular contract component did not bootstrap");
    const contractWindow = window as Window & { angularFluid?: Record<string, unknown> };
    contractWindow.angularFluid = {
      ready: true,
      registered: false,
      registrationError: null,
      definitionsBeforeRegistration: Object.fromEntries(
        tags.map((tag) => [tag, customElements.get(tag) !== undefined])
      ),
      events: instance.events,
      submissions: instance.submissions,
      references: () => instance.references(),
      async setProject(value: string) {
        instance.projectName.set(value);
        application.tick();
        await instance.projectRef?.nativeElement.updateComplete;
      },
      async setLabel(value: string) {
        const input = instance.projectRef?.nativeElement;
        if (!input) throw new Error("Angular input ref is unavailable");
        input.label = value;
        await input.updateComplete;
      },
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
          Object.assign(contractWindow.angularFluid!, { registered: true });
        } catch (error) {
          Object.assign(contractWindow.angularFluid!, {
            registrationError: String(error instanceof Error ? error.stack : error)
          });
          throw error;
        }
      }
    };
  })
  .catch((error: unknown) => console.error(error));
