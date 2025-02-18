import { IconButton } from '~/components/ui/IconButton';
import { getOrCreateClient } from '~/components/supabase/client';
import { toast } from 'react-toastify';

interface AddImageToYourProjectProps {
  imageDataList: string[];
  setImageDataList?: (dataList: string[]) => void;
  setImageContexts: (callback: (prev: string[]) => string[]) => void;
}

export const AddImageToYourProject = ({ 
  imageDataList, 
  setImageDataList, 
  setImageContexts 
}: AddImageToYourProjectProps) => {
  const handleImageUpload = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          // Mostra preview antes do upload
          const reader = new FileReader();
          reader.onload = (e) => {
            const base64Image = e.target?.result as string;
            setImageDataList?.([...imageDataList, base64Image]);
          };
          reader.readAsDataURL(file);

          const supabase = getOrCreateClient();
          const fileExt = file.name.split('.').pop();
          const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
          const filePath = `project-images/${fileName}`;

          const { data, error: uploadError } = await supabase.storage
            .from('components-previews')
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('components-previews')
            .getPublicUrl(filePath);

          // Armazena o contexto da imagem sem mostrar no input
          setImageContexts(prev => [...prev, `Context: Image uploaded to ${publicUrl}`]);
          
          toast.success('Imagem enviada com sucesso! A imagem será incluída no contexto da mensagem.');
        } catch (error) {
          console.error('Erro ao fazer upload:', error);
          toast.error('Erro ao fazer upload da imagem');
          // Remove a preview se o upload falhar
          setImageDataList?.(imageDataList.slice(0, -1));
        }
      }
    };
    input.click();
  };

  return (
    <IconButton
      title="Add Image To Your Project"
      className="p-2 rounded-lg bg-[#111113] border border-zinc-800/50 text-gray-400 hover:text-blue-500 hover:border-blue-500/30 transition-all duration-200"
      onClick={handleImageUpload}
    >
      <div className="i-ph:image-square text-xl"></div>
    </IconButton>
  );
};
