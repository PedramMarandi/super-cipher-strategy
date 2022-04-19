import { SuperCipherService } from "./super-cipher.service";
import { Test } from "@nestjs/testing";
import { IndicatorModule } from "../../indicator/indicator.module";
import { TradingviewModule } from "../../tradingview/tradingview.module";
import { getRepositoryToken } from "@nestjs/typeorm";
import { SignalEnum, SuperCipherEntity } from "./super-cipher.entity";
import { Repository } from "typeorm";
import { ThreeCommasService } from "../../3-commas/three-commas.service";

jest.setTimeout(15000);
require("dotenv").config();

describe("SuperCipherB", () => {
  let service: SuperCipherService;
  let superCipherRepository: Repository<SuperCipherEntity>;
  const REPOSITORY_TOKEN = getRepositoryToken(SuperCipherEntity);
  const facts = {
    cipherB: {
      moneyFlow: "POSITIVE",
      buyCircle: true,
    },
    superTrend: {
      upTrend: true,
      $time: 455454,
    },
    pair: "BTCUSDT",
    timeframe: "30",
  };
  const shortFacts = {
    cipherB: {
      moneyFlow: "NEGATIVE",
      sellCircle: true,
    },
    superTrend: {
      downTrend: true,
      $time: 455454,
    },
    pair: "BTCUSDT",
    timeframe: "30",
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [IndicatorModule, TradingviewModule],
      providers: [
        SuperCipherService,
        {
          provide: REPOSITORY_TOKEN,
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = moduleRef.get(SuperCipherService);
    superCipherRepository = moduleRef.get<Repository<SuperCipherEntity>>(REPOSITORY_TOKEN);
    await service.setRules(service.getRules());
    jest.spyOn(ThreeCommasService, "startNewDeal").mockImplementationOnce(jest.fn());
    jest.spyOn(service, "insertSignal").mockImplementationOnce(jest.fn());
  });

  afterEach(() => {
    jest.spyOn(ThreeCommasService, "startNewDeal").mockClear();
    jest.spyOn(service, "insertSignal").mockClear();
  });

  it("Service Should be defined", () => {
    expect(service).toBeDefined();
  });

  it("SuperCipher repository should be defined", () => {
    expect(superCipherRepository).toBeDefined();
  });

  describe("SuperCipher Strategy", () => {
    describe("Long Conditions", () => {
      it("Should go long if CipherB MF is positive, CipherB Buy Dot exist and SuperTrend is upward", async () => {
        await service.evaluate(facts);
        expect(ThreeCommasService.startNewDeal).toBeCalledTimes(1);
        expect(service.insertSignal).toBeCalledWith({
          signal: JSON.stringify({
            superTrend: facts.superTrend,
            cipherB: facts.cipherB,
          }),
          pair: facts.pair,
          time: facts.superTrend.$time,
          timeframe: facts.timeframe,
          type: SignalEnum.LONG,
          reenter: false,
        });
      });
      it("If last signal is long, there cannot be any other long signal unless it is a re-entry", async () => {
        await service.evaluate({
          lastTrade: {
            type: SignalEnum.LONG,
          },
          ...facts,
        });
        expect(ThreeCommasService.startNewDeal).toBeCalledTimes(0);
      });
      it("If long exists and buy dot in opposite momentum exist, long re-entry can be called", async () => {
        await service.evaluate({
          ...facts,
          lastTrade: {
            type: SignalEnum.LONG,
          },
          cipherB: {
            ...facts.cipherB,
            buyInOppositeArea: true,
          },
        });
        expect(ThreeCommasService.startNewDeal).toBeCalledTimes(1);
        expect(service.insertSignal).toBeCalledWith({
          signal: JSON.stringify({
            superTrend: facts.superTrend,
            cipherB: {
              ...facts.cipherB,
              buyInOppositeArea: true,
            },
          }),
          pair: facts.pair,
          time: facts.superTrend.$time,
          timeframe: facts.timeframe,
          type: SignalEnum.LONG,
          reenter: true,
        });
      });
    });
    describe("Short Conditions", () => {
      it("Should go shirt if CipherB MF is negative, CipherB Sell Dot exist and SuperTrend is downward", async () => {
        await service.evaluate(shortFacts);
        expect(ThreeCommasService.startNewDeal).toBeCalledTimes(1);
        expect(service.insertSignal).toBeCalledWith({
          signal: JSON.stringify({
            superTrend: shortFacts.superTrend,
            cipherB: shortFacts.cipherB,
          }),
          pair: shortFacts.pair,
          time: shortFacts.superTrend.$time,
          timeframe: shortFacts.timeframe,
          type: SignalEnum.SHORT,
          reenter: false,
        });
      });
      it("If last signal is short, there cannot be any other short signal unless it is a re-entry", async () => {
        await service.evaluate({
          lastTrade: {
            type: SignalEnum.SHORT,
          },
          ...shortFacts,
        });
        expect(ThreeCommasService.startNewDeal).toBeCalledTimes(0);
      });
      it("If short condition is met and sell dot in opposite momentum area exist, short re-entry can be called", async () => {
        await service.evaluate({
          ...shortFacts,
          lastTrade: {
            type: SignalEnum.SHORT,
          },
          cipherB: {
            ...shortFacts.cipherB,
            sellInOppositeArea: true,
          },
        });
        expect(ThreeCommasService.startNewDeal).toBeCalledTimes(1);
        expect(service.insertSignal).toBeCalledWith({
          signal: JSON.stringify({
            superTrend: shortFacts.superTrend,
            cipherB: {
              ...shortFacts.cipherB,
              sellInOppositeArea: true,
            },
          }),
          pair: shortFacts.pair,
          time: shortFacts.superTrend.$time,
          timeframe: shortFacts.timeframe,
          type: SignalEnum.SHORT,
          reenter: true,
        });
      });
    });
  });
});
