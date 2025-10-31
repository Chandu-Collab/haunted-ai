import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable, OneToMany } from 'typeorm';
import { User } from './User';
import { Message } from './Message';

@Entity()
export class Room {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  name!: string;

  @ManyToMany(() => User, user => user.rooms)
  @JoinTable()
  users!: User[];

  @OneToMany(() => Message, message => message.room)
  messages!: Message[];

  // Room decoration settings (JSON)
  @Column({ type: 'json', nullable: true })
  decorations?: Record<string, any>;
}
