import React from 'react';
import { classNames } from '~/utils/classNames';

interface ErrorMessageProps {
  message: string;
  details?: string;
  className?: string;
}

export function ErrorMessage({ message, details, className }: ErrorMessageProps) {
  return (
    <div className={classNames(
      'bg-red-100 dark:bg-red-900/30 p-4 rounded-md my-3',
      className || ''
    )}>
      <p className="text-red-800 dark:text-red-400 font-medium">{message}</p>
      {details && (
        <p className="text-sm text-red-700 dark:text-red-500 mt-1">{details}</p>
      )}
    </div>
  );
}

export function ProjectLimitErrorMessage() {
  return (
    <ErrorMessage 
      message="Limite de projetos gratuitos atingido"
      details="Alguns membros da organização atingiram o limite máximo de projetos gratuitos. Para continuar, você precisa excluir, pausar ou fazer upgrade de um ou mais destes projetos."
    />
  );
} 