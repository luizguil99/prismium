import ignore from 'ignore';
import { useGit } from '~/lib/hooks/useGit';
import type { Message } from 'ai';
import { detectProjectCommands, createCommandsMessage } from '~/utils/projectCommands';
import { generateId } from '~/utils/fileUtils';
import { useState } from 'react';
import { toast } from 'react-toastify';
import { LoadingOverlay } from '~/components/ui/LoadingOverlay';
import { Github } from 'lucide-react';

const IGNORE_PATTERNS = [
  'node_modules/**',
  '.git/**',
  '.github/**',
  '.vscode/**',
  '**/*.jpg',
  '**/*.jpeg',
  '**/*.png',
  'dist/**',
  'build/**',
  '.next/**',
  'coverage/**',
  '.cache/**',
  '.vscode/**',
  '.idea/**',
  '**/*.log',
  '**/.DS_Store',
  '**/npm-debug.log*',
  '**/yarn-debug.log*',
  '**/yarn-error.log*',
  '**/*lock.json',
  '**/*lock.yaml',
];

const ig = ignore().add(IGNORE_PATTERNS);

const MAX_FILE_SIZE = 100 * 1024; // 100KB limit per file
const MAX_TOTAL_SIZE = 500 * 1024; // 500KB total limit

interface GitCloneButtonProps {
  className?: string;
  importChat?: (description: string, messages: Message[]) => Promise<void>;
}

export default function GitCloneButton({ importChat }: GitCloneButtonProps) {
  const { ready, gitClone } = useGit();
  const [loading, setLoading] = useState(false);

  const onClick = async (_e: any) => {
    if (!ready) {
      return;
    }

    const repoUrl = prompt('Enter the Git url');

    if (repoUrl) {
      setLoading(true);

      try {
        const { workdir, data } = await gitClone(repoUrl);

        if (importChat) {
          const filePaths = Object.keys(data).filter((filePath) => !ig.ignores(filePath));
          const textDecoder = new TextDecoder('utf-8');

          let totalSize = 0;
          const skippedFiles: string[] = [];
          const fileContents = [];

          for (const filePath of filePaths) {
            const { data: content, encoding } = data[filePath];

            // Skip binary files
            if (
              content instanceof Uint8Array &&
              !filePath.match(/\.(txt|md|astro|mjs|js|jsx|ts|tsx|json|html|css|scss|less|yml|yaml|xml|svg)$/i)
            ) {
              skippedFiles.push(filePath);
              continue;
            }

            try {
              const textContent =
                encoding === 'utf8' ? content : content instanceof Uint8Array ? textDecoder.decode(content) : '';

              if (!textContent) {
                continue;
              }

              // Check file size
              const fileSize = new TextEncoder().encode(textContent).length;

              if (fileSize > MAX_FILE_SIZE) {
                skippedFiles.push(`${filePath} (too large: ${Math.round(fileSize / 1024)}KB)`);
                continue;
              }

              // Check total size
              if (totalSize + fileSize > MAX_TOTAL_SIZE) {
                skippedFiles.push(`${filePath} (would exceed total size limit)`);
                continue;
              }

              totalSize += fileSize;
              fileContents.push({
                path: filePath,
                content: textContent,
              });
            } catch (e: any) {
              skippedFiles.push(`${filePath} (error: ${e.message})`);
            }
          }

          const commands = await detectProjectCommands(fileContents);
          const commandsMessage = createCommandsMessage(commands);

          const filesMessage: Message = {
            role: 'assistant',
            content: `Cloning the repo ${repoUrl} into ${workdir}
${skippedFiles.length > 0 
  ? `\nSkipped files (${skippedFiles.length}):
${skippedFiles.map(f => `- ${f}`).join('\n')}`
  : ''}

<boltArtifact id="imported-files" title="Git Cloned Files" type="bundled">
${fileContents
  .map(
    (file) =>
      `<boltAction type="file" filePath="${file.path}">
${file.content}
</boltAction>`,
  )
  .join('\n')}
</boltArtifact>`,
            id: generateId(),
            createdAt: new Date(),
          };

          const messages = [filesMessage];

          if (commandsMessage) {
            messages.push(commandsMessage);
          }

          await importChat(`Git Project:${repoUrl.split('/').slice(-1)[0]}`, messages);
        }
      } catch (error) {
        console.error('Error during import:', error);
        toast.error('Failed to import repository');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <>
      <button
        onClick={onClick}
        title="Clone a Git Repo"
        className="flex items-center gap-2 px-3 py-2 text-gray-300  hover:bg-[#2A2F3A]/20 rounded-lg transition-all bg-transparent"
      >
        <Github className="w-4 h-4 text-blue-500" />
        <span>Git Clone</span>
      </button>
      {loading && <LoadingOverlay message="Please wait while we clone the repository..." />}
    </>
  );
}
