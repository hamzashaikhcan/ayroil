import Image from "next/image";
import { Container } from "@/components/ui/container";

/**
 * Screenshot-style customer proof (WhatsApp/Instagram DMs etc.), curated
 * once by the admin (Settings → Testimonials) and shown identically on
 * every product detail page — not per-product content.
 */
export function CustomerTestimonials({ images }: { images: string[] }) {
  if (!images.length) return null;

  return (
    <section className="border-t border-line bg-surface py-16">
      <Container>
        <div className="max-w-3xl">
          <div className="font-mono text-xs uppercase tracking-[0.22em] text-muted">
            <span className="marker-dot">Real conversations</span>
          </div>
          <h2 className="font-display mt-4 text-2xl tracking-tight text-ink">
            What customers are sharing with us
          </h2>
        </div>

        <div className="-mx-4 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2">
          {images.map((url, i) => (
            <div
              key={url}
              className="relative aspect-[9/16] w-56 flex-none snap-start overflow-hidden rounded-2xl border border-line bg-background sm:w-64"
            >
              <Image
                src={url}
                alt={`Customer testimonial ${i + 1}`}
                fill
                sizes="(max-width: 640px) 224px, 256px"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
