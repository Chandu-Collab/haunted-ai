import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export type GhostPersonalityTrait = 'friendly' | 'mysterious' | 'mischievous' | 'wise' | 'playful' | 'dark' | 'protective' | 'ancient';
export type VoiceTone = 'whisper' | 'echo' | 'normal' | 'deep' | 'high' | 'robotic' | 'ethereal';
export type ActivityLevel = 'passive' | 'moderate' | 'active' | 'very_active';

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

  // Personality traits
  @Column({ type: 'json', nullable: true })
  personalityTraits?: GhostPersonalityTrait[];

  @Column({ type: 'enum', enum: ['passive', 'moderate', 'active', 'very_active'], default: 'moderate' })
  activityLevel!: ActivityLevel;

  // Voice and communication settings
  @Column({ type: 'json', nullable: true })
  voiceSettings?: {
    tone?: VoiceTone;
    speed?: number; // 0.5 - 2.0
    pitch?: number; // 0.5 - 2.0
    volume?: number; // 0.1 - 1.0
  };

  // Behavioral preferences
  @Column({ type: 'json', nullable: true })
  preferences?: {
    favoriteTopics?: string[];
    conversationStyle?: 'formal' | 'casual' | 'poetic' | 'mysterious';
    responseLength?: 'short' | 'medium' | 'long';
    useEmojis?: boolean;
    preferredTimeToAppear?: 'day' | 'night' | 'any';
  };

  // Special abilities and powers
  @Column({ type: 'json', nullable: true })
  abilities?: {
    canManipulateWeather?: boolean;
    canInfluenceElectronics?: boolean;
    canAccessMemories?: boolean;
    canPredictFuture?: boolean;
    knowledgeAreas?: string[];
  };

  // Appearance customization (JSON: color, emoji, accessories, etc.)
  @Column({ type: 'json', nullable: true })
  appearance?: {
    color?: string;
    emoji?: string;
    aura?: string;
    transparency?: number;
    size?: 'small' | 'medium' | 'large';
    accessories?: string[];
    specialEffects?: string[];
  };

  // Usage statistics
  @Column({ type: 'json', nullable: true })
  stats?: {
    timesUsed?: number;
    averageSessionLength?: number;
    favoriteRooms?: string[];
    lastUsed?: Date;
    userRating?: number;
  };

  // Owner information
  @Column({ nullable: true })
  createdBy?: string; // User ID

  @Column({ default: true })
  isActive!: boolean;

  @Column({ default: false })
  isFeatured!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
