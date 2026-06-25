import { Global, Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { R2Service } from './r2.service';

@Global()
@Module({
  controllers: [UploadController],
  providers: [R2Service, UploadService],
  exports: [R2Service, UploadService],
})
export class UploadModule {}
