import { useStore } from '@nanostores/react';
import { TooltipProvider } from '@radix-ui/react-tooltip';
import WithTooltip from '~/components/ui/Tooltip';
import { useEditChatDescription } from '~/lib/hooks';
import { description as descriptionStore } from '~/lib/persistence';
import { Pencil } from 'lucide-react';
import { classNames } from '~/utils/classNames';

export function ChatDescription() {
  const initialDescription = useStore(descriptionStore)!;

  const { 
    editing, 
    handleChange, 
    handleBlur, 
    handleSubmit, 
    handleKeyDown, 
    currentDescription, 
    toggleEditMode 
  } = useEditChatDescription({
    initialDescription,
    syncWithGlobalStore: true,
  });

  if (!initialDescription) {
    // doing this to prevent showing edit button until chat description is set
    return null;
  }

  return (
    <div className="flex items-center">
      {editing ? (
        <form onSubmit={handleSubmit} className="flex items-center">
          <input
            type="text"
            className="bg-zinc-800/50 text-zinc-200 rounded-md px-2.5 py-1 mr-2 text-sm font-medium border border-zinc-700/50 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
            autoFocus
            value={currentDescription}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            maxLength={50}
            style={{ width: `${Math.min(Math.max(currentDescription.length * 8, 120), 250)}px` }}
          />
          <TooltipProvider>
            <WithTooltip tooltip="Save title">
              <button
                type="submit"
                className="flex items-center justify-center w-6 h-6 rounded-md bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSubmit(e);
                }}
              >
                <div className="i-ph:check-bold text-sm" />
              </button>
            </WithTooltip>
          </TooltipProvider>
        </form>
      ) : (
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <WithTooltip tooltip={currentDescription}>
              <span
                className={classNames(
                  'text-sm font-medium text-zinc-200',
                  'max-w-[180px] sm:max-w-[220px] md:max-w-[250px] truncate',
                )}
              >
                {currentDescription}
              </span>
            </WithTooltip>
          </TooltipProvider>
          <TooltipProvider>
            <WithTooltip tooltip="Rename chat">
              <button
                type="button"
                className="flex items-center justify-center w-6 h-6 rounded-md bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-blue-400 transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  toggleEditMode();
                }}
              >
                <Pencil size={12} />
              </button>
            </WithTooltip>
          </TooltipProvider>
        </div>
      )}
    </div>
  );
}
