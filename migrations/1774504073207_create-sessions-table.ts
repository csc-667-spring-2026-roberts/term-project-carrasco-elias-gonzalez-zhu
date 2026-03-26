// STUB: PERSON 1
import type { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("session", {
    sid: {
      type: "varchar",
      primaryKey: true,
    },
    sess: {
      type: "json",
      notNull: true,
    },
    expire: {
      type: "timestamp",
      notNull: true,
    },
  });

  pgm.createIndex("session", "expire", {
    name: "idx_session_expire",
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropIndex("session", "expire", {
    name: "idx_session_expire",
  });

  pgm.dropTable("session");
}