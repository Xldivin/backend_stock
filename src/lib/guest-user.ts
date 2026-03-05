import { createHash } from "crypto";
import { Request } from "express";
import { AppError } from "./errors";
import { prisma } from "./prisma";

const GUEST_ID_PATTERN = /^[a-zA-Z0-9._:-]+$/;

const getGuestIdFromRequest = (req: Request) => {
  const guestId = req.header("x-guest-id")?.trim();

  if (!guestId) {
    throw new AppError(400, "GUEST_ID_REQUIRED", "Missing X-Guest-Id header");
  }

  if (guestId.length > 128 || !GUEST_ID_PATTERN.test(guestId)) {
    throw new AppError(400, "INVALID_GUEST_ID", "Invalid X-Guest-Id header");
  }

  return guestId;
};

export const getGuestUserId = async (req: Request) => {
  const guestId = getGuestIdFromRequest(req);
  const guestHash = createHash("sha256").update(guestId).digest("hex");
  const email = `guest-${guestHash.slice(0, 24)}@stockdrop.local`;

  const user = await prisma.user.upsert({
    where: { email },
    update: { name: `Guest ${guestHash.slice(0, 8)}` },
    create: {
      email,
      name: `Guest ${guestHash.slice(0, 8)}`,
      passwordHash: `guest:${guestHash}`,
    },
    select: { id: true },
  });

  return user.id;
};
