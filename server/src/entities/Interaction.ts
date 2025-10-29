import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('interactions')
export class Interaction {
  @PrimaryColumn('varchar')
  sessionId!: string; // matches client sessionId

  @Column({ type: 'varchar', nullable: true })
  userId?: string;

  @Column({ type: 'json', nullable: true })
  achievements?: Array<{ id: string; title: string; description?: string; unlockedAt: number }>;

  @Column({ type: 'int', default: 80 })
  energy!: number;

  @Column({ type: 'json', nullable: true })
  roomsVisited?: string[];

  @Column({ type: 'json', nullable: true })
  meta?: Record<string, any>;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt!: Date;
}
