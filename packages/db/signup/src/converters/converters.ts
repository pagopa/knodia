import {
  EmailChangeRequest,
  SignupUser,
  SignupUserDeletion,
  SignupUserStatus,
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
    signupUserId: sql.signupUserId,
    spidCode: sql.spidCode ?? undefined,
    status: sql.status,
    termsAcceptedAt: sql.termsAcceptedAt,
    termsAcceptedVersion: sql.termsAcceptedVersion,
    ...(sql.status === SignupUserStatus.enum.Suspended && {
      suspendedAt: sql.suspendedAt,
      suspensionReason: sql.suspensionReason,
    }),
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
    signupUserId: user.signupUserId,
    spidCode: user.spidCode,
    status: user.status,
    termsAcceptedAt: user.termsAcceptedAt,
    termsAcceptedVersion: user.termsAcceptedVersion,
    updatedAt: user.updatedAt,
    ...(user.status === SignupUserStatus.enum.Suspended && {
      suspendedAt: user.suspendedAt,
      suspensionReason: user.suspensionReason,
    }),
  };
}
