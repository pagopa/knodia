import { getAgreementActivationDetailsOptions } from "@knodia/bff-client/tanstack-query";

import { externalClient } from "@/libs/external-axios";

export const agreementActivationDetailsQuery = () =>
  getAgreementActivationDetailsOptions({ client: externalClient });
