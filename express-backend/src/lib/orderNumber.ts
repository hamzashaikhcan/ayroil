const PREFIX = "PO";
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function newOrderNumber(): string {
  let body = "";
  for (let i = 0; i < 8; i++) {
    body += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return `${PREFIX}-${body}`;
}
