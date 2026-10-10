import { PATHWAY_NAMES, type Member } from "@/lib/types";

/** Parses CSV text into rows of cells, honoring double-quoted fields (with "" as an escaped quote). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(cell);
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += c;
    }
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

// Credential codes are a two-letter pathway abbreviation + level number, e.g. "DL5" = Dynamic
// Leadership, Level 5. "DTM" (Distinguished Toastmaster) and blank credentials don't decode.
const PATHWAY_CODE_MAP: Record<string, (typeof PATHWAY_NAMES)[number]> = {
  DL: "Dynamic Leadership",
  EC: "Effective Coaching",
  EH: "Engaging Humor",
  IP: "Innovative Planning",
  LD: "Leadership Development",
  MS: "Motivational Strategies",
  PI: "Persuasive Influence",
  PM: "Presentation Mastery",
  SR: "Strategic Relationships",
  TC: "Team Collaboration",
  VC: "Visionary Communication",
};

export function decodeCredential(credential: string): { pathway: string; level: string } | null {
  const match = credential.trim().toUpperCase().match(/^([A-Z]{2})(\d)$/);
  if (!match) return null;
  const pathway = PATHWAY_CODE_MAP[match[1]];
  if (!pathway) return null;
  return { pathway, level: `Level ${match[2]}` };
}

/** Converts an "M/D/YYYY" (or similar JS-parseable) date string to local "YYYY-MM-DD". */
function toISODate(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function cleanClubRole(position: string): string {
  const trimmed = position.trim();
  if (!trimmed) return "Member";
  return trimmed.replace(/^Club\s+/i, "");
}

export interface ClubMembershipImportRow {
  source: Record<string, string>;
  member: Omit<Member, "id">;
  decodedPathway: { pathway: string; level: string } | null;
}

/**
 * Maps a Toastmasters "Club Membership" export (as downloaded from Club Central) into our
 * Member shape. Column order isn't assumed — cells are looked up by header name — so a
 * re-export with reordered/extra columns still works.
 */
export function parseClubMembershipCsv(text: string): ClubMembershipImportRow[] {
  const rows = parseCsv(text);
  if (rows.length === 0) return [];
  const header = rows[0].map((h) => h.trim());
  const idx = (name: string) => header.indexOf(name);

  const iName = idx("Name");
  const iCredentials = idx("Credentials");
  const iEmail = idx("Email");
  const iMobile = idx("Mobile Phone");
  const iHome = idx("Home Phone");
  const iAdditional = idx("Additional Phone");
  const iPaidUntil = idx("Paid Until");
  const iMemberSince = idx("Member of Club Since");
  const iStatus = idx("Status (*)");
  const iPosition = idx("Current Position");

  return rows.slice(1).map((cells) => {
    const get = (i: number) => (i >= 0 ? (cells[i] ?? "").trim() : "");
    const source: Record<string, string> = {};
    header.forEach((h, i) => (source[h] = cells[i] ?? ""));

    const name = get(iName);
    const phone = get(iMobile) || get(iHome) || get(iAdditional);
    const status = get(iStatus);
    const decoded = iCredentials >= 0 ? decodeCredential(get(iCredentials)) : null;

    const member: Omit<Member, "id"> = {
      name,
      pathways: decoded ? [decoded.pathway] : [],
      membershipActive: status === "PaidMember",
      clubRole: cleanClubRole(get(iPosition)),
      joinDate: toISODate(get(iMemberSince)),
      membershipExpiry: toISODate(get(iPaidUntil)),
      email: get(iEmail),
      phone: phone.replace(/\s+/g, ""),
    };

    return { source, member, decodedPathway: decoded };
  }).filter((r) => r.member.name);
}
