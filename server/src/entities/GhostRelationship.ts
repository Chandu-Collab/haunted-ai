import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from './User';

@Entity('ghost_relationships')
@Index(['userId', 'ghostPersonalityId'])
export class GhostRelationship {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column()
  ghostPersonalityId!: string;

  @Column('float', { default: 0.0 })
  trustLevel!: number; // -100 to 100

  @Column('float', { default: 0.0 })
  intimacyLevel!: number; // 0 to 100

  @Column('float', { default: 0.0 })
  fearLevel!: number; // 0 to 100

  @Column('float', { default: 0.0 })
  affectionLevel!: number; // 0 to 100

  @Column('int', { default: 0 })
  conversationCount!: number;

  @Column('int', { default: 0 })
  totalInteractionTime!: number; // in seconds

  @Column('text', { nullable: true })
  relationshipMilestones!: string; // JSON array of milestones

  @Column('text', { nullable: true })
  personalNicknames!: string; // JSON array of names they call each other

  @Column('text', { nullable: true })
  sharedMemories!: string; // JSON array of memory IDs

  @Column('text', { nullable: true })
  conflictHistory!: string; // JSON array of past disagreements

  @Column({
    type: 'enum',
    enum: ['stranger', 'acquaintance', 'friend', 'close_friend', 'confidant', 'soulmate', 'rival', 'enemy'],
    default: 'stranger'
  })
  relationshipStatus!: string;

  @Column({ type: 'timestamp', nullable: true })
  lastInteraction!: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}