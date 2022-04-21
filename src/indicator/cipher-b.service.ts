import { Injectable } from "@nestjs/common";
import * as TradingView from "@mathieuc/tradingview";

export interface Indicator {
}

@Injectable()
export class CipherBService implements Indicator {
  constructor() {
  }

  getIndicator(chart): Promise<CipherB> {
    return new Promise((resolve, reject) => {
      TradingView.getIndicator("PUB;uA35GeckoTA2EfgI63SD2WCSmca4njxp").then(async indicator => {
        indicator.setOption("Show_Stoch_Regular_Divergences", true);
        indicator.setOption("Show_Stoch_Hidden_Divergences", false);
        const cipherB = new chart.Study(indicator);
        cipherB.onError((...error) => {
          console.log("MarketCipher B error:", error[0]);
          return reject("MarketCipher B error");
        });
        const onUpdate = () => {
          cipherB.remove();
          const last = cipherB.periods[1];
          const sellDot = (last.Sell_Big_red_circle === 1 || last.Sell_Big_red_circle__Div === 1 || last.Sell_Small_red_dot === 1);
          const buyDot = (last.Buy_Small_green_dot === 1 || last.GOLD_Buy_Big_GOLDEN_circle === 1 || last.Buy_Big_green_circle === 1);
          return resolve({
            VWAP: Math.round(last.VWAP * 1000) / 1000,
            moneyFlow: last.RSIMFI_Area >= 0 ? "POSITIVE" : "NEGATIVE",
            buyCircle: buyDot && last.VWAP > 0,
            sellCircle: sellDot && last.VWAP < 0,
            buyInOppositeArea:  last.WT_Wave_1 < 0 && buyDot,
            sellInOppositeArea:  last.WT_Wave_1 > 0 && sellDot,
            index: 0,
            $time: last.$time
          });
        };
        return await cipherB.onUpdate(onUpdate);
      });
    });
  }
}

export type CipherB = {
  VWAP: number;
  moneyFlow: "POSITIVE" | "NEGATIVE";
  buyCircle: boolean;
  sellCircle: boolean;
  buyInOppositeArea: boolean;
  sellInOppositeArea: boolean;
  index: number;
  $time: number
};
