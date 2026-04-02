import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.dropConstraint('users', 'users_email_key', {
    ifExists: true,
  });

  pgm.sql(`
    CREATE UNIQUE INDEX users_email_lower_unique
    ON users (LOWER(email));
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    DROP INDEX IF EXISTS users_email_lower_unique;
  `);

  pgm.addConstraint('users', 'users_email_key', {
    unique: ['email'],
  });
}