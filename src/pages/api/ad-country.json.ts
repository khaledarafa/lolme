import type { APIRoute } from "astro";

export const GET: APIRoute = ({ request }) => {
  const country = request.headers.get("x-vercel-ip-country") || "XX";

  return new Response(
    JSON.stringify({ country }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    },
  );
};
