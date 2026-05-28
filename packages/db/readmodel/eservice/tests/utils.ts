import type { splitEserviceIntoObjectsSQL } from "../src/converters/splitters.ts";

export function createEserviceAggregatorInput({
  eserviceCategoriesSQL,
  eserviceInterfacesSQL,
  eservicePurposeFormPrefillsSQL,
  eserviceSQL,
  eserviceVersionRequiredAttributesSQL,
  eserviceVersionsSQL,
}: ReturnType<typeof splitEserviceIntoObjectsSQL>) {
  return eserviceVersionsSQL.flatMap((eserviceVersionSQL) => {
    const eserviceVersionRequiredAttributes =
      eserviceVersionRequiredAttributesSQL.filter(
        (ra) => ra.eserviceVersionId === eserviceVersionSQL.id,
      );
    const eserviceInterfaces = eserviceInterfacesSQL.filter(
      (i) => i.eserviceVersionId === eserviceVersionSQL.id,
    );
    const eserviceCategories = eserviceCategoriesSQL.filter(
      (c) => c.eserviceId === eserviceSQL.id,
    );
    const purposeFormPrefills = eservicePurposeFormPrefillsSQL.filter(
      (pfa) => pfa.eserviceId === eserviceSQL.id,
    );

    const requiredAttributesOrNull = eserviceVersionRequiredAttributes.length
      ? eserviceVersionRequiredAttributes
      : [null];
    const interfacesOrNull = eserviceInterfaces.length
      ? eserviceInterfaces
      : [null];
    const categoriesOrNull = eserviceCategories.length
      ? eserviceCategories
      : [null];
    const purposeFormPrefillsOrNull = purposeFormPrefills.length
      ? purposeFormPrefills
      : [null];

    return categoriesOrNull.flatMap((categorySQL) =>
      requiredAttributesOrNull.flatMap((requiredAttributeSQL) =>
        interfacesOrNull.flatMap((interfaceSQL) =>
          purposeFormPrefillsOrNull.map((purposeFormPrefillSQL) => ({
            category: categorySQL,
            eservice: eserviceSQL,
            interface: interfaceSQL,
            purposeFormPrefill: purposeFormPrefillSQL,
            requiredAttribute: requiredAttributeSQL,
            version: eserviceVersionSQL,
          })),
        ),
      ),
    );
  });
}
