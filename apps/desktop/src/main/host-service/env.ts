import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
	server: {
		AUTH_TOKEN: z.string().min(1),
		SUPERSET_API_URL: z.string().url(),
		HOST_DB_PATH: z.string().min(1),
		HOST_MIGRATIONS_FOLDER: z.string().min(1),
		HOST_SERVICE_SECRET: z.string().min(1),
		HOST_SERVICE_PORT: z.coerce.number().int().positive(),
		ORGANIZATION_ID: z.string().min(1),
		DESKTOP_VITE_PORT: z.coerce.number().int().positive(),
		RELAY_URL: z.string().url().optional(),
		// Local-only alpha: the coordinator sets LOCAL_MODE="1" so the
		// host-service skips every cloud call and runs SQLite-only.
		LOCAL_MODE: z
			.enum(["0", "1"])
			.default("0")
			.transform((v) => v === "1"),
	},
	runtimeEnv: process.env,
	emptyStringAsUndefined: true,
});
