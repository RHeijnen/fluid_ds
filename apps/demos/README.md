# @fluid-ds/demos

End-to-end demos showcasing Fluid in real-feeling shapes. Each one is a
separate static HTML entry, drop in a browser, view the components in
context, switch brands (the picker in the header covers all five presets)
to see theming flow.

| Demo                   | URL                             | What it shows                                                                                            |
| ---------------------- | ------------------------------- | -------------------------------------------------------------------------------------------------------- |
| **Settings dashboard** | [`/settings/`](./settings/)     | SaaS settings page: profile, notifications, billing chart, form fields                                   |
| **Admin / data**       | [`/admin/`](./admin/)           | Table + filter bar + bulk actions + confirm dialogs                                                      |
| **Data table**         | [`/data-table/`](./data-table/) | The infinite table: windowed rows, infinite loading, sorting, filters, column manager, persistent layout |
| **Analytics**          | [`/analytics/`](./analytics/)   | Chart gallery: line, bar, donut, sparklines, live KPI tiles                                              |
| **Booking**            | [`/booking/`](./booking/)       | Scheduler-driven appointment flow with confirm dialog + toasts                                           |
| **Sprint board**       | [`/board/`](./board/)           | Kanban with drag-and-drop, `fluid-move` activity feed                                                    |
| **QR studio**          | [`/qr/`](./qr/)                 | QR generator: segmented modes, live options, download                                                    |

The index page also links the four framework portals (native JS, React,
Next.js SSR, Angular), which live in their own apps
(`apps/admin-native`, `apps/admin-react`, `apps/admin-next`,
`apps/admin-angular`) and are folded in under `/demos/<framework>/` by the
unified website build.

Run:

```bash
pnpm dev
# opens http://localhost:5174
```
