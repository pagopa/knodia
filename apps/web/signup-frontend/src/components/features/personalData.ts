interface PersonalData {
  dateOfBirth: string;
  email?: string;
  familyName: string;
  name: string;
  uniqueIdentifier: string;
}

interface PersonalDataSource {
  dateOfBirth: string;
  email?: string;
  familyName: string;
  fiscalNumber?: string;
  name: string;
  personIdentifier?: string;
  spidCode?: string;
}

// The unique identifier is the IdP-specific id: spidCode (SPID), fiscalNumber (CIEid) or personIdentifier (eIDAS).
export function buildPersonalData(user: PersonalDataSource): PersonalData {
  return {
    dateOfBirth: user.dateOfBirth,
    ...(user.email !== undefined && { email: user.email }),
    familyName: user.familyName,
    name: user.name,
    // Precedence must match the backend's selectSignupIdentifier
    // (@knodia/common-models/auth); kept inline since the FE can't import it.
    uniqueIdentifier:
      user.personIdentifier ?? user.spidCode ?? user.fiscalNumber ?? "",
  };
}

export function downloadPersonalData(user: PersonalDataSource): void {
  const blob = new Blob([JSON.stringify(buildPersonalData(user), null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "knodia-personal-data.json";
  anchor.click();
  URL.revokeObjectURL(url);
}
