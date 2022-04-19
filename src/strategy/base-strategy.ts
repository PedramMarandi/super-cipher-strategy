import { TradingviewService } from "../tradingview/tradingview.service";
import { EvaluateResult, Rools } from "rools";

export class BaseStrategy {
  private ruleEngine: Rools;

  constructor(protected readonly tradingviewService: TradingviewService) {
    this.ruleEngine = new Rools();
  }

  protected setChart(param: { market; timeframe: string }) {
    const { timeframe, market } = param;
    return this.tradingviewService.setClient({ onError: e => console.log("Error whilst setting up client", e) }).setChart({
      market,
      timeframe,
      onError: e => console.log("Errors whilst setting up the chart", e),
    });
  }

  public async setRules(rules: any[]): Promise<void> {
    await this.ruleEngine.register(rules);
  }

  public async evaluate(facts: any & { pair: string }): Promise<EvaluateResult> {
    return this.ruleEngine.evaluate({
      ...facts,
      result: { long: false, short: false, longReEnter: false, shortReEnter: false },
    });
  }
}
