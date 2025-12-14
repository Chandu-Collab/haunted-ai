import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from './User';

@Entity('user_memories')
@Index(['userId', 'memoryType'])
@Index(['userId', 'importance'], { where: 'importance > 7' })
export class UserMemory {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column('text')
  memoryContent!: string;

  @Column({
    type: 'enum',
    enum: ['preference', 'conversation', 'emotion', 'behavior', 'relationship', 'achievement'],
    default: 'conversation'
  })
  memoryType!: string;

  @Column('text', { nullable: true })
  context!: string;

  @Column('float', { default: 5.0 })
  importance!: number; // 1-10 scale

  @Column('float', { default: 1.0 })
  emotionalWeight!: number; // How emotionally significant

  @Column('text', { nullable: true })
  tags!: string; // JSON array of tags

  @Column('text', { nullable: true })
  embedding!: string; // Vector embedding for semantic search

  @Column({ default: 1 })
  accessCount!: number;

  @Column({ type: 'timestamp', nullable: true })
  lastAccessed!: Date;

  @Column({ default: false })
  isDecaying!: boolean; // Whether this memory should fade over time

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}