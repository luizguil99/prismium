import type { Message } from 'ai';
import React, { Fragment } from 'react';
import { classNames } from '~/utils/classNames';
import { AssistantMessage } from './AssistantMessage';
import { UserMessage } from './UserMessage';
import { useLocation } from '@remix-run/react';
import { db, chatId } from '~/lib/persistence/useChatHistory';
import { forkChat } from '~/lib/persistence/db';
import { toast } from 'react-toastify';
import WithTooltip from '~/components/ui/Tooltip';

interface MessagesProps {
  id?: string;
  className?: string;
  isStreaming?: boolean;
  messages?: Message[];
}

export const Messages = React.forwardRef<HTMLDivElement, MessagesProps>((props: MessagesProps, ref) => {
  const { id, isStreaming = false, messages = [] } = props;
  const location = useLocation();

  const handleRewind = (messageId: string) => {
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('rewindTo', messageId);
    window.location.search = searchParams.toString();
  };

  const handleFork = async (messageId: string) => {
    try {
      if (!db || !chatId.get()) {
        toast.error('Chat persistence is not available');
        return;
      }

      const urlId = await forkChat(db, chatId.get()!, messageId);
      window.location.href = `/chat/${urlId}`;
    } catch (error) {
      toast.error('Failed to fork chat: ' + (error as Error).message);
    }
  };

  return (
    <div id={id} ref={ref} className={classNames(props.className, 'relative')}>
      {messages.length > 0
        ? messages.map((message, index) => {
            const { role, content, id: messageId, annotations } = message;
            const isUserMessage = role === 'user';
            const isFirst = index === 0;
            const isLast = index === messages.length - 1;
            const isHidden = annotations?.includes('hidden');

            if (isHidden) {
              return <Fragment key={index} />;
            }

            return (
              <div
                key={index}
                className={classNames(
                  'flex gap-4 w-full p-4 transition-colors duration-200',
                  {
                    'bg-[#09090B]': true,
                    'animate-fade-in': isLast && isStreaming,
                  }
                )}
              >
                {isUserMessage ? (
                  <div className="flex items-center justify-center w-[34px] h-[34px] overflow-hidden bg-blue-500/10 text-blue-400 rounded-full shrink-0 self-start border border-blue-500/30 transition-colors duration-200 hover:bg-blue-500/20">
                    <div className="i-ph:user-duotone text-xl"></div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center w-[34px] h-[34px] overflow-hidden bg-purple-500/10 text-purple-400 rounded-full shrink-0 self-start border border-purple-500/30 transition-colors duration-200 hover:bg-purple-500/20">
                    <div className="i-ph:robot-duotone text-xl"></div>
                  </div>
                )}

                <div className="grid grid-col-1 w-full">
                  {isUserMessage ? (
                    <UserMessage content={content} />
                  ) : (
                    <AssistantMessage content={content} annotations={message.annotations} />
                  )}
                </div>

                {!isUserMessage && (
                  <div className="flex gap-2 flex-col lg:flex-row">
                    {messageId && (
                      <WithTooltip tooltip="Reverter para esta mensagem">
                        <button
                          onClick={() => handleRewind(messageId)}
                          className={classNames(
                            'i-ph:arrow-counter-clockwise-duotone',
                            'text-xl text-purple-400 hover:text-purple-300 transition-colors duration-200',
                          )}
                        />
                      </WithTooltip>
                    )}

                    <WithTooltip tooltip="Criar nova ramificação a partir desta mensagem">
                      <button
                        onClick={() => handleFork(messageId)}
                        className={classNames(
                          'i-ph:git-fork-duotone',
                          'text-xl text-purple-400 hover:text-purple-300 transition-colors duration-200',
                        )}
                      />
                    </WithTooltip>
                  </div>
                )}
              </div>
            );
          })
        : null}
      {isStreaming && (
        <div className="flex justify-center w-full text-gray-400 p-4">
          <div className="i-svg-spinners:3-dots-fade text-4xl"></div>
        </div>
      )}
    </div>
  );
});
