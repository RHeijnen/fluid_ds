"use client";
import { useMemo, useRef, useState } from "react";
import { INITIAL_USERS, ROLES, STATUS_TONE, type User } from "../../src/data";
import { toast, useFluidEvent } from "../../src/lib";

type ValueEl = HTMLElement & { value: string };

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [query, setQuery] = useState("");
  const dialogRef = useRef<HTMLElement & { open: boolean }>(null);
  const nameRef = useRef<ValueEl>(null);
  const emailRef = useRef<ValueEl>(null);
  const roleRef = useRef<ValueEl>(null);

  const searchRef = useFluidEvent<HTMLElement>("fluid-input", (e) =>
    setQuery(String((e.detail as { value?: string })?.value ?? ""))
  );

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? users.filter((u) => (u.name + u.email + u.role).toLowerCase().includes(q)) : users;
  }, [users, query]);

  const setOpen = (open: boolean) => {
    if (dialogRef.current) dialogRef.current.open = open;
  };

  const toggle = (u: User) => {
    const next = u.status === "suspended" ? "active" : "suspended";
    setUsers((list) => list.map((x) => (x.id === u.id ? { ...x, status: next } : x)));
    toast(`${u.name} is now ${next}.`, next === "active" ? "success" : "warning");
  };

  const remove = (u: User) => {
    setUsers((list) => list.filter((x) => x.id !== u.id));
    toast(`Removed ${u.name}.`, "neutral");
  };

  const save = () => {
    const name = nameRef.current?.value.trim() ?? "";
    const email = emailRef.current?.value.trim() ?? "";
    const role = roleRef.current?.value ?? "Editor";
    if (!name || !email) {
      toast("Name and email are required.", "danger");
      return;
    }
    setUsers((list) => [{ id: Date.now(), name, email, role, status: "invited" }, ...list]);
    if (nameRef.current) nameRef.current.value = "";
    if (emailRef.current) emailRef.current.value = "";
    setOpen(false);
    toast(`Invited ${name}.`, "success");
  };

  return (
    <>
      <fluid-card>
        <div slot="header" className="table-toolbar">
          <fluid-typeahead
            ref={searchRef}
            placeholder="Search users…"
            aria-label="Search users"
            style={{ maxWidth: "18rem" }}
          />
          <fluid-button onClick={() => setOpen(true)}>
            <fluid-icon slot="prefix" name="plus" />
            Add user
          </fluid-button>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Status</th>
              <th className="row-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {shown.length ? (
              shown.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="user-cell">
                      <fluid-avatar size="sm" label={u.name} />
                      <div>
                        <div className="user-name">{u.name}</div>
                        <div className="muted">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <fluid-tag>{u.role}</fluid-tag>
                  </td>
                  <td>
                    <fluid-badge variant={STATUS_TONE[u.status]}>{u.status}</fluid-badge>
                  </td>
                  <td className="row-actions">
                    <fluid-button size="sm" variant="ghost" onClick={() => toggle(u)}>
                      {u.status === "suspended" ? "Reactivate" : "Suspend"}
                    </fluid-button>
                    <fluid-button size="sm" variant="ghost" tone="danger" onClick={() => remove(u)}>
                      Remove
                    </fluid-button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="empty">
                  No users match “{query}”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </fluid-card>

      <fluid-dialog ref={dialogRef} label="Add user">
        <div className="form-grid">
          <label>
            Name <fluid-input ref={nameRef} placeholder="Jane Doe" />
          </label>
          <label>
            Email <fluid-input ref={emailRef} type="email" placeholder="jane@fluid.dev" />
          </label>
          <label>
            Role
            <fluid-select ref={roleRef} value="Editor">
              {ROLES.map((r) => (
                <fluid-option key={r} value={r}>
                  {r}
                </fluid-option>
              ))}
            </fluid-select>
          </label>
        </div>
        <div slot="footer" className="dialog-actions">
          <fluid-button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </fluid-button>
          <fluid-button onClick={save}>Add user</fluid-button>
        </div>
      </fluid-dialog>
    </>
  );
}
