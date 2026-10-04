// Seals the provider's tokens before they're stored (docs/auth.md, "Tokens at rest"). AES-GCM
// with a key derived from the session secret for one purpose; each value is bound to its place
// (additional data), so a sealed value copied to another row or column won't open.
// No imports, so unit tests load it directly.

const FORMAT = 'v1'
const encoder = new TextEncoder()
const decoder = new TextDecoder()

export interface Sealer {
	seal(plain: string, place: string): Promise<string>
	open(sealed: string, place: string): Promise<string>
}

// `previous` opens values sealed before the secret was rotated; nothing new is sealed with it.
export async function sealer(purpose: string, secret: string, previous?: string): Promise<Sealer> {
	const key = await deriveKey(secret, purpose)
	const keys = previous ? [key, await deriveKey(previous, purpose)] : [key]
	return {
		async seal(plain, place) {
			const iv = crypto.getRandomValues(new Uint8Array(12))
			const sealed = await crypto.subtle.encrypt(
				{ name: 'AES-GCM', iv, additionalData: encoder.encode(place) },
				key,
				encoder.encode(plain),
			)
			return [FORMAT, toBase64url(iv), toBase64url(new Uint8Array(sealed))].join('.')
		},
		async open(sealed, place) {
			const [format, iv, data, extra] = sealed.split('.')
			if (format !== FORMAT || !iv || !data || extra !== undefined)
				throw new Error('Not a sealed value')
			for (const each of keys) {
				try {
					const plain = await crypto.subtle.decrypt(
						{
							name: 'AES-GCM',
							iv: fromBase64url(iv),
							additionalData: encoder.encode(place),
						},
						each,
						fromBase64url(data),
					)
					return decoder.decode(plain)
				} catch {
					// Not this key, or not this place: try the next key.
				}
			}
			throw new Error("A sealed value didn't open")
		},
	}
}

// HKDF gives each purpose its own key from the one secret (as Zitadel's login app does).
async function deriveKey(secret: string, purpose: string) {
	const material = await crypto.subtle.importKey('raw', encoder.encode(secret), 'HKDF', false, [
		'deriveKey',
	])
	return crypto.subtle.deriveKey(
		{ name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(), info: encoder.encode(purpose) },
		material,
		{ name: 'AES-GCM', length: 256 },
		false,
		['encrypt', 'decrypt'],
	)
}

const toBase64url = (bytes: Uint8Array) =>
	btoa(String.fromCharCode(...bytes))
		.replaceAll('+', '-')
		.replaceAll('/', '_')
		.replace(/=+$/, '')

const fromBase64url = (text: string) =>
	Uint8Array.from(atob(text.replaceAll('-', '+').replaceAll('_', '/')), (c) => c.charCodeAt(0))
