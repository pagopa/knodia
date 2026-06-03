import type { splitEserviceIntoObjectsSQL } from "../src/converters/splitters.ts";

export function createEserviceAggregatorInput({
  eserviceCategoriesSQL,
  eserviceInterfacesSQL,
  eservicePurposeFormOptionSQL,
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
    const purposeFormOptions = eservicePurposeFormOptionSQL.filter(
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
    const purposeFormOptionsOrNull = purposeFormOptions.length
      ? purposeFormOptions
      : [null];

    return categoriesOrNull.flatMap((categorySQL) =>
      requiredAttributesOrNull.flatMap((requiredAttributeSQL) =>
        interfacesOrNull.flatMap((interfaceSQL) =>
          purposeFormOptionsOrNull.map((eservicePurposeFormOptionSQL) => ({
            category: categorySQL,
            eservice: eserviceSQL,
            interface: interfaceSQL,
            purposeFormOptions: eservicePurposeFormOptionSQL,
            requiredAttribute: requiredAttributeSQL,
            version: eserviceVersionSQL,
          })),
        ),
      ),
    );
  });
}
