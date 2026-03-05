import { prisma } from "./prisma";

const PUBLIC_USER_EMAIL = process.env.PUBLIC_USER_EMAIL?.trim() || "public@stockdrop.local";
const PUBLIC_USER_NAME = process.env.PUBLIC_USER_NAME?.trim() || "Public User";
const PUBLIC_USER_PASSWORD_HASH =
  process.env.PUBLIC_USER_PASSWORD_HASH?.trim() || "auth-disabled-public-user";

export const getPublicUserId = async () => {
  const user = await prisma.user.upsert({
    where: { email: PUBLIC_USER_EMAIL },
    update: { name: PUBLIC_USER_NAME },
    create: {
      email: PUBLIC_USER_EMAIL,
      name: PUBLIC_USER_NAME,
      passwordHash: PUBLIC_USER_PASSWORD_HASH,
    },
    select: { id: true },
  });

  return user.id;
};
