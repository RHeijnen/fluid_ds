import type { ReactiveController, ReactiveControllerHost } from "lit";

/** Preserve authored disabled state while an ancestor fieldset owns the effective state. */
export class FormDisabledController implements ReactiveController {
  private read?: () => boolean;
  private write?: (disabled: boolean) => void;
  private owner?: {
    authored: boolean;
    observer: MutationObserver;
    write: (disabled: boolean) => void;
  };

  constructor(private readonly host: ReactiveControllerHost & HTMLElement) {
    host.addController(this);
  }

  preserve(disabled: boolean, read: () => boolean, write: (disabled: boolean) => void): void {
    this.read = read;
    this.write = write;
    if (!disabled) {
      this.release();
      return;
    }
    if (this.owner) return;
    const owners = this.disabledFieldsetOwners();
    // A true callback caused solely by the element's own authored `disabled`
    // attribute has no fieldset ownership to preserve.
    if (!owners.length) return;
    const observer = new MutationObserver(() => {
      if (!this.disabledFieldsetOwners().length) this.release();
    });
    this.owner = { authored: read(), observer, write };
    for (const owner of owners)
      observer.observe(owner, { attributes: true, attributeFilter: ["disabled"] });
    write(true);
  }

  hostConnected(): void {
    if (this.read && this.write && this.disabledFieldsetOwners().length) {
      this.preserve(true, this.read, this.write);
    }
  }

  hostDisconnected(): void {
    this.release();
  }

  private disabledFieldsetOwners(): HTMLFieldSetElement[] {
    const owners: HTMLFieldSetElement[] = [];
    let current = this.host.parentElement;
    while (current) {
      if (current instanceof HTMLFieldSetElement && current.disabled) owners.push(current);
      current = current.parentElement;
    }
    return owners;
  }

  private release(): void {
    const owner = this.owner;
    if (!owner) return;
    this.owner = undefined;
    owner.observer.disconnect();
    owner.write(owner.authored);
  }
}
