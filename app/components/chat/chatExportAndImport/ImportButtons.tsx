import type { Message } from 'ai';
import { toast } from 'react-toastify';
import { ImportFolderButton } from '~/components/chat/ImportFolderButton';
import { Upload } from 'lucide-react';

export function ImportButtons(importChat: ((description: string, messages: Message[]) => Promise<void>) | undefined) {
  return (
    <div className="flex flex-col items-center justify-center w-auto">
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
      <div className="flex flex-col items-center gap-4 max-w-2xl text-center">
        <div className="flex gap-2">
          <button
            onClick={() => {
              const input = document.getElementById('chat-import');
              input?.click();
            }}
            className="px-4 py-2 rounded-lg bg-[#1A1F2A]/60 backdrop-blur-sm border border-[#2A2F3A]/50 text-gray-300 hover:bg-[#2A2F3A]/80 hover:border-blue-500/30 transition-all flex items-center gap-2"
          >
            <Upload className="w-4 h-4 text-blue-500" />
            Import Chat
          </button>
          <ImportFolderButton
            importChat={importChat}
            className="px-4 py-2 rounded-lg bg-[#1A1F2A]/60 backdrop-blur-sm border border-[#2A2F3A]/50 text-gray-300 hover:bg-[#2A2F3A]/80 hover:border-blue-500/30 transition-all flex items-center gap-2"
          />
        </div>
      </div>
    </div>
  );
}
