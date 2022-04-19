import { Repository } from "typeorm";
import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { BaseStrategy } from "../base-strategy";
import { Rule } from "rools";
import { Cron } from "@nestjs/schedule";
import { TradingviewService } from "../../tradingview/tradingview.service";
import { CipherBService } from "../../indicator/cipher-b.service";
import { SuperTrendService } from "../../indicator/super-trend.service";
import { SignalEnum, SuperCipherEntity } from "./super-cipher.entity";
import { ThreeCommasService } from "../../3-commas/three-commas.service";

@Injectable()
export class SuperCipherService extends BaseStrategy {
  protected readonly logger = new Logger(SuperCipherService.name);
  private readonly pairs = process.env.pairs.split(",")?.map(p => p.trim());

  constructor(
    protected readonly tradingviewService: TradingviewService,
    private readonly cipherBService: CipherBService,
    private readonly superTrendService: SuperTrendService,
    @InjectRepository(SuperCipherEntity)
    private superCipherRepository: Repository<SuperCipherEntity>,
  ) {
    super(tradingviewService);
  }

  @Cron("1 * * * * *")
  async runStrategy() {
    const params = { exchange: "BINANCE", timeframe: "30" };
    await this.setRules(this.getRules());
    this.logger.log(`Running SuperCipherB Strategy`);
    for (const pair of this.pairs) {
      try {
        const market = `${params.exchange}:${pair}`;
        const chart = this.setChart({ market, timeframe: params.timeframe });
        const cipherB = await this.cipherBService.getIndicator(chart);
        const superTrend = await this.superTrendService.getIndicator(chart);
        const lastTrade = await this.getLastTrade(pair);
        if (lastTrade?.time === superTrend.$time) {
          // make time as a needed key and a part of resulting object
          continue;
        }
        await this.evaluate({ cipherB, superTrend, lastTrade, pair, timeframe: params.timeframe });
      } catch (e) {
        console.log("Error caught", e);
        this.logger.error(e);
      }
    }
    return "Done";
  }

  public getRules(): Rule[] {
    return [
      new Rule({
        name: "Super CipherB Long Strategy",
        when: [
          fact => fact.lastTrade?.type !== SignalEnum.LONG,
          fact => fact.cipherB.moneyFlow === "POSITIVE",
          fact => fact.cipherB.buyCircle,
          fact => fact.superTrend.upTrend,
        ],
        then: async fact => {
          await this.insertSignal({
            signal: JSON.stringify({ superTrend: fact.superTrend, cipherB: fact.cipherB }),
            pair: fact.pair,
            time: fact.superTrend.$time,
            timeframe: fact.timeframe,
            type: SignalEnum.LONG,
            reenter: false,
          });
          await ThreeCommasService.startNewDeal({ type: SignalEnum.LONG, pair: fact.pair });
        },
      }),
      new Rule({
        name: "Super CipherB Re-Enter Long Strategy",
        when: [
          fact => fact.lastTrade?.type === SignalEnum.LONG,
          fact => fact.cipherB.buyInOppositeArea,
          fact => fact.cipherB.moneyFlow === "POSITIVE",
          fact => fact.cipherB.buyCircle,
          fact => fact.superTrend.upTrend,
        ],
        then: async fact => {
          await this.insertSignal({
            signal: JSON.stringify({ superTrend: fact.superTrend, cipherB: fact.cipherB }),
            pair: fact.pair,
            time: fact.superTrend.$time,
            timeframe: fact.timeframe,
            type: SignalEnum.LONG,
            reenter: true,
          });
          await ThreeCommasService.startNewDeal({ type: SignalEnum.LONG, pair: fact.pair });
        },
      }),

      new Rule({
        name: "Super CipherB Short Strategy",
        when: [
          fact => fact.lastTrade?.type !== SignalEnum.SHORT,
          fact => fact.cipherB.moneyFlow === "NEGATIVE",
          fact => fact.cipherB.sellCircle,
          fact => fact.superTrend.downTrend,
        ],
        then: async fact => {
          await this.insertSignal({
            signal: JSON.stringify({ superTrend: fact.superTrend, cipherB: fact.cipherB }),
            pair: fact.pair,
            time: fact.superTrend.$time,
            timeframe: fact.timeframe,
            type: SignalEnum.SHORT,
            reenter: false,
          });
          await ThreeCommasService.startNewDeal({ type: SignalEnum.LONG, pair: fact.pair });
        },
      }),

      new Rule({
        name: "Super CipherB Re-Enter Short Strategy",
        when: [
          fact => fact.lastTrade?.type === SignalEnum.SHORT,
          fact => fact.cipherB.sellInOppositeArea,
          fact => fact.cipherB.moneyFlow === "NEGATIVE",
          fact => fact.cipherB.sellCircle,
          fact => fact.superTrend.downTrend,
        ],
        then: async fact => {
          await this.insertSignal({
            signal: JSON.stringify({ superTrend: fact.superTrend, cipherB: fact.cipherB }),
            pair: fact.pair,
            time: fact.superTrend.$time,
            timeframe: fact.timeframe,
            type: SignalEnum.SHORT,
            reenter: true,
          });
          await ThreeCommasService.startNewDeal({ type: SignalEnum.LONG, pair: fact.pair });
        },
      }),
    ];
  }

  public async insertSignal(data: {
    pair: string;
    type: SignalEnum;
    timeframe: string;
    time: number | string;
    signal: any;
    reenter: boolean;
  }): Promise<SuperCipherEntity> {
    const signal = SuperCipherEntity.create();
    signal.pair = data.pair;
    signal.type = data.type;
    signal.timeframe = "30";
    signal.time = Number(data.time);
    signal.signal = JSON.stringify(data);
    signal.reenter = data.reenter;
    this.logger.log(`Opening a new trade ${JSON.stringify(data)}`);
    await signal.save();
    return signal;
  }

  private getLastTrade(pair: string): Promise<SuperCipherEntity> {
    return this.superCipherRepository.findOne({
      where: { pair },
      order: { id: "DESC" },
    });
  }
}
