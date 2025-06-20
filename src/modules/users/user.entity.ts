import { ShortUrlEntity } from 'src/modules/urls/url.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    name: 'google_id',
    type: 'varchar',
    length: 255,
    unique: true,
    nullable: true,
  })
  googleId: string | null;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  password: string | null;

  @Column({
    name: 'auth_provider',
    type: 'varchar',
    length: 50,
    default: 'local',
  })
  authProvider: string;

  @Column({
    name: 'security_question',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  securityQuestion: string | null;

  @Column({
    name: 'security_answer',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  securityAnswer: string | null;

  @OneToMany(() => ShortUrlEntity, (shortUrl) => shortUrl.user)
  shortUrls: ShortUrlEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}