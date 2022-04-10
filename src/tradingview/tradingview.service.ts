import { Injectable } from "@nestjs/common";
import * as TradingView from "@mathieuc/tradingview";

@Injectable()
export class TradingviewService {
  private client = undefined;

  constructor() {
  }

  setChart(chartParam: { market: string, timeframe: string, onError?: (...e) => void }) {
    if (!this.getClient()) {
      throw new Error(`No client selected`);
    }
    const chart = new this.client.Session.Chart();
    chart.setMarket(chartParam.market, {
      timeframe: chartParam.timeframe
    });
    if (typeof chartParam.onError === "undefined") {
      chartParam.onError = (...error) => {
        console.log(error);
      };
    }
    chart.onError(chartParam.onError);
    return chart;
  }

  getClient() {
    return this.client;
  }

  setClient(params: { onError?: (...e) => void }) {
    this.client = new TradingView.Client();
    if (typeof params.onError === "undefined") {
      params.onError = (...error) => {
        console.log(error);
      };
    }
    this.client.onError(params.onError);
    return this;
  }
}
