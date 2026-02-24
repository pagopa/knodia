// import type { Agreement } from "@knodia/agreement-models";
// import type { AgreementId } from "@knodia/common-models/ids";
// import type { WithMetadata } from "@knodia/db-readmodel-commons/models";
// import type { NodePgDatabase } from "drizzle-orm/node-postgres";

// import { eq } from "drizzle-orm";

// import { readmodelAgreement } from "../agreement.ts";
// import { toAgreement } from "../converters/converters.ts";

// export function agreementReadmodelServiceBuilder(readmodelDb: NodePgDatabase) {
//   return {
//     async getAgreementById(
//       agreementId: AgreementId,
//     ): Promise<undefined | WithMetadata<Agreement>> {
//       const queryRes = await readmodelDb
//         .select()
//         .from(readmodelAgreement)
//         .where(eq(readmodelAgreement.id, agreementId));

//       const agreementSQL = queryRes.at(0);

//       return agreementSQL ? toAgreement(agreementSQL) : undefined;
//     },
//   };
// }
