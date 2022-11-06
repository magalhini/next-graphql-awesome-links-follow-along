import { objectType, extendType, intArg, stringArg, nonNull } from "nexus";
import { User } from "./User";

export const Link = objectType({
  name: "Link",
  definition(t) {
    t.string("id");
    t.string("title");
    t.string("url");
    t.string("description");
    t.string("imageUrl");
    t.string("category");
    t.list.field("users", {
      type: User,
      async resolve(_parent, _args, ctx) {
        return await ctx.prisma.link
          .findUnique({
            where: {
              id: _parent.id,
            },
          })
          .users();
      },
    });
  },
});

// graphql/types/Link.ts
export const CreateLinkMutation = extendType({
  type: "Mutation",
  definition(t) {
    t.nonNull.field("createLink", {
      type: Link,
      args: {
        title: nonNull(stringArg()),
        url: nonNull(stringArg()),
        imageUrl: nonNull(stringArg()),
        category: nonNull(stringArg()),
        description: nonNull(stringArg()),
      },
      async resolve(_parent, args, ctx) {
        if (!ctx.user) {
          throw new Error(`You need to be logged in to perform an action`);
        }

        const user = await ctx.prisma.user.findUnique({
          where: {
            email: ctx.user.email,
          },
        });

        if (user.role !== "ADMIN") {
          throw new Error(`You do not have permission to perform action`);
        }

        const newLink = {
          title: args.title,
          url: args.url,
          imageUrl: args.imageUrl,
          category: args.category,
          description: args.description,
        };

        return await ctx.prisma.link.create({
          data: newLink,
        });
      },
    });
  },
});

export const LinksQuery = extendType({
  type: "Query",
  definition(t) {
    t.field("links", {
      type: "Response",
      args: {
        first: intArg(),
        after: stringArg(),
      },
      async resolve(_, args, ctx) {
        let queryResults = null;

        if (args.after) {
          // check if there is a cursor as an argument
          queryResults = await ctx.prisma.link.findMany({
            take: args.first, // n items to return from DB
            skip: 1, // skip the cursor
            cursor: {
              id: args.after, // the cursor
            },
          });
        } else {
          // no cursor means its the first request
          queryResults = await ctx.prisma.link.findMany({
            take: args.first,
          });
        }

        // if the initial request returns links
        if (queryResults.length > 0) {
          // get last element in previous set
          const lastLinkResults = queryResults[queryResults.length - 1];
          const myCursor = lastLinkResults.id;

          // query after the cursor to check if we have nextPage
          const secondQueryResults = await ctx.prisma.link.findMany({
            take: args.first,
            cursor: {
              id: myCursor,
            },
            // orderBy: {
            //   index: "asc",
            // },
          });

          // return the response
          const result = {
            pageInfo: {
              endCursor: myCursor,
              hasNextPage: secondQueryResults.length >= args.first,
            },
            edges: queryResults.map((link) => ({
              cursor: link.id,
              node: link,
            })),
          };

          return result;
        }

        // No results
        return {
          pageInfo: {
            endCursor: null,
            hasNextPage: false,
          },
          edges: [],
        };
      },
    });
  },
});

// .nonNull specifies that clients will always get a value for this field. In Nexus, all "output types" (types returned by fields) are nullable by default.
// .list specifies that this query will return a list.
// field() is a function that takes two arguments:
// The field's name. In this case, the query is called "links" like the schema you created initially.
// An object that specifies the returned type of the query along with the resolver function. In the resolver function, you are accessing prisma from the context and using the findMany() function to return all links in the Link table of the database.

// Work for pagination which is cursor-based, not offset-based

export const Edge = objectType({
  name: "Edge",
  definition(t) {
    t.string("cursor");
    t.field("node", {
      type: Link,
    });
  },
});

export const PageInfo = objectType({
  name: "PageInfo",
  definition(t) {
    t.string("endCursor");
    t.boolean("hasNextPage");
  },
});

export const Response = objectType({
  name: "Response",
  definition(t) {
    t.field("pageInfo", { type: PageInfo });
    t.list.field("edges", {
      type: Edge,
    });
  },
});
