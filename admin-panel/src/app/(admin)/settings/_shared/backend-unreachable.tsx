export function BackendUnreachable() {
  return (
    <div className="card p-10 text-center">
      <div className="text-sm font-medium text-ink">Backend unreachable</div>
      <p className="mt-2 text-sm text-muted">
        Could not load /settings — make sure the express-backend is running.
      </p>
    </div>
  );
}
