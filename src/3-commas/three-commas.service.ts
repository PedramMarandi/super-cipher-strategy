import { API } from "3commas-typescript";
import { Injectable, Logger } from "@nestjs/common";
import { SignalEnum } from "../strategy/super-cipher/super-cipher.entity";

@Injectable()
export class ThreeCommasService {
  static async startNewDeal(data: { pair: string; type: SignalEnum }): Promise<any> {
    if (process.env.ENV === "development") {
      new Logger(ThreeCommasService.name).warn(`3Commas is disabled in development mode`);
      return;
    }

    if (data.type === SignalEnum.SHORT) {
      console.log("SHORT BOT IS DISABLED");
      return;
    }
    const client = ThreeCommasService.client();
    const botId = process.env["3C_BOT_ID"];
    return client.customRequest("POST", 1, `/bots/${botId}/start_new_deal`, {
      pair: ThreeCommasService.getPairName(data.pair),
      bot_id: botId,
    });
  }

  private static client(): API {
    return new API({
      key: process.env["3C_KEY"], // Optional if only query endpoints with no security requirement
      secrets: process.env["3C_SECRET"], // Optional
      timeout: 60000, // Optional, in ms, default to 30000
      forcedMode: "paper",
      errorHandler: (response, reject) => {
        const { error, error_description } = response;
        console.log(error);
        console.log(error_description);
        reject(new Error(error_description ?? error));
      },
    });
  }

  private static getPairName(pair) {
    return `USDT_${pair.replace("USDT", "")}`;
  }
}
