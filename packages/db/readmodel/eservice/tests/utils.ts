import type { splitEserviceIntoObjectsSQL } from "../src/converters/splitters.ts";

export function createEserviceAggregatorInput({
  eserviceCategoriesSQL,
  eserviceInterfacesSQL,
  eservicePurposeFormAnswersSQL,
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
    const purposeFormAnswers = eservicePurposeFormAnswersSQL.filter(
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
    const purposeFormAnswersOrNull = purposeFormAnswers.length
      ? purposeFormAnswers
      : [null];

    return categoriesOrNull.flatMap((categorySQL) =>
      requiredAttributesOrNull.flatMap((requiredAttributeSQL) =>
        interfacesOrNull.flatMap((interfaceSQL) =>
          purposeFormAnswersOrNull.map((purposeFormAnswerSQL) => ({
            category: categorySQL,
            eservice: eserviceSQL,
            interface: interfaceSQL,
            purposeFormAnswer: purposeFormAnswerSQL,
            requiredAttribute: requiredAttributeSQL,
            version: eserviceVersionSQL,
          })),
        ),
      ),
    );
  });
}
