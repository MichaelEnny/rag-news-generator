import { auth, currentUser } from "@clerk/nextjs/server";

export type AuthenticatedUserSeed = {
  userId: string;
  name: string;
  email: string;
};

export async function requireAuthenticatedUser(): Promise<AuthenticatedUserSeed> {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const user = await currentUser();

  return {
    userId,
    name:
      [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
      user?.username ||
      "AI News Desk User",
    email:
      user?.primaryEmailAddress?.emailAddress ||
      user?.emailAddresses?.[0]?.emailAddress ||
      ""
  };
}
