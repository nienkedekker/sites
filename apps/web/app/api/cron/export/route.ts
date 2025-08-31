/**
 * Vercel Cron function for automated data export
 * Runs every 3 days to backup your data to R2
 */

import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { createClientForServer } from "@/utils/supabase/server";
import { validateAndTypeItem, type TypedItem } from "@/types/shared";
import { itemsToCSV, generateCSVFilename } from "@/utils/export/csv";
import { createJSONDownload, generateJSONFilename } from "@/utils/export/json";

// Configure R2 client
const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY!,
  },
});

export async function GET(request: NextRequest) {
  try {
    // Verify this is coming from Vercel Cron
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClientForServer();
    const timestamp = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    // Fetch all items (since you're the only user, no user filtering needed)
    const { data: rawItems, error } = await supabase
      .from("items")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Database error fetching items:", error);
      return NextResponse.json(
        { error: "Failed to fetch items" },
        { status: 500 },
      );
    }

    if (!rawItems || rawItems.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No items to export",
        timestamp,
      });
    }

    // Validate and type all items
    const validatedItems: TypedItem[] = rawItems
      .map(validateAndTypeItem)
      .filter((item): item is TypedItem => item !== null);

    if (validatedItems.length !== rawItems.length) {
      console.warn(
        `${rawItems.length - validatedItems.length} invalid items filtered out during export`,
      );
    }

    // Generate export data
    const csvData = itemsToCSV(validatedItems);
    const jsonData = createJSONDownload(validatedItems);

    // Generate filenames
    const csvFilename = generateCSVFilename(`whatpm-backup-${timestamp}`);
    const jsonFilename = generateJSONFilename(`whatpm-backup-${timestamp}`);

    // Upload to R2
    const csvKey = `backups/${timestamp}/${csvFilename}`;
    await r2Client.send(
      new PutObjectCommand({
        Bucket: process.env.CLOUDFLARE_BUCKET_NAME!,
        Key: csvKey,
        Body: csvData,
        ContentType: "text/csv",
      }),
    );

    const jsonKey = `backups/${timestamp}/${jsonFilename}`;
    await r2Client.send(
      new PutObjectCommand({
        Bucket: process.env.CLOUDFLARE_BUCKET_NAME!,
        Key: jsonKey,
        Body: jsonData,
        ContentType: "application/json",
      }),
    );

    return NextResponse.json({
      success: true,
      timestamp,
      itemsExported: validatedItems.length,
      files: {
        csv: csvKey,
        json: jsonKey,
      },
    });
  } catch (error) {
    console.error("Cron export error:", error);
    return NextResponse.json(
      {
        error: "Export failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
