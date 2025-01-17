import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, BeforeInsert, AfterInsert, BeforeUpdate, AfterUpdate, SelectQueryBuilder, AfterLoad } from "typeorm"
import { validateOrReject, IsDefined } from "class-validator";
import { Phone } from "./Phone"
import { Email } from "./Email"
import { Address } from "./Address"
import * as bcrypt from 'bcrypt';
import { AppDataSource } from "../data-source";
import { Log } from "./Log";

enum role { ADMIN = 'admin', USER = 'user', CUSTOMER = 'customer' };
enum confirmed { PENDING = 'pending', EMAIL = 'email', APPROVAL = 'approval', DENIED = 'denied' };

@Entity("users")
export class User {

    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: 'varchar', length: 100, nullable: false })
    @IsDefined({ message: 'isim gerekli' })
    firstName!: string

    @Column({ type: 'varchar', length: 100, nullable: false })
    lastName: string

    @Column({ type: 'varchar', length: 100, unique: true })
    email: string

    @Column({ type: 'varchar', length: 100 })
    password: string

    @Column({ type: "enum", enum: role, default: role.USER, nullable: false })
    role: role

    @Column({ type: "enum", enum: confirmed, default: confirmed.PENDING, nullable: false })
    confirmed: confirmed

    @OneToMany(() => Phone, (phone) => phone.user, { cascade: true })
    phone: Phone[]

    @OneToMany(() => Email, (email) => email.user, { cascade: true })
    emails: Email[]

    @OneToMany(() => Address, (address) => address.user, { cascade: true })
    address: Address[]

    @CreateDateColumn({ select: false })
    createdAt: Date;

    @UpdateDateColumn({ nullable: true, select: false })
    updateAt: Date;

    @DeleteDateColumn({ nullable: true, select: false })
    deletedAt: Date;

    @BeforeInsert()
    async hashPassword() {
        this.password = await bcrypt.hash(this.password, 10)
    }

    @BeforeInsert()
    async validate() {
        console.log('-----');

        validateOrReject(this, { skipUndefinedProperties: true });
    }

    @AfterInsert()
    async userLog() {
        const logRepository = AppDataSource.getRepository(Log)
        const log = Object.assign(new Log(), {
            type: 'user',
            process: 'yeni kulanıcı kayıtı > ' + this.id + ' ' + this.email + ' ' + this.firstName + ' ' + this.lastName,
            user: this.id
        })

        logRepository.save(log)
    }

    @AfterUpdate()
    async userAfterUpdateLog() {
        console.log('----');

        const logRepository = AppDataSource.getRepository(Log)
        const log = Object.assign(new Log(), {
            type: 'user',
            process: 'kulanıcı güncellemesi öncesi > ' + this.email + ' ' + this.firstName + ' ' + this.lastName,
            user: this.id
        })

        logRepository.save(log)
    }
    @BeforeUpdate()
    async userBeforeUpdateLog() {
        console.log('****');

        const logRepository = AppDataSource.getRepository(Log)
        const log = Object.assign(new Log(), {
            type: 'user',
            process: 'kulanıcı güncellemesi sonrası > ' + this.email + ' ' + this.firstName + ' ' + this.lastName,
            user: this.id
        })

        logRepository.save(log)
    }

    fullName: string;

    @AfterLoad()
    afterLoad() {
        this.fullName = `${this.firstName} ${this.lastName}`;
    }
}
