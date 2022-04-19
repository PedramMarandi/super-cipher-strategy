import { Controller, Get } from "@nestjs/common";
import { SuperCipherService } from "./super-cipher.service";

@Controller()
export class SuperCipherController {
  constructor(private readonly superCipherService: SuperCipherService) {}

  @Get("test")
  async test() {
    await this.superCipherService.runStrategy();
    // res.status(HttpStatus.OK).json(strategy);
    return 1;
  }
}
