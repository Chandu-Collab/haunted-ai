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
