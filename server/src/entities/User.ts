import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToMany } from 'typeorm'
import { Room } from './Room';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;


  // Stored as salt:hash (hex) for simplicity
  @Column()
  passwordHash!: string;

  // Avatar image URL
  @Column({ nullable: true })
  avatarUrl?: string;

  // Preferred nickname
  @Column({ nullable: true })
  nickname?: string;


  // Custom greeting and goodbye for personal rituals
  @Column({ nullable: true })
  greeting?: string;

  @Column({ nullable: true })
  goodbye?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToMany(() => Room, room => room.users)
  rooms!: Room[];
}
