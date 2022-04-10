import { Module } from '@nestjs/common';
import { TradingviewService } from "./tradingview.service";

@Module({
  providers: [TradingviewService],
  exports: [TradingviewService]
})
export class TradingviewModule {}
