import { NextRequest, NextResponse } from "next/server";
import { createClientForServer } from "@/utils/supabase/server";
import { fetchAllRows } from "@/utils/data/fetch-all";
import { parseYear } from "@/utils/data/items";
import { validateAndTypeItem, type TypedItem } from "@/types/shared";
import { itemsToCSV, generateCSVFilename } from "@/utils/export/csv";
import { createJSONDownload, generateJSONFilename } from "@/utils/export/json";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClientForServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get("format") || "json";
    const year = searchParams.get("year");

    if (!["csv", "json"].includes(format)) {
      return NextResponse.json(
        { error: "Invalid format. Use 'csv' or 'json'" },
        { status: 400 },
      );
    }

    const yearNum = year ? parseYear(year) : null;
    if (year && yearNum === null) {
      return NextResponse.json(
        { error: "Invalid year parameter" },
        { status: 400 },
      );
    }

    let rawItems: unknown[];
    try {
      rawItems = await fetchAllRows((from, to) => {
        let query = supabase.from("items").select("*");
        if (yearNum !== null) query = query.eq("belongs_to_year", yearNum);
        return query
          .order("created_at", { ascending: true })
          .order("id")
          .range(from, to);
      });
    } catch (error) {
      console.error("Database error exporting items:", error);
      return NextResponse.json(
        { error: "Failed to fetch items for export" },
        { status: 500 },
      );
    }

    const validatedItems: TypedItem[] = rawItems
      .map(validateAndTypeItem)
      .filter((item): item is TypedItem => item !== null);

    if (validatedItems.length !== rawItems.length) {
      console.warn(
        `${rawItems.length - validatedItems.length} invalid items filtered out during export`,
      );
    }

    if (format === "csv") {
      const csvData = itemsToCSV(validatedItems);
      const filename = generateCSVFilename(
        yearNum !== null ? `whatpm-${yearNum}` : "whatpm-export",
      );

      return new NextResponse(csvData, {
        status: 200,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    } else {
      const jsonData = createJSONDownload(validatedItems);
      const filename = generateJSONFilename(
        yearNum !== null ? `whatpm-${yearNum}` : "whatpm-export",
      );

      return new NextResponse(jsonData, {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }
  } catch (unexpectedError) {
    console.error("Unexpected error in export API:", unexpectedError);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
