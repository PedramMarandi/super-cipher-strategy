import { Injectable } from "@nestjs/common";
import { TradingviewService } from "../tradingview/tradingview.service";
import { CipherBService } from "../indicator/cipher-b.service";
import { SuperTrendService } from "../indicator/super-trend.service";
import { Cron } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { SignalEnum, SuperCipherEntity } from "./super-cipher.entity";
import { Repository } from "typeorm";
import { ThreeCommasService } from "../3-commas/three-commas.service";

@Injectable()
export class SuperCipherService {
  private readonly pairs = ["ANTUSDT", "LUNAUSDT", "ZECUSDT", "BTCUSDT", "ETHUSDT", "LTCUSDT", "MASKUSDT", "ALGOUSDT", "SOLUSDT", "XLMUSDT", "XRPUSDT", "DOTUSDT", "DOGEUSDT", "ALICEUSDT", "ALGOUSDT", "TRXUSDT", "BNBUSDT", "WAVESUSDT"];

  constructor(private readonly tradingviewService: TradingviewService,
              private readonly cipherBService: CipherBService,
              private readonly superTrendService: SuperTrendService,
              @InjectRepository(SuperCipherEntity)
              private superCipherRepository: Repository<SuperCipherEntity>
  ) {
  }

  @Cron("1 * * * * *")
  async runStrategy() {
    const result = { longs: [], shorts: [] };
    for (const pair of this.pairs) {
      try {
        console.log("Generating chart for ", pair);
        const market = `BINANCE:${pair}`;
        const timeframe = "30";
        const chart = this.tradingviewService
          .setClient({ onError: e => console.log("Error whilst setting up client", e) })
          .setChart({
            market,
            timeframe,
            onError: (e) => console.log("Errors whilst setting up the chart", e)
          });
        const cipherB = await this.cipherBService.getIndicator(chart);
        const superTrend = await this.superTrendService.getIndicator(chart);
        const normalised = {
          pair,
          market,
          timeframe,
          buy: cipherB.moneyFlow === "POSITIVE" && cipherB.buyCircle && superTrend.upTrend,
          sell: cipherB.moneyFlow === "NEGATIVE" && cipherB.sellCircle && superTrend.downTrend,
          ...superTrend,
          ...cipherB
        };
        const lastTrade = await this.getLastTrade(pair);
        if (lastTrade?.time === normalised.$time) {
          continue;
        }

        if (lastTrade?.type !== SignalEnum.LONG && normalised.buy) {
          result.longs.push(await this.insertSignal(normalised));
          await ThreeCommasService.startNewDeal({ type: SignalEnum.LONG, pair });
          continue;
        }
        if (lastTrade?.type !== SignalEnum.SHORT && normalised.sell) {
          result.shorts.push(await this.insertSignal(normalised));
          await ThreeCommasService.startNewDeal({ type: SignalEnum.SHORT, pair });
          continue;
        }

        // Re-enteries
        if (lastTrade?.type === SignalEnum.LONG && normalised.buy && cipherB.buyInOppositeArea) {
          result.longs.push(await this.insertSignal(normalised));
          await ThreeCommasService.startNewDeal({ type: SignalEnum.LONG, pair });
        }
        if (lastTrade?.type === SignalEnum.SHORT && normalised.sell && cipherB.sellInOppositeArea) {
          result.shorts.push(await this.insertSignal(normalised));
          await ThreeCommasService.startNewDeal({ type: SignalEnum.SHORT, pair });
        }
      } catch (e) {
        console.log("Error caught", e);
      }
    }

    console.log("DATE -------> ", new Date());
    console.log("Longs", result.longs);
    console.log("shorts", result.shorts);
    console.log("=============================");
    return result;
  }

  private getLastTrade(pair: string): Promise<SuperCipherEntity> {
    return this.superCipherRepository.findOne({
      where: { pair },
      order: { id: "DESC" }
    });
  }

  private async insertSignal(data): Promise<SuperCipherEntity> {
    const signal = SuperCipherEntity.create();
    signal.pair = data.pair;
    signal.type = data.buy ? SignalEnum.LONG : SignalEnum.SHORT;
    signal.timeframe = "30";
    signal.time = data.$time;
    signal.signal = JSON.stringify(data);
    signal.reenter = data.buyInOppositeArea || data.sellInOppositeArea;
    await signal.save();
    return signal;
  }
}


