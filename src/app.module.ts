import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';

import { GalleryModule } from './gallery/gallery.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), GalleryModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
