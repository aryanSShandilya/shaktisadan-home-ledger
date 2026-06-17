import server from "../src/server";

export const config = { runtime: "edge" } as const;

export default async function handler(request: Request, env: unknown, ctx: unknown) {
	try {
		// Ensure imported server has a fetch method
		const fetchFn = (server as any)?.fetch;
		if (!fetchFn || typeof fetchFn !== "function") {
			console.error("server.fetch is not a function", server);
			return new Response("Internal Server Error", { status: 500 });
		}

		return await fetchFn.call(server, request, env, ctx);
	} catch (error) {
		// Log and return a controlled 500 response to avoid function crash
		try {
			console.error("Edge handler caught error:", error);
		} catch (_) {
			// ignore logging failure
		}
		return new Response("Internal Server Error", { status: 500 });
	}
}
