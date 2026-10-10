import ExcelJS from "exceljs";
import { MEETING_TYPES, type Meeting, type MeetingType } from "@/lib/types";
import { MEETING_COLUMNS, MEETING_WINNER_COLUMNS } from "@/lib/meetingColumns";

const TEMPLATE_COLUMNS: { key: string; header: string }[] = [
  { key: "date", header: "Date" },
  { key: "meetingTime", header: "Time" },
  { key: "meetingType", header: "Meeting Type" },
  ...MEETING_COLUMNS.map((c) => ({ key: c.key as string, header: c.header })),
  ...MEETING_WINNER_COLUMNS.map((c) => ({ key: c.key as string, header: c.header })),
];

/** Downloads a blank .xlsx with just the column headers Meeting Tracker import expects. */
export async function downloadMeetingTemplate() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Meetings");
  sheet.columns = TEMPLATE_COLUMNS.map((c) => ({ header: c.header, key: c.key, width: 18 }));

  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "meeting-tracker-template.xlsx";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function formatLocalISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function cellText(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return formatLocalISO(value);
  if (typeof value === "object") {
    const v = value as unknown as Record<string, unknown>;
    if (typeof v.text === "string") return v.text;
    if (Array.isArray(v.richText)) return (v.richText as { text: string }[]).map((r) => r.text).join("");
    if ("result" in v) return cellText(v.result as ExcelJS.CellValue);
  }
  return String(value).trim();
}

function parseDateFlexible(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) return formatLocalISO(parsed);
  return trimmed;
}

function splitNames(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export interface MeetingImportRow {
  meeting: Omit<Meeting, "id">;
  typeDefaulted: boolean;
}

/** Parses an uploaded .xlsx (matching the template's headers, in any column order) into Meeting rows. */
export async function parseMeetingsExcel(file: File): Promise<MeetingImportRow[]> {
  const buffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) return [];

  const headers: string[] = [];
  sheet.getRow(1).eachCell({ includeEmpty: true }, (cell, colNumber) => {
    headers[colNumber - 1] = cellText(cell.value).trim();
  });

  const results: MeetingImportRow[] = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const cells: Record<string, string> = {};
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const header = headers[colNumber - 1];
      if (header) cells[header] = cellText(cell.value);
    });

    const date = parseDateFlexible(cells["Date"] ?? "");
    if (!date) return;

    const rawType = (cells["Meeting Type"] ?? "").trim();
    const matchedType = MEETING_TYPES.find((t) => t.toLowerCase() === rawType.toLowerCase());

    const meeting: Omit<Meeting, "id"> = {
      date,
      meetingTime: (cells["Time"] ?? "").trim(),
      meetingType: (matchedType ?? "Regular Club Meeting") as MeetingType,
      meetingNumber: (cells["Mtg #"] ?? "").trim(),
      speaker1: (cells["Speaker 1"] ?? "").trim(),
      speaker2: (cells["Speaker 2"] ?? "").trim(),
      speaker3: (cells["Speaker 3"] ?? "").trim(),
      evaluator1: (cells["Evaluator 1"] ?? "").trim(),
      evaluator2: (cells["Evaluator 2"] ?? "").trim(),
      evaluator3: (cells["Evaluator 3"] ?? "").trim(),
      tmodName: (cells["TMOD"] ?? "").trim(),
      tmodTheme: (cells["TMOD Theme"] ?? "").trim(),
      ahCounter: (cells["Ah-Counter"] ?? "").trim(),
      grammarian: (cells["Grammarian"] ?? "").trim(),
      timer: (cells["Timer"] ?? "").trim(),
      tableTopicMaster: (cells["Table Topic Master"] ?? "").trim(),
      generalEvaluator: (cells["General Evaluator"] ?? "").trim(),
      bestSpeaker: splitNames(cells["Best Speaker"]),
      bestEvaluator: splitNames(cells["Best Evaluator"]),
      bestOfBig3: splitNames(cells["Best of Big 3"]),
      bestTagPlayer: splitNames(cells["Best TAG Player"]),
    };

    results.push({ meeting, typeDefaulted: !matchedType });
  });

  return results;
}
