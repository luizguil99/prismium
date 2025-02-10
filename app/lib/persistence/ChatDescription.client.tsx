import { useStore } from '@nanostores/react';
import { TooltipProvider } from '@radix-ui/react-tooltip';
import WithTooltip from '~/components/ui/Tooltip';
import { useEditChatDescription } from '~/lib/hooks';
import { description as descriptionStore } from '~/lib/persistence';

export function ChatDescription() {
  const initialDescription = useStore(descriptionStore)!;

  const { editing, handleChange, handleBlur, handleSubmit, handleKeyDown, currentDescription, toggleEditMode } =
    useEditChatDescription({
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
            className="bg-bolt-elements-background-depth-1 text-bolt-elements-textPrimary rounded px-2 mr-2 w-fit"
            autoFocus
            value={currentDescription}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            style={{ width: `${Math.max(currentDescription.length * 8, 100)}px` }}
          />
          <TooltipProvider>
            <WithTooltip tooltip="Save title">
              <div className="flex justify-between items-center p-2 rounded-md hover:bg-zinc-800/50">
                <button
                  type="submit"
                  className="i-ph:check-bold text-lg text-zinc-400 hover:text-purple-400 transition-colors"
                  onMouseDown={handleSubmit}
                />
              </div>
            </WithTooltip>
          </TooltipProvider>
        </form>
      ) : (
        <div className="flex items-center gap-2 group">
          <span className="text-base">{currentDescription}</span>
          <TooltipProvider>
            <WithTooltip tooltip="Rename chat">
              <button
                type="button"
                className="p-1.5 rounded-md bg-[#09090B] text-purple-400 transition-colors"
                onClick={(event) => {
                  event.preventDefault();
                  toggleEditMode();
                }}
              >
                <div className="i-ph:note-pencil text-sm" />
              </button>
            </WithTooltip>
          </TooltipProvider>
        </div>
      )}
    </div>
  );
}
