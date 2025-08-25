import { IsString, IsArray, IsOptional } from 'class-validator';

export class CreateGalleryDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsArray()
  @IsString({ each: true })
  type: string[];

  @IsString()
  @IsOptional()
  imageUrl?: string;
}
