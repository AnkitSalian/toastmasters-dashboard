import ExcelJS from "exceljs";

export interface ExcelColumn<T> {
  header: string;
  key: keyof T;
  width?: number;
}

export async function exportToExcel<T extends object>({
  fileName,
  sheetName,
  columns,
  rows,
  rowFill,
}: {
  fileName: string;
  sheetName: string;
  columns: ExcelColumn<T>[];
  rows: T[];
  rowFill?: (row: T) => string | undefined; // ARGB hex, e.g. "FFEAB308"
}) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);

  sheet.columns = columns.map((c) => ({
    header: c.header,
    key: c.key as string,
    width: c.width ?? 18,
  }));

  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1E293B" },
  };

  rows.forEach((row) => {
    const excelRow = sheet.addRow(row as Record<string, unknown>);
    const fill = rowFill?.(row);
    if (fill) {
      excelRow.eachCell((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fill } };
      });
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName.endsWith(".xlsx") ? fileName : `${fileName}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
