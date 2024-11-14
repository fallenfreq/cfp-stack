// https://orm.drizzle.team/docs/column-types/pg
import { integer, text, sqliteTable, primaryKey } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'

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
  postCatagories: many(catagoriesPosts)
}))

export const catagories = sqliteTable('catagories', {
  catagoryId: integer('catagory_id').primaryKey(),
  catagory: text('catagory', { length: 40 }).notNull()
})

export const catagoryRelations = relations(catagories, ({ many }) => ({
  catagoryPosts: many(catagoriesPosts)
}))

export const catagoriesPosts = sqliteTable(
  'catagories_posts',
  {
    catagoryId: integer('catagory_id')
      .notNull()
      .references(() => catagories.catagoryId),
    postId: integer('post_id')
      .notNull()
      .references(() => posts.postId)
  },
  (table) => ({
    pk: primaryKey({ columns: [table.postId, table.catagoryId] })
  })
)

export const catagoriesPostsRelations = relations(catagoriesPosts, ({ one }) => ({
  postCatagories: one(catagories, {
    fields: [catagoriesPosts.catagoryId],
    references: [catagories.catagoryId]
  }),
  catagoryPosts: one(posts, {
    fields: [catagoriesPosts.postId],
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
