// src/pages/api/games.json.ts
import { db } from "../../lib/firebase-admin.js";

export async function GET() {
  try {
    const snap = await db.collection("publicRooms").get();

    console.log("Docs count:", snap.docs.length);

    const games = snap.docs.map((doc) => {
      const data = doc.data();

      return {
        slug: doc.id,
        questionsCount: data.gamePlan?.[0]?.questions?.length || 0,
        category: data.gamePlan?.[0]?.category || "general",
      };
    });

    return new Response(JSON.stringify(games), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("API ERROR:", err);

    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500 }
    );
  }
}