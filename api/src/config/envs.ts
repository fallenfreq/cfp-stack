import { z } from 'zod'

// Custom Zod validator for D1Database
const d1DatabaseSchema = z.custom<D1Database>(
  (value) => typeof value === 'object' && value !== null && 'prepare' in value,
  { message: 'Invalid D1Database instance' }
)

// Define the schema using zod
const envSchema = z.object({
  ZITADEL_CLIENT_ID: z.string(),
  ZITADEL_CLIENT_SECRET: z.string(),
  ZITADEL_INTROSPECTION_ENDPOINT: z.string(),
  SMTP_OUT_SERVER: z.string(),
  SMTP_OUT_PORT_TLS: z.string(),
  SMTP_PASSWORD: z.string(),
  DB: d1DatabaseSchema
})

// Infer the type from the schema
type Envs = z.infer<typeof envSchema>
let validatedEnv: Envs | null = null

// Function to initialize and validate environment variables
function initEnvs(envs: any) {
  validatedEnv = envSchema.parse(envs)
}

// Function to retrieve a specific environment variable
function getEnv(key: keyof Envs) {
  if (!validatedEnv) {
    throw new Error('Environment variables have not been initialised')
  }
  return validatedEnv[key]
}

// Optionally, you can expose all validated environment variables
function getAllEnvs() {
  if (!validatedEnv) {
    throw new Error('Environment variables have not been initialised')
  }
  return validatedEnv
}

export { initEnvs, getEnv, getAllEnvs, type Envs }
