import { prisma } from "../db/prisma";
import { createMerkleCheckpoint } from "../services/auditLog";
import { timestampPendingCheckpoints } from "../services/tsa";

const main = async (): Promise<void> => {
  const checkpoint = await createMerkleCheckpoint(prisma);
  const timestampResult = await timestampPendingCheckpoints(prisma);
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ checkpoint, timestampResult }, null, 2));
};

main()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
