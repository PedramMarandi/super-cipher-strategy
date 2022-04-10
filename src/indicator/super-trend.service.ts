import { Injectable } from "@nestjs/common";
import * as _ from "lodash";
import * as TradingView from "@mathieuc/tradingview";

@Injectable()
export class SuperTrendService {
  constructor() {
  }

  getIndicator(chart): Promise<SuperTrend> {
    return new Promise((resolve, reject) => {
      TradingView.getIndicator("PUB;VfOPXWDHDPhORvJYRTcuHOyeqpOcRR45").then(
        async (indicator) => {
          const SupperTrend = new chart.Study(indicator);
          SupperTrend.onError((...error) => {
            console.log("MarketCipher B error:", error[0]);
            return reject("MarketCipher B error");
          });

          const onUpdate = () => {
            SupperTrend.remove();
            const last = SupperTrend.periods[1];
            return resolve({
              $time: last.$time,
              upTrend: _.toSafeInteger(last.Up_Trend) < 100000,
              downTrend: _.toSafeInteger(last.Down_Trend) < 100000,
              index: 0
            });
          };
          return await SupperTrend.onUpdate(onUpdate);
        });
    });
  }

}

export type SuperTrend = { upTrend: boolean; downTrend: boolean, $time: number, index: number }
