import { Module } from '@nestjs/common';
import { AuthUtilsService } from './utils/auth.utils';

@Module({
  providers: [AuthUtilsService],
  exports: [AuthUtilsService],
})
export class CommonModule {}