import { Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, ViewChild } from "@angular/core";
import { INITIAL_USERS, ROLES, STATUS_TONE, type User } from "../data";
import { eventValue, toast } from "../lib";

type ValueEl = HTMLElement & { value: string };
type DialogEl = HTMLElement & { open: boolean };

@Component({
  selector: "app-users",
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <fluid-card>
      <div slot="header" class="table-toolbar">
        <fluid-typeahead
          placeholder="Search users…"
          aria-label="Search users"
          style="max-width: 18rem"
          (fluid-input)="onSearch($event)"
        ></fluid-typeahead>
        <fluid-button (click)="setOpen(true)">
          <fluid-icon slot="prefix" name="plus"></fluid-icon>
          Add user
        </fluid-button>
      </div>
      <table class="table">
        <thead>
          <tr>
            <th>User</th>
            <th>Role</th>
            <th>Status</th>
            <th class="row-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          @for (u of shown(); track u.id) {
            <tr>
              <td>
                <div class="user-cell">
                  <fluid-avatar size="sm" [attr.label]="u.name"></fluid-avatar>
                  <div>
                    <div class="user-name">{{ u.name }}</div>
                    <div class="muted">{{ u.email }}</div>
                  </div>
                </div>
              </td>
              <td>
                <fluid-tag>{{ u.role }}</fluid-tag>
              </td>
              <td>
                <fluid-badge [attr.variant]="statusTone[u.status]">{{ u.status }}</fluid-badge>
              </td>
              <td class="row-actions">
                <fluid-button size="sm" variant="ghost" (click)="toggle(u)">
                  {{ u.status === "suspended" ? "Reactivate" : "Suspend" }}
                </fluid-button>
                <fluid-button size="sm" variant="ghost" tone="danger" (click)="remove(u)">
                  Remove
                </fluid-button>
              </td>
            </tr>
          } @empty {
            <tr>
              <td colspan="4" class="empty">No users match “{{ query }}”.</td>
            </tr>
          }
        </tbody>
      </table>
    </fluid-card>

    <fluid-dialog #dialog label="Add user">
      <div class="form-grid">
        <label>
          Name <fluid-input #nameInput placeholder="Jane Doe"></fluid-input>
        </label>
        <label>
          Email <fluid-input #emailInput type="email" placeholder="jane@fluid.dev"></fluid-input>
        </label>
        <label>
          Role
          <fluid-select #roleSelect value="Editor">
            @for (r of roles; track r) {
              <fluid-option [attr.value]="r">{{ r }}</fluid-option>
            }
          </fluid-select>
        </label>
      </div>
      <div slot="footer" class="dialog-actions">
        <fluid-button variant="ghost" (click)="setOpen(false)">Cancel</fluid-button>
        <fluid-button (click)="save()">Add user</fluid-button>
      </div>
    </fluid-dialog>
  `
})
export class UsersComponent {
  readonly roles = ROLES;
  readonly statusTone = STATUS_TONE;

  users: User[] = [...INITIAL_USERS];
  query = "";

  @ViewChild("dialog") dialog!: ElementRef<DialogEl>;
  @ViewChild("nameInput") nameInput!: ElementRef<ValueEl>;
  @ViewChild("emailInput") emailInput!: ElementRef<ValueEl>;
  @ViewChild("roleSelect") roleSelect!: ElementRef<ValueEl>;

  shown(): User[] {
    const q = this.query.trim().toLowerCase();
    return q
      ? this.users.filter((u) => (u.name + u.email + u.role).toLowerCase().includes(q))
      : this.users;
  }

  onSearch(e: Event): void {
    this.query = eventValue(e);
  }

  setOpen(open: boolean): void {
    if (this.dialog) this.dialog.nativeElement.open = open;
  }

  toggle(u: User): void {
    const next: User["status"] = u.status === "suspended" ? "active" : "suspended";
    this.users = this.users.map((x) => (x.id === u.id ? { ...x, status: next } : x));
    toast(`${u.name} is now ${next}.`, next === "active" ? "success" : "warning");
  }

  remove(u: User): void {
    this.users = this.users.filter((x) => x.id !== u.id);
    toast(`Removed ${u.name}.`, "neutral");
  }

  save(): void {
    const name = this.nameInput?.nativeElement.value.trim() ?? "";
    const email = this.emailInput?.nativeElement.value.trim() ?? "";
    const role = this.roleSelect?.nativeElement.value ?? "Editor";
    if (!name || !email) {
      toast("Name and email are required.", "danger");
      return;
    }
    this.users = [{ id: Date.now(), name, email, role, status: "invited" }, ...this.users];
    if (this.nameInput) this.nameInput.nativeElement.value = "";
    if (this.emailInput) this.emailInput.nativeElement.value = "";
    this.setOpen(false);
    toast(`Invited ${name}.`, "success");
  }
}
