import { customType } from "drizzle-orm/pg-core";

// Helper for bytea needed in version 0.45.1, but type is supported in beta versions >= 1.0.0-beta.6
// Should be released soon according to Drizzle ORM team: https://orm.drizzle.team/roadmap
export const eventStoreBytea = customType<{ data: Buffer }>({
  dataType() {
    return "bytea";
  },
});
