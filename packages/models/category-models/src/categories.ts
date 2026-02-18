interface Category {
  code: string;
  name: string;
  scheme: string;
}

export const categories: Record<string, Record<string, string>> = {
  vc_example_eservice_categories: {
    "citizen.identity.birth_date": "Birth date",
    "citizen.identity.birth_place": "Birth place",
    "citizen.identity.marital_status": "Marital status",
    "citizen.residence.digital_domicile": "Citizen digital domicile",
    "citizen.residence.residence_place": "Residence place",
    "organization.private_company.address": "Company address",
    "organization.private_company.digital_domicile": "Company digital domicile",
    "organization.private_company.economic_activity": "Economic activity",
    "organization.public_administration.address": "PA address",
    "organization.public_administration.digital_domicile":
      "PA digital domicile",
    "organization.public_administration.typology": "PA typology",
  },
};

export function getCategory(
  scheme: string,
  code: string,
): Category | undefined {
  const name = categories[scheme]?.[code];
  if (name === undefined) {
    return undefined;
  }
  return { code, name, scheme };
}
