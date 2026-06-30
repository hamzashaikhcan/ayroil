import { fetchUsers } from "@/lib/server-api";
import { StatusPill } from "@/components/ui/status-pill";
import { PageHeader } from "@/components/ui/page-header";

export default async function CustomersPage() {
  const users = await fetchUsers();
  return (
    <div className="space-y-5">
      <PageHeader title="Customers" subtitle={`${users.length} accounts`} />

      <div className="card table-card-shell">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm table-cards">
            <thead className="border-b border-line bg-surface-2 text-xs font-medium uppercase tracking-wider text-muted">
              <tr>
                <th className="px-5 py-2.5 font-medium">Email</th>
                <th className="px-5 py-2.5 font-medium">Name</th>
                <th className="px-5 py-2.5 font-medium">Role</th>
                <th className="px-5 py-2.5 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-16 text-center text-muted">No customers yet.</td></tr>
              ) : users.map((u) => (
                <tr key={u.id} className="border-b border-line last:border-b-0 row-hover">
                  <td className="px-5 py-3" data-label="Email">
                    <div className="flex items-center gap-2.5">
                      <span className="inline-flex h-7 w-7 flex-none items-center justify-center rounded-full bg-accent-soft text-xs font-semibold uppercase text-accent-deep">
                        {u.email.charAt(0)}
                      </span>
                      <span className="font-medium text-ink">{u.email}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-ink" data-label="Name">{u.name ?? "—"}</td>
                  <td className="px-5 py-3" data-label="Role"><StatusPill value={u.role} /></td>
                  <td className="px-5 py-3 text-muted tabular-nums" data-label="Joined">{new Date(u.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
