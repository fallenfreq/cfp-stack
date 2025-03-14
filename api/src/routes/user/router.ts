import { publicProcedure, router } from '../../config/trpc.js'
import { users, posts, profiles, categories, categoriesPosts } from '../../schemas/user.js'
import { z } from 'zod'
import { eq } from 'drizzle-orm'

const postValidator = z.object({
  title: z.string(),
  body: z.string(),
  slug: z.string()
})

const profileValidator = z.object({
  bio: z.string()
})

const userValidator = z.object({
  name: z.union([z.string(), z.null()]),
  email: z.string().email('This is not a valid email.'),
  posts: postValidator.optional(),
  profile: profileValidator.optional()
  // profile: z.object({ create: profileValidator }).optional()
})

// using this on posts because zod can not distinguish between
// undefined and the property not being there at all
// const data = {
//   ...(sentPosts && { posts: sentPosts }),
//   ...(sentProfile && { profile: sentProfile }),
//   ...rest
// }

const userRouter = router({
  insert: publicProcedure.input(userValidator).mutation(async ({ input, ctx: { db } }) => {
    const { profile: sentProfile, posts: sentPosts, ...userData } = input

    const newUser = await db
      .insert(users)
      .values(userData)
      .returning({ user_id: users.userId, name: users.name })

    if (!newUser[0]) throw 'did not return a user id'

    const newUserId = newUser[0].user_id

    if (sentProfile)
      await db
        .insert(profiles)
        .values({
          userId: newUserId,
          ...sentProfile
        })
        .execute()

    if (sentPosts)
      await db
        .insert(posts)
        .values({
          userId: newUserId,
          ...sentPosts
        })
        .execute()

    // -------------- finding

    const allUsersQ = db.query.users.findMany({
      with: {
        posts: true,
        profile: true
      }
    })

    const allUsersSQL = await db
      .select()
      .from(users)
      .innerJoin(profiles, eq(users.userId, profiles.userId))
      .leftJoin(posts, eq(users.userId, posts.userId))

    const userSQL = await db.select().from(users).where(eq(users.userId, newUserId))

    const userQ = await db.query.users.findFirst({
      where: eq(users.userId, newUserId)
    })

    console.dir({ userSQL, userQ, allUsersQ, allUsersSQL, newUser }, { depth: null })

    return 'echo back: ' + input
  }),

  select: publicProcedure
    .input(z.object({ user_id: z.string() }))
    .query(async ({ input: { user_id }, ctx: { db } }) => {
      // with lets you select relations set in schemas
      // columns selects which own columns
      const postsJunctionSQL = await db.query.posts.findFirst({
        with: {
          author: true,
          postCategories: {
            columns: {
              postId: false,
              categoryId: false
            },
            with: {
              postCategories: {
                columns: {
                  categoryId: true,
                  category: true
                }
              }
            }
          }
        }
      })

      const postsJunctionQ = await db
        .select()
        .from(posts)
        .innerJoin(categoriesPosts, eq(posts.postId, categoriesPosts.postId))
        .innerJoin(categories, eq(categoriesPosts.categoryId, categories.categoryId))

      console.log({ postsJunctionSQL, postsJunctionQ })

      return await db
        .select()
        .from(users)
        .where(eq(users.userId, Number(user_id)))
    })
})

export { userRouter }
