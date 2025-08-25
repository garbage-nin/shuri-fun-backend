import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateGalleryDto } from './dto/create-gallery.dto';
import { UpdateGalleryDto } from './dto/update-gallery.dto';

@Injectable()
export class GalleryService {
  constructor(private readonly supabase: SupabaseService) {}

  async getImages(filters: {
    id?: string;
    title?: string;
    description?: string;
    type?: string;
  }) {
    const client = this.supabase.getClient();

    try {
      let query = client
        .from('gallery')
        .select('id, title, description, type, image_url, created_at');

      if (filters.id) {
        query = query.eq('id', filters.id);
      }
      if (filters.title) {
        query = query.ilike('title', `%${filters.title}%`);
      }
      if (filters.description) {
        query = query.ilike('description', `%${filters.description}%`);
      }
      if (filters.type) {
        query = query.eq('type', filters.type);
      }

      const { data, error } = await query.order('created_at', {
        ascending: false,
      });

      if (error) {
        return {
          success: false,
          message: 'Failed to fetch gallery images',
          error: error.message,
        };
      }

      return {
        success: true,
        message: 'Gallery images fetched successfully',
        data,
      };
    } catch (err: any) {
      return {
        success: false,
        message: 'Unexpected error occurred',
        error: err.message,
      };
    }
  }

  async addImage(file: Express.Multer.File, dto: CreateGalleryDto) {
    const client = this.supabase.getClient();

    try {
      const fileName = `${Date.now()}-${file.originalname}`;
      const { error: uploadError } = await client.storage
        .from('gallery-images')
        .upload(fileName, file.buffer, { contentType: file.mimetype });

      if (uploadError) {
        return {
          success: false,
          message: 'Failed to upload file',
          error: uploadError.message,
        };
      }

      const { data: publicData } = client.storage
        .from('gallery-images')
        .getPublicUrl(fileName);

      const imageUrl = publicData.publicUrl;

      const { data, error: insertError } = await client
        .from('gallery')
        .insert([
          {
            title: dto.title,
            description: dto.description,
            type: dto.type,
            image_url: imageUrl,
          },
        ])
        .select()
        .single();

      if (insertError) {
        return {
          success: false,
          message: 'Failed to insert into database',
          error: insertError.message,
        };
      }

      return {
        success: true,
        message: 'Image uploaded successfully',
        data,
      };
    } catch (err: any) {
      return {
        success: false,
        message: 'Unexpected error occurred',
        error: err.message,
      };
    }
  }

  async updateImage(
    id: string,
    file: Express.Multer.File | null,
    dto: UpdateGalleryDto,
  ) {
    const client = this.supabase.getClient();

    try {
      const { data: existing, error: fetchError } = await client
        .from('gallery')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !existing) {
        return {
          success: false,
          message: 'Image not found',
          error: fetchError?.message || null,
        };
      }

      let imageUrl = existing.image_url;

      if (file) {
        const oldFileName = existing.image_url.split('/').pop();
        await client.storage.from('gallery-images').remove([oldFileName]);

        const fileName = `${Date.now()}-${file.originalname}`;
        const { error: uploadError } = await client.storage
          .from('gallery-images')
          .upload(fileName, file.buffer, { contentType: file.mimetype });

        if (uploadError) {
          return {
            success: false,
            message: 'Failed to upload new file',
            error: uploadError.message,
          };
        }

        const { data: publicData } = client.storage
          .from('gallery-images')
          .getPublicUrl(fileName);

        imageUrl = publicData.publicUrl;
      }

      const { data, error: updateError } = await client
        .from('gallery')
        .update({
          title: dto.title ?? existing.title,
          description: dto.description ?? existing.description,
          type: dto.type ?? existing.type,
          image_url: imageUrl,
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        return {
          success: false,
          message: 'Failed to update database record',
          error: updateError.message,
        };
      }

      return {
        success: true,
        message: 'Image updated successfully',
        data,
      };
    } catch (err: any) {
      return {
        success: false,
        message: 'Unexpected error occurred',
        error: err.message,
      };
    }
  }

  async deleteImage(id: string) {
    const client = this.supabase.getClient();

    try {
      const { data: image, error: fetchError } = await client
        .from('gallery')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !image) {
        return {
          success: false,
          message: 'Image not found',
          error: fetchError?.message || null,
        };
      }

      const fileName = image.image_url.split('/').pop();

      const { error: storageError } = await client.storage
        .from('gallery-images')
        .remove([fileName]);

      if (storageError) {
        return {
          success: false,
          message: 'Failed to delete file from storage',
          error: storageError.message,
        };
      }

      const { error: deleteError } = await client
        .from('gallery')
        .delete()
        .eq('id', id);

      if (deleteError) {
        return {
          success: false,
          message: 'Failed to delete database record',
          error: deleteError.message,
        };
      }

      return {
        success: true,
        message: 'Image deleted successfully',
        data: { id },
      };
    } catch (err: any) {
      return {
        success: false,
        message: 'Unexpected error occurred',
        error: err.message,
      };
    }
  }
}
