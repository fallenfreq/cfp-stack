import { index, integer, primaryKey, sqliteTable } from 'drizzle-orm/sqlite-core'
import { sitePages } from './page.js'
import { siteTags } from './tag.js'

export const sitePageTags = sqliteTable(
	'site_page_tags',
	{
		pageId: integer('page_id')
			.notNull()
			.references(() => sitePages.pageId, { onDelete: 'cascade' }),
		tagId: integer('tag_id')
			.notNull()
			.references(() => siteTags.tagId, { onDelete: 'cascade' }),
	},
	(t) => ({
		pk: primaryKey({ columns: [t.pageId, t.tagId] }),
		tagIdx: index('page_tags_tag_id_idx').on(t.tagId),
	}),
)

export type SitePageTag = typeof sitePageTags.$inferSelect
export type NewSitePageTag = typeof sitePageTags.$inferInsert
