import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity('messages')
export class Message {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column('text')
    content!: string;

    @Column({ type: 'boolean', default: false })
    isGhost: boolean = false;

    @Column('varchar')
    sessionId!: string;

    @Column({ type: 'varchar', nullable: true })
    personalityId?: string;

    @Column({ type: 'json', nullable: true })
    moodAnalysis?: {
        dominant: string;
        confidence: number;
        emotions: Record<string, number>;
        sentiment: 'positive' | 'negative' | 'neutral';
        intensity: 'low' | 'medium' | 'high';
    };

    @Column({ type: 'json', nullable: true })
    contextualFactors?: {
        timeOfDay: string;
        weather?: Record<string, any>;
        roomAtmosphere: string;
        conversationLength: number;
        userEngagement: string;
    };

    @Column({ type: 'varchar', nullable: true })
    imageUrl?: string;

    @Column({ type: 'json', nullable: true })
    imageAnalysis?: Record<string, any>;

    @CreateDateColumn({ type: 'timestamp with time zone' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp with time zone' })
    updatedAt!: Date;

    @Column({ 
        type: 'timestamp with time zone', 
        default: () => 'CURRENT_TIMESTAMP' 
    })
    timestamp: Date = new Date();
}

export type IMessage = Omit<Message, 'id' | 'createdAt' | 'updatedAt'> & {
    id?: string;
    createdAt?: Date;
    updatedAt?: Date;
};
