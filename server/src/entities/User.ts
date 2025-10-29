import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm'

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ unique: true })
  email!: string

  // Stored as salt:hash (hex) for simplicity
  @Column()
  passwordHash!: string

  @CreateDateColumn()
  createdAt!: Date
}
