/**
 * Data export API endpoint
 * Supports both CSV and JSON export formats with authentication
 */

import { NextRequest, NextResponse } from "next/server";
import { createClientForServer } from "@/utils/supabase/server";
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

    let query = supabase
      .from("items")
      .select("*")
      .order("created_at", { ascending: true });

    if (year) {
      const yearNum = parseInt(year);
      if (isNaN(yearNum)) {
        return NextResponse.json(
          { error: "Invalid year parameter" },
          { status: 400 },
        );
      }
      query = query.eq("belongs_to_year", yearNum);
    }

    const { data: rawItems, error } = await query;

    if (error) {
      console.error("Database error exporting items:", error);
      return NextResponse.json(
        { error: "Failed to fetch items for export" },
        { status: 500 },
      );
    }

    const validatedItems: TypedItem[] = (rawItems || [])
      .map(validateAndTypeItem)
      .filter((item): item is TypedItem => item !== null);

    if (rawItems && validatedItems.length !== rawItems.length) {
      console.warn(
        `${rawItems.length - validatedItems.length} invalid items filtered out during export`,
      );
    }

    if (format === "csv") {
      const csvData = itemsToCSV(validatedItems);
      const filename = generateCSVFilename(
        year ? `whatpm-${year}` : "whatpm-export",
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
        year ? `whatpm-${year}` : "whatpm-export",
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
