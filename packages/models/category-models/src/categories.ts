interface Category {
  code: string;
  name: string;
  scheme: string;
}

export const categories: Category[] = [
  {
    code: "citizen.residence.residence_place",
    name: "Residence place",
    scheme: "vc_example_eservice_categories",
  },
  {
    code: "citizen.residence.digital_domicile",
    name: "Citizen digital domicile",
    scheme: "vc_example_eservice_categories",
  },
  {
    code: "citizen.identity.marital_status",
    name: "Marital status",
    scheme: "vc_example_eservice_categories",
  },
  {
    code: "citizen.identity.birth_place",
    name: "Birth place",
    scheme: "vc_example_eservice_categories",
  },
  {
    code: "citizen.identity.birth_date",
    name: "Birth date",
    scheme: "vc_example_eservice_categories",
  },
  {
    code: "organization.public_administration.typology",
    name: "PA typology",
    scheme: "vc_example_eservice_categories",
  },
  {
    code: "organization.public_administration.address",
    name: "PA address",
    scheme: "vc_example_eservice_categories",
  },
  {
    code: "organization.public_administration.digital_domicile",
    name: "PA digital domicile",
    scheme: "vc_example_eservice_categories",
  },
  {
    code: "organization.private_company.economic_activity",
    name: "Economic activity",
    scheme: "vc_example_eservice_categories",
  },
  {
    code: "organization.private_company.address",
    name: "Company address",
    scheme: "vc_example_eservice_categories",
  },
  {
    code: "organization.private_company.digital_domicile",
    name: "Company digital domicile",
    scheme: "vc_example_eservice_categories",
  },
];
