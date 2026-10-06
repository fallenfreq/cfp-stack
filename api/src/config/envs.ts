import { z } from 'zod'

const d1DatabaseSchema = z.custom<D1Database>(
	(value) => typeof value === 'object' && value !== null && 'prepare' in value,
	{ error: 'Invalid D1Database instance' },
)

const envSchema = z.object({
	GOOGLE_MAPS_API_KEY: z.string(),
	DB: d1DatabaseSchema,
})

type Envs = z.infer<typeof envSchema>
let validatedEnv: Envs | null = null

function initEnvs(envs: any) {
	validatedEnv = envSchema.parse(envs)
}

function getEnv<Key extends keyof Envs>(key: Key): Envs[Key] {
	if (!validatedEnv) {
		throw new Error('Environment variables have not been initialized')
	}
	return validatedEnv[key]
}

export { getEnv, initEnvs, type Envs }
