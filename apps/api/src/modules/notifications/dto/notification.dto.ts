import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RegisterDeviceDto {
  @ApiProperty()
  @IsString()
  fcmToken!: string;

  @ApiProperty()
  @IsString()
  deviceId!: string;
}
