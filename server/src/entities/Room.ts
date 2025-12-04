import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './User';
import { Message } from './Message';

export type RoomType = 'haunted' | 'group_chat';
export type ChatMode = 'ai_focused' | 'friends_focused' | 'balanced';
export type RoomPrivacy = 'public' | 'private' | 'invite_only';

@Entity()
export class Room {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  name!: string;

  @Column({ type: 'enum', enum: ['haunted', 'group_chat'], default: 'haunted' })
  type!: RoomType;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'enum', enum: ['public', 'private', 'invite_only'], default: 'public' })
  privacy!: RoomPrivacy;

  @Column({ type: 'varchar', length: 10, nullable: true, unique: true })
  inviteCode?: string;

  @Column({ type: 'int', default: 10 })
  maxParticipants!: number;

  @Column({ type: 'int', default: 0 })
  participantCount!: number;

  // AI Moderation Settings
  @Column({ type: 'enum', enum: ['ai_focused', 'friends_focused', 'balanced'], default: 'balanced', nullable: true })
  chatMode?: ChatMode;

  @Column({ type: 'boolean', default: true })
  aiModerationEnabled!: boolean;

  @Column({ type: 'int', default: 30 })
  aiInterventionDelay!: number; // seconds of inactivity before AI suggests topics

  @Column({ type: 'json', nullable: true })
  aiSettings?: {
    personality?: string;
    engagementLevel?: 'low' | 'medium' | 'high';
    topicCategories?: string[];
  };

  // Conversation Metrics
  @Column({ type: 'json', nullable: true })
  conversationMetrics?: {
    totalMessages?: number;
    activeUsers?: number;
    avgResponseTime?: number;
    lastActivity?: Date;
    engagementLevel?: number;
  };

  @ManyToMany(() => User, user => user.rooms)
  @JoinTable()
  users!: User[];

  @Column({ type: 'int', nullable: true })
  ownerId?: number;

  @OneToMany(() => Message, message => message.room)
  messages!: Message[];

  // Room decoration settings (JSON)
  @Column({ type: 'json', nullable: true })
  decorations?: Record<string, any>;

  // Theme settings for group chat rooms
  @Column({ type: 'json', nullable: true })
  theme?: {
    name?: string;
    primaryColor?: string;
    backgroundImage?: string;
    customStyles?: Record<string, any>;
  };

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
