import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { TradingviewModule } from "./tradingview/tradingview.module";
import { StrategyModule } from "./strategy/strategy.module";
import { IndicatorModule } from "./indicator/indicator.module";
import { ScheduleModule } from "@nestjs/schedule";
import { SignalModule } from "./signal/signal.module";
import { Connection } from "typeorm";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SuperCipherEntity } from "./strategy/super-cipher.entity";
import { ThreeCommasModule } from "./3-commas/three-commas.module";

@Module({
  imports: [TradingviewModule, StrategyModule, IndicatorModule, ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      port: Number(process.env.DATABASE_PORT),
      synchronize: true,
      host: process.env.DATABASE_HOST,
      type: "postgres",
      entities: [SuperCipherEntity]
    }),
    SignalModule,
    ThreeCommasModule],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {
  constructor(private connection: Connection) {
  }

}
