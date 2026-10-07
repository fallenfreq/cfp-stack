// A slug names a page or a collection in its addresses (a collection's /c/<slug>, a page's
// /preview/<slug>): letters and numbers in any alphabet, each with its accents and other marks,
// and hyphens. The api makes one from a name and checks each one it's sent; the client checks
// one typed in before sending it.

// What shows nothing: the selector that makes ❤ an emoji (❤️), joiners, a Hangul filler.
const invisible = /\p{Default_Ignorable_Code_Point}/gu
// Accents and other marks with no letter or number to sit on.
const loneMarks = /(?<![\p{L}\p{M}\p{N}])\p{M}+/gu
const between = /[^\p{L}\p{M}\p{N}]+/gu
const slug = /^(?!.*\p{Default_Ignorable_Code_Point})(?:[\p{L}\p{N}]\p{M}*|-)+$/u

// The characters a slug may hold, each mark on a letter or number and nothing invisible. Its
// case is slugCase's, which whatever takes a slug in applies first.
export function isSlug(text) {
	return slug.test(text)
}

// A slug's case, for one made from a name and one sent in alike, so an address in capitals finds
// its page: lowercased, without the dot İ leaves on its i (İstanbul makes istanbul), in Unicode's
// composed form (NFC) so a name typed either way makes the same slug. The marks are put in their
// standard order (NFD) first, so the dot is found wherever it sits among the i's marks, and the
// same text always comes out.
export function slugCase(text) {
	return text
		.toLowerCase()
		.normalize('NFD')
		.replace(/(?<=i\p{M}*)\u0307/gu, '')
		.normalize('NFC')
}

// A name as a slug: what shows nothing, and marks on nothing, dropped; whatever else isn't a
// letter or a number made one hyphen, none at either end; then slugCase. Its case comes after the
// hyphens, as an address's does, so both agree on a Greek final sigma. Empty when the name has no
// letter or number.
export function slugify(name) {
	return slugCase(
		name
			.normalize('NFC')
			.replace(invisible, '')
			.replace(loneMarks, '')
			.replace(between, '-')
			.replace(/^-|-$/g, ''),
	)
}
