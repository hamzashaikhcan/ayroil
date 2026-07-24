import { randomInt } from "node:crypto";

const PREFIX = "PO";
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

// The order number doubles as the bearer credential for the public,
// unauthenticated order-detail page (see GET /:number/detail) — it must be
// generated with a CSPRNG, not Math.random(), since it's effectively a
// capability token, not just a display label.
export function newOrderNumber(): string {
  let body = "";
  for (let i = 0; i < 8; i++) {
    body += ALPHABET[randomInt(ALPHABET.length)];
  }
  return `${PREFIX}-${body}`;
}
