import {
  EmailChangeRequest,
  SignupUser,
  SignupUserDeletion,
} from "@knodia/signup-models";

import type {
  DeletedSignupUserSQL,
  EmailChangeRequestSQL,
  NewDeletedSignupUser,
  NewEmailChangeRequest,
  NewSignupUser,
  SignupUserSQL,
} from "../signupUser.ts";

export function toDeletedSignupUserSQL(
  deletion: SignupUserDeletion,
): NewDeletedSignupUser {
  return {
    deletedAt: deletion.deletedAt,
    signupUserId: deletion.signupUserId,
  };
}

export function toEmailChangeRequest(
  sql: EmailChangeRequestSQL,
): EmailChangeRequest {
  return EmailChangeRequest.parse({
    createdAt: sql.createdAt,
    email: sql.email,
    emailChangeRequestId: sql.emailChangeRequestId,
    signupUserId: sql.signupUserId,
  });
}

export function toEmailChangeRequestSQL(
  emailChangeRequest: EmailChangeRequest,
): NewEmailChangeRequest {
  return {
    createdAt: emailChangeRequest.createdAt,
    email: emailChangeRequest.email,
    emailChangeRequestId: emailChangeRequest.emailChangeRequestId,
    signupUserId: emailChangeRequest.signupUserId,
  };
}

export function toSignupUser(sql: SignupUserSQL): SignupUser {
  return SignupUser.parse({
    createdAt: sql.createdAt,
    dateOfBirth: sql.dateOfBirth,
    email: sql.email,
    familyName: sql.familyName,
    fiscalNumber: sql.fiscalNumber ?? undefined,
    generatedEntities: {
      Lynx: {
        organizationName: sql.lynxOrganizationName,
        userName: sql.lynxUserName,
      },
      Orion: {
        organizationName: sql.orionOrganizationName,
        userName: sql.orionUserName,
      },
    },
    name: sql.name,
    personIdentifier: sql.personIdentifier ?? undefined,
    signupUserId: sql.signupUserId,
    spidCode: sql.spidCode ?? undefined,
    status: sql.status,
    suspendedAt: sql.suspendedAt ?? undefined,
    suspensionReason: sql.suspensionReason ?? undefined,
    updatedAt: sql.updatedAt,
  });
}

export function toSignupUserDeletion(
  sql: DeletedSignupUserSQL,
): SignupUserDeletion {
  return SignupUserDeletion.parse({
    deletedAt: sql.deletedAt,
    signupUserId: sql.signupUserId,
  });
}

export function toSignupUserSQL(user: SignupUser): NewSignupUser {
  return {
    createdAt: user.createdAt,
    dateOfBirth: user.dateOfBirth,
    email: user.email,
    familyName: user.familyName,
    fiscalNumber: user.fiscalNumber,
    lynxOrganizationName: user.generatedEntities.Lynx.organizationName,
    lynxUserName: user.generatedEntities.Lynx.userName,
    name: user.name,
    orionOrganizationName: user.generatedEntities.Orion.organizationName,
    orionUserName: user.generatedEntities.Orion.userName,
    personIdentifier: user.personIdentifier,
    signupUserId: user.signupUserId,
    spidCode: user.spidCode,
    status: user.status,
    suspendedAt: user.suspendedAt,
    suspensionReason: user.suspensionReason,
    updatedAt: user.updatedAt,
  };
}
