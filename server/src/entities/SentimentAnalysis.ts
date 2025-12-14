import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from './User';

@Entity('sentiment_analysis')
@Index(['userId', 'analysisDate'])
export class SentimentAnalysis {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column()
  messageId!: string;

  @Column('text')
  messageContent!: string;

  @Column('float')
  overallSentiment!: number; // -1 to 1

  @Column('float')
  emotionJoy!: number; // 0 to 1

  @Column('float')
  emotionSadness!: number; // 0 to 1

  @Column('float')
  emotionAnger!: number; // 0 to 1

  @Column('float')
  emotionFear!: number; // 0 to 1

  @Column('float')
  emotionSurprise!: number; // 0 to 1

  @Column('float')
  emotionDisgust!: number; // 0 to 1

  @Column('float')
  stressLevel!: number; // 0 to 1

  @Column('float')
  engagementLevel!: number; // 0 to 1

  @Column('text', { nullable: true })
  detectedTopics!: string; // JSON array

  @Column('text', { nullable: true })
  contextualFactors!: string; // JSON object

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  analysisDate!: Date;

  @CreateDateColumn()
  createdAt!: Date;
}