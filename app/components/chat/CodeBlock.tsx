import { memo, useEffect, useState } from 'react';
import { bundledLanguages, codeToHtml, isSpecialLang, type BundledLanguage, type SpecialLanguage } from 'shiki';
import { classNames } from '~/utils/classNames';
import { createScopedLogger } from '~/utils/logger';

import styles from './CodeBlock.module.scss';

const logger = createScopedLogger('CodeBlock');

interface CodeBlockProps {
  className?: string;
  code: string;
  language?: BundledLanguage | SpecialLanguage;
  theme?: 'light-plus' | 'dark-plus';
  disableCopy?: boolean;
}

export const CodeBlock = memo(
  ({ className, code, language = 'plaintext', theme = 'dark-plus', disableCopy = false }: CodeBlockProps) => {
    const [html, setHTML] = useState<string | undefined>(undefined);
    const [copied, setCopied] = useState(false);

    const copyToClipboard = () => {
      if (copied) {
        return;
      }

      navigator.clipboard.writeText(code);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    };

    useEffect(() => {
      if (language && !isSpecialLang(language) && !(language in bundledLanguages)) {
        logger.warn(`Unsupported language '${language}'`);
      }

      logger.trace(`Language = ${language}`);

      const processCode = async () => {
        setHTML(await codeToHtml(code, { lang: language, theme }));
      };

      processCode();
    }, [code]);

    return (
      <div className={classNames('relative group text-left rounded-lg overflow-hidden border border-bolt-elements-borderColor', className)}>
        <div className="flex items-center justify-between px-4 py-2 bg-bolt-elements-bg-depth-2 border-b border-bolt-elements-borderColor">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-bolt-elements-textSecondary uppercase">{language}</span>
          </div>
          <div
            className={classNames(
              'flex items-center transition-all duration-200',
              {
                'opacity-100': copied || !disableCopy,
                'opacity-0': !copied && disableCopy,
              }
            )}
          >
            {!disableCopy && (
              <button
                className={classNames(
                  'flex items-center gap-2 px-2 py-1 rounded-md transition-all duration-200 bg-transparent',
                  {
                    'bg-green-500/10 text-green-500': copied,
                    'hover:bg-bolt-elements-bg-depth-3': !copied,
                  }
                )}
                title={copied ? "Copied!" : "Copy Code"}
                onClick={() => copyToClipboard()}
              >
                <div className={classNames(
                  'transition-all duration-200',
                  copied ? 'i-ph:check-circle-duotone' : 'i-ph:clipboard-text-duotone'
                )}></div>
                <span className="text-xs">
                  {copied ? 'Copied!' : 'Copy'}
                </span>
              </button>
            )}
          </div>
        </div>
        <div className="p-4 overflow-x-auto">
          <div dangerouslySetInnerHTML={{ __html: html ?? '' }}></div>
        </div>
      </div>
    );
  },
);
