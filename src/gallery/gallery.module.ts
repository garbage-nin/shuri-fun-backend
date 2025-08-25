import { Module } from '@nestjs/common';
import { GalleryController } from './gallery.controller';
import { GalleryService } from '../gallery/gallery.service';
import { SupabaseService } from '../supabase/supabase.service';

@Module({
  controllers: [GalleryController],
  providers: [GalleryService, SupabaseService],
})
export class GalleryModule {}
