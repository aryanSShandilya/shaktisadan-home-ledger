import server from "../src/server";

export const config = { runtime: "edge" } as const;

export default async function handler(request: Request, env: unknown, ctx: unknown) {
	// Delegate to the server entry's fetch handler
	// `server` is the default export from `src/server.ts` (object with `fetch`)
	// Call and return its response so Vercel Edge can handle requests.
	// @ts-ignore - server has a `fetch` method at runtime
	return await server.fetch(request, env, ctx);
}
