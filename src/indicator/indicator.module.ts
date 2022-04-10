import { Module } from "@nestjs/common";
import { CipherBService } from "./cipher-b.service";
import { TradingviewModule } from "../tradingview/tradingview.module";
import { SuperTrendService } from "./super-trend.service";

@Module({
  imports: [TradingviewModule],
  providers: [CipherBService, SuperTrendService],
  exports: [CipherBService, SuperTrendService]
})
export class IndicatorModule {
}
