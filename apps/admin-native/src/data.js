// Mock data for the admin portal. In a real app this is your API; here it's a
// plain module so the demo stays buildless and offline.
export const STATS = [
  { label: "Active users", value: "8,421", delta: "+12%", tone: "success" },
  { label: "MRR", value: "$48.2k", delta: "+4.1%", tone: "success" },
  { label: "Open tickets", value: "37", delta: "-9%", tone: "info" },
  { label: "Churn", value: "1.8%", delta: "+0.3%", tone: "warning" }
];

export const USERS = [
  { id: 1, name: "Ada Lovelace", email: "ada@fluid.dev", role: "Owner", status: "active" },
  { id: 2, name: "Grace Hopper", email: "grace@fluid.dev", role: "Admin", status: "active" },
  { id: 3, name: "Alan Turing", email: "alan@fluid.dev", role: "Editor", status: "invited" },
  { id: 4, name: "Katherine Johnson", email: "kat@fluid.dev", role: "Editor", status: "active" },
  { id: 5, name: "Margaret Hamilton", email: "maggie@fluid.dev", role: "Viewer", status: "suspended" },
  { id: 6, name: "Linus Torvalds", email: "linus@fluid.dev", role: "Admin", status: "active" }
];

export const ROLES = ["Owner", "Admin", "Editor", "Viewer"];

// status value → fluid-tag / fluid-badge variant
export const STATUS_TONE = {
  active: "success",
  invited: "info",
  suspended: "danger"
};
