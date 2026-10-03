// Domain errors — thrown by domain functions, translated to tRPC errors
// at the route boundary (domainErrors in config/trpc.ts). Domain stays decoupled from tRPC.

export class DomainError extends Error {
	constructor(message: string) {
		super(message)
		this.name = new.target.name
	}
}

export class ValidationError extends DomainError {}
export class NotFoundError extends DomainError {}
export class ConflictError extends DomainError {}
