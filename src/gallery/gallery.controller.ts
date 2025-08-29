import {
  Controller,
  Get,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  UsePipes,
  ValidationPipe,
  Query,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { GalleryService } from './gallery.service';
import { CreateGalleryDto } from './dto/create-gallery.dto';
import { UpdateGalleryDto } from './dto/update-gallery.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('gallery')
export class GalleryController {
  constructor(private readonly galleryService: GalleryService) {}

  @Get()
  async getImages(
    @Query('id') id?: string,
    @Query('title') title?: string,
    @Query('description') description?: string,
    @Query('type') type?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return this.galleryService.getImages({
      id,
      title,
      description,
      type,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });
  }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async addImage(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateGalleryDto,
  ) {
    const result = await this.galleryService.addImage(file, dto);
    return {
      statusCode: result.success ? 201 : 400,
      ...result,
    };
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('file'))
  async updateImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UpdateGalleryDto,
  ) {
    const result = await this.galleryService.updateImage(id, file, dto);
    return {
      statusCode: result.success ? 200 : 400,
      ...result,
    };
  }

  @Delete(':id')
  async deleteImage(@Param('id') id: string) {
    const result = await this.galleryService.deleteImage(id);

    if (result.success) {
      return {
        statusCode: 200,
        ...result,
      };
    } else {
      return {
        statusCode: 400,
        ...result,
      };
    }
  }
}
