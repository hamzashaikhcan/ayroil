import { auth } from "@/auth";
import { generateProductCopy } from "@/lib/ai";

export async function GET() {
  const session = await auth();
  if (!session) return Response.json({ error: "unauthorized" }, { status: 401 });
  const result = await generateProductCopy({
    name: "Ayroil Nourishing Hair Oil - Pack of 3",
    shortDescription:
      "Three bottles of Ayroil Nourishing Hair Oil designed for regular use on dry, dull, and frizzy hair.",
    images: [
      "https://res.cloudinary.com/dm2cefx8m/image/upload/v1782073326/products/cdlcxy53k3docwcvp7yu.png",
      "https://res.cloudinary.com/dm2cefx8m/image/upload/v1782073328/products/xa1eaefbeti3jrt3fais.png",
    ],
  });
  return Response.json(result);
}
