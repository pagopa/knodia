import { SignupUser } from "@knodia/signup-models";

import type { NewSignupUser, SignupUserSQL } from "../signupUser.ts";

export function toSignupUser(sql: SignupUserSQL): SignupUser {
  return SignupUser.parse({
    createdAt: sql.createdAt,
    dateOfBirth: sql.dateOfBirth,
    email: sql.email,
    familyName: sql.familyName,
    fiscalNumber: sql.fiscalNumber ?? undefined,
    generatedEntities: {
      Lynx: {
        organizationId: sql.lynxOrganizationId,
        organizationName: sql.lynxOrganizationName,
        userName: sql.lynxUserName,
      },
      Orion: {
        organizationId: sql.orionOrganizationId,
        organizationName: sql.orionOrganizationName,
        userName: sql.orionUserName,
      },
    },
    name: sql.name,
    personIdentifier: sql.personIdentifier ?? undefined,
    signupUserId: sql.signupUserId,
    spidCode: sql.spidCode ?? undefined,
    status: sql.status,
    updatedAt: sql.updatedAt,
  });
}

export function toSignupUserSQL(user: SignupUser): NewSignupUser {
  return {
    createdAt: user.createdAt,
    dateOfBirth: user.dateOfBirth,
    email: user.email,
    familyName: user.familyName,
    fiscalNumber: user.fiscalNumber,
    lynxOrganizationId: user.generatedEntities.Lynx.organizationId,
    lynxOrganizationName: user.generatedEntities.Lynx.organizationName,
    lynxUserName: user.generatedEntities.Lynx.userName,
    name: user.name,
    orionOrganizationId: user.generatedEntities.Orion.organizationId,
    orionOrganizationName: user.generatedEntities.Orion.organizationName,
    orionUserName: user.generatedEntities.Orion.userName,
    personIdentifier: user.personIdentifier,
    signupUserId: user.signupUserId,
    spidCode: user.spidCode,
    status: user.status,
    updatedAt: user.updatedAt,
  };
}
