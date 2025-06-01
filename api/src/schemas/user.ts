// https://orm.drizzle.team/docs/column-types/pg
import { relations } from 'drizzle-orm'
import { integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
	userId: integer('user_id').primaryKey(),
	name: text('name'),
	email: text('email', { length: 256 }).notNull()
})

export const userRelations = relations(users, ({ one, many }) => ({
	profile: one(profiles, {
		fields: [users.userId],
		references: [profiles.userId]
	}),
	posts: many(posts)
}))

export const posts = sqliteTable('posts', {
	postId: integer('post_id').primaryKey(),
	title: text('title', { length: 256 }).notNull(),
	body: text('body').notNull(),
	slug: text('title', { length: 40 }),
	userId: integer('user_id')
		.notNull()
		.references(() => users.userId)
})

export const postRelations = relations(posts, ({ one, many }) => ({
	author: one(users, {
		fields: [posts.userId],
		references: [users.userId]
	}),
	postCategories: many(categoriesPosts)
}))

export const categories = sqliteTable('categories', {
	categoryId: integer('category_id').primaryKey(),
	category: text('category', { length: 40 }).notNull()
})

export const categoryRelations = relations(categories, ({ many }) => ({
	categoryPosts: many(categoriesPosts)
}))

export const categoriesPosts = sqliteTable(
	'categories_posts',
	{
		categoryId: integer('category_id')
			.notNull()
			.references(() => categories.categoryId),
		postId: integer('post_id')
			.notNull()
			.references(() => posts.postId)
	},
	(table) => ({
		pk: primaryKey({ columns: [table.postId, table.categoryId] })
	})
)

export const categoriesPostsRelations = relations(categoriesPosts, ({ one }) => ({
	postCategories: one(categories, {
		fields: [categoriesPosts.categoryId],
		references: [categories.categoryId]
	}),
	categoryPosts: one(posts, {
		fields: [categoriesPosts.postId],
		references: [posts.postId]
	})
}))

export const profiles = sqliteTable('profiles', {
	profileId: integer('id').primaryKey(),
	bio: text('bio', { length: 256 }),
	userId: integer('user_id')
		.notNull()
		.references(() => users.userId)
})

export type User = typeof users.$inferSelect // return type when queried
export type NewUser = typeof users.$inferInsert // insert type

export type Posts = typeof posts.$inferSelect // return type when queried
export type NewPost = typeof posts.$inferInsert // insert type
