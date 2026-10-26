import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const sites = db.getAllSites();
    const pits = db.getAllPits();
    const workBlocks = db.getAllWorkBlocks();
    const materials = db.getAllMaterials();
    const shifts = db.getAllShifts();
    const users = db.getAllUsers();
    const equipment = db.getAllEquipment();

    return NextResponse.json({
      success: true,
      data: {
        sites,
        pits,
        workBlocks,
        materials,
        shifts,
        users,
        equipment,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
