import { PrismaClient } from "@prisma/client";
import prisma from "../lib/prisma";
import { Claims, getSession } from "@auth0/nextjs-auth0";

// BEFORE adding auth stuff we only needed Prisma

export type Context = {
  user?: Claims;
  accessToken?: string;
  prisma: PrismaClient;
};

// create a context so that the resolvers have access
// to the Prisma Client and be able send queries to the database

export async function createContext({ req, res }): Promise<Context> {
  const session = getSession(req, res);

  // if the user is not logged in, omit returning the user and accessToken
  if (!session) return { prisma };

  const { user, accessToken } = session;
  return {
    user,
    accessToken,
    prisma,
  };
}

// The getSession() function from Auth0 returns information about the logged-in
// user and the access token.This data is then included in the GraphQL context.
// Your queries and mutations can now access the authentication state.
