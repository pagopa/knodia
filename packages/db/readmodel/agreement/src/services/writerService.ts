// import type { Agreement } from "@knodia/agreement-models";
// import type { NodePgDatabase } from "drizzle-orm/node-postgres";

// import { checkMetadataVersion } from "@knodia/db-readmodel-commons/utils";
// import { eq } from "drizzle-orm";

// import { readmodelAgreement } from "../agreement.ts";
// import { toAgreementSQL } from "../converters/splitters.ts";

// export function agreementWriterServiceBuilder(db: NodePgDatabase) {
//   return {
//     async upsertAgreement(
//       agreement: Agreement,
//       metadataVersion: number,
//     ): Promise<void> {
//       return db.transaction(async (tx) => {
//         const shouldUpsert = await checkMetadataVersion(
//           tx,
//           readmodelAgreement,
//           metadataVersion,
//           agreement.id,
//         );

//         if (!shouldUpsert) {
//           return;
//         }

//         await tx
//           .delete(readmodelAgreement)
//           .where(eq(readmodelAgreement.id, agreement.id));

//         const agreementSQL = toAgreementSQL(agreement, metadataVersion);

//         await tx.insert(readmodelAgreement).values(agreementSQL);
//       });
//     },
//   };
// }
