// import type { WithMetadata } from "@knodia/db-readmodel-commons/models";

// import { type Agreement, AgreementState } from "@knodia/agreement-models";
// import { unsafeBrandId } from "@knodia/common-models/ids";

// import type { AgreementSQL } from "../agreement.ts";

// export const toAgreement = (
//   agreementSQL: AgreementSQL,
// ): WithMetadata<Agreement> => ({
//   data: {
//     consumerId: unsafeBrandId(agreementSQL.consumerId),
//     createdAt: new Date(agreementSQL.createdAt),
//     eserviceId: unsafeBrandId(agreementSQL.eserviceId),
//     eserviceVersionId: unsafeBrandId(agreementSQL.eserviceVersionId),
//     id: unsafeBrandId(agreementSQL.id),
//     producerId: unsafeBrandId(agreementSQL.producerId),
//     state: AgreementState.parse(agreementSQL.state),
//     updatedAt: new Date(agreementSQL.updatedAt),
//   },
//   metadata: {
//     version: agreementSQL.metadataVersion,
//   },
// });
