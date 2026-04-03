import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable('games', {
    id: 'id',
    status: {
      type: 'varchar(20)',
      notNull: true,
      default: 'waiting',
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  pgm.addConstraint('games', 'games_status_check', {
    check: "status IN ('waiting', 'in_progress', 'finished')",
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('games');
}
