import { Module } from "@nestjs/common";
import { IndicatorModule } from "../indicator/indicator.module";
import { TradingviewModule } from "../tradingview/tradingview.module";
import { SuperCipherService } from "./super-cipher/super-cipher.service";
import { SuperCipherController } from "./super-cipher/super-cipher.controller";
import { SuperCipherEntity } from "./super-cipher/super-cipher.entity";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
  imports: [IndicatorModule, TradingviewModule, TypeOrmModule.forFeature([SuperCipherEntity])],
  providers: [SuperCipherService],
  controllers: [SuperCipherController],
  exports: [SuperCipherService],
})
export class StrategyModule {}
