import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

export enum SignalEnum {
  LONG = "long",
  SHORT = "short",
}

@Entity()
export class SuperCipherEntity extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  pair: string;

  @Column()
  timeframe: string;

  @Column()
  time: number;

  @Column({
    type: "enum",
    enum: SignalEnum,
  })
  type: SignalEnum;

  @Column("simple-json")
  signal: any;

  @Column({ default: false })
  reenter: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
