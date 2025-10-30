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

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToMany(() => Room, room => room.users)
  rooms!: Room[];
}
