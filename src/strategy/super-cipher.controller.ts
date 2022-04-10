import { Controller } from "@nestjs/common";
import { SuperCipherService } from "./super-cipher.service";

@Controller()
export class SuperCipherController {
  constructor(private readonly superCipherService: SuperCipherService) {
  }

  // @Get("test")
  // async test(@Res() res: Response) {
  //   const strategy = await this.superCipherService.runStrategy();
  //   res.status(HttpStatus.OK).json(strategy);
  // }
}
