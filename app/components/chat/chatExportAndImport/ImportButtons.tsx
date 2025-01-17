import type { Message } from 'ai';
import { toast } from 'react-toastify';
import { ImportFolderButton } from '~/components/chat/ImportFolderButton';
import { Upload, FolderUp } from 'lucide-react';

export function ImportButtons(importChat: ((description: string, messages: Message[]) => Promise<void>) | undefined) {
  return (
    <div className="flex flex-col gap-2">
      <input
        type="file"
        id="chat-import"
        className="hidden"
        accept=".json"
        onChange={async (e) => {
          const file = e.target.files?.[0];

          if (file && importChat) {
            try {
              const reader = new FileReader();

              reader.onload = async (e) => {
                try {
                  const content = e.target?.result as string;
                  const data = JSON.parse(content);

                  if (!Array.isArray(data.messages)) {
                    toast.error('Invalid chat file format');
                  }

                  await importChat(data.description, data.messages);
                  toast.success('Chat imported successfully');
                } catch (error: unknown) {
                  if (error instanceof Error) {
                    toast.error('Failed to parse chat file: ' + error.message);
                  } else {
                    toast.error('Failed to parse chat file');
                  }
                }
              };
              reader.onerror = () => toast.error('Failed to read chat file');
              reader.readAsText(file);
            } catch (error) {
              toast.error(error instanceof Error ? error.message : 'Failed to import chat');
            }
            e.target.value = ''; // Reset file input
          } else {
            toast.error('Something went wrong');
          }
        }}
      />
      <button
        onClick={() => {
          const input = document.getElementById('chat-import');
          input?.click();
        }}
        className="flex items-center gap-2 px-3 py-2 text-gray-300 hover:bg-[#2A2F3A]/20 rounded-lg transition-all bg-[#2A2F3A]/10"
      >
        <Upload className="w-4 h-4 text-blue-500" />
        <span>Import Chat</span>
      </button>
      <ImportFolderButton
        importChat={importChat}
        className="flex items-center gap-2 px-3 py-2 text-gray-300 hover:bg-[#2A2F3A]/20 rounded-lg transition-all bg-[#2A2F3A]/10"
      >
        <FolderUp className="w-4 h-4 text-blue-500" />
        <span>Import Folder</span>
      </ImportFolderButton>
    </div>
  );
}
