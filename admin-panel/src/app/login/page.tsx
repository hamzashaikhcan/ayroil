import { LoginForm } from "./login-form";
import { fetchPublicBranding } from "@/lib/public-branding";

export default async function LoginPage() {
  const { siteName, companyName, whiteLogoUrl, darkLogoUrl } = await fetchPublicBranding();
  return (
    <div className="grid min-h-screen grid-cols-1 bg-background md:grid-cols-[1fr_1.1fr]">
      {/* Left panel */}
      <div className="relative hidden overflow-hidden bg-ink p-12 text-background md:flex md:flex-col md:justify-between">
        <div className="absolute inset-0 opacity-[0.08]" aria-hidden>
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 30%, #fff 0px, transparent 1px), radial-gradient(circle at 70% 60%, #fff 0px, transparent 1px)",
              backgroundSize: "32px 32px, 48px 48px",
            }}
          />
        </div>

        <div className="relative flex items-center gap-2.5">
          {whiteLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- need natural width for a logo
            <img
              src={whiteLogoUrl}
              alt={siteName}
              className="h-9 w-auto flex-none object-contain"
              draggable={false}
            />
          ) : (
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-background text-ink">
              <span className="text-sm font-semibold">{siteName.charAt(0)}</span>
            </span>
          )}
          <span className="text-sm font-medium tracking-tight">{siteName}</span>
          <span className="ml-1 rounded-md bg-background/10 px-1.5 py-0.5 text-xs font-medium uppercase tracking-wider text-background/70">
            Admin
          </span>
        </div>

        <div className="relative">
          <h2 className="text-3xl font-semibold leading-[1.1] tracking-tight">
            Run the shop
            <span className="block text-background/60">from one screen.</span>
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-background/70">
            Orders, products, customers, and revenue — all in one console.
            Sign in with your admin email to continue.
          </p>

          <ul className="mt-8 space-y-2.5">
            {[
              "Real-time orders and revenue",
              "Full catalog and inventory control",
              "Customer accounts and addresses",
              "Analytics with custom date ranges",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2.5 text-sm text-background/80">
                <span className="mt-1 inline-block h-1.5 w-1.5 flex-none rounded-full bg-accent" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative text-xs text-background/40">
          © {new Date().getFullYear()} {companyName}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2 md:hidden">
            {darkLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- need natural width for a logo
              <img
                src={darkLogoUrl}
                alt={siteName}
                className="h-8 w-auto flex-none object-contain"
                draggable={false}
              />
            ) : (
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-ink text-background">
                <span className="text-xs font-semibold">{siteName.charAt(0)}</span>
              </span>
            )}
            <span className="text-sm font-medium">{siteName} Admin</span>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Sign in to your account
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            Only admin accounts can sign in here. Need access? Contact your workspace owner.
          </p>

          <div className="mt-7">
            <LoginForm />
          </div>

          <p className="mt-6 text-xs text-muted">
            By signing in, you agree to the workspace&apos;s acceptable-use policy.
          </p>
        </div>
      </div>
    </div>
  );
}
