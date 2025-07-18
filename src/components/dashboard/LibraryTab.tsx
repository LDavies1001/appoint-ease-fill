import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/custom-button';
import { Upload, Image } from 'lucide-react';
import { useImageLibrary } from '@/hooks/useImageLibrary';
import ServiceFolders from './ServiceFolders';
import GeneralImages from './GeneralImages';

const LibraryTab = () => {
  const { images, serviceFolders, loading, refreshData, deleteImage } = useImageLibrary();

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-foreground">Image Library</h2>
      </div>

      <div className="space-y-6">
        {/* Service Folders */}
        <ServiceFolders serviceFolders={serviceFolders} onRefresh={refreshData} />

        {/* General Images */}
        <GeneralImages 
          images={images} 
          onRefresh={refreshData} 
          onDeleteImage={deleteImage} 
        />

        {/* Empty State */}
        {serviceFolders.length === 0 && images.length === 0 && (
          <Card className="card-elegant p-8 text-center">
            <Image className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No images uploaded yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Create services to automatically get organized photo folders, or upload general images
            </p>
            <Button
              variant="outline"
              onClick={() => document.getElementById('general-upload')?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Your First Image
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
};

export default LibraryTab;