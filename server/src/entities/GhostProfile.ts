import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class GhostProfile {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  name!: string;

  @Column('text')
  backstory!: string;

  @Column({ default: '👻' })
  emoji!: string;

  @Column({ nullable: true })
  color?: string;

  // Appearance customization (JSON: color, emoji, accessories, etc.)
  @Column({ type: 'json', nullable: true })
  appearance?: Record<string, any>;
}
