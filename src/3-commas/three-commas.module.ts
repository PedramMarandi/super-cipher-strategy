import { Module } from "@nestjs/common";
import { ThreeCommasService } from "./three-commas.service";

@Module({
  providers: [ThreeCommasService],
  exports: [ThreeCommasService],
})
export class ThreeCommasModule {}
