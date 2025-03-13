/**
 * Starter Template Selection Module
 * 
 * This module provides functionality to select and implement starter templates for projects.
 * It handles:
 * - Template selection based on user requirements using LLM
 * - Parsing LLM output to identify the selected template
 * - Fetching template content from GitHub repositories
 * - Filtering files based on ignore patterns
 * - Preparing template files for import into the project
 * 
 * The module exposes main functions:
 * - selectStarterTemplate: Communicates with LLM to choose appropriate template
 * - getTemplates: Fetches and prepares files from the selected template
 */

import ignore from 'ignore';
import type { ProviderInfo } from '~/types/model';
import type { Template } from '~/types/template';
import { STARTER_TEMPLATES } from './constants';
import Cookies from 'js-cookie';

/**
 * Creates a prompt for the LLM to select the appropriate starter template
 * This function formats all available templates in XML structure for the AI to process
 * 
 * @param templates - Array of available template objects
 * @returns Formatted prompt string for the LLM with instructions
 */
const starterTemplateSelectionPrompt = (templates: Template[]) => `
You are an experienced developer who helps people choose the best starter template for their projects.

Available templates:
<template>
  <name>blank</name>
  <description>Empty starter for simple scripts and trivial tasks that don't require a full template setup</description>
  <tags>basic, script</tags>
</template>
${templates
  .map(
    (template) => `
<template>
  <name>${template.name}</name>
  <description>${template.description}</description>
  ${template.tags ? `<tags>${template.tags.join(', ')}</tags>` : ''}
</template>
`,
  )
  .join('\n')}

Response Format:
<selection>
  <templateName>{selected template name}</templateName>
  <title>{a proper title for the project}</title>
</selection>

Examples:

<example>
User: I need to build a todo app
Response:
<selection>
  <templateName>react-basic-starter</templateName>
  <title>Simple React todo application</title>
</selection>
</example>

<example>
User: Write a script to generate numbers from 1 to 100
Response:
<selection>
  <templateName>blank</templateName>
  <title>script to generate numbers from 1 to 100</title>
</selection>
</example>

Instructions:
1. For trivial tasks and simple scripts, always recommend the blank template
2. For more complex projects, recommend templates from the provided list
3. Follow the exact XML format
4. Consider both technical requirements and tags
5. If no perfect match exists, recommend the closest option
6.For html, css and js projects, always recommend the blank template
Important: Provide only the selection tags in your response, no additional text.
`;

// Get templates from the constants file
const templates: Template[] = STARTER_TEMPLATES;

/**
 * Parses the LLM output to extract the selected template name and title
 * 
 * @param llmOutput - The raw text response from the LLM
 * @returns Object containing template name and title, or null if parsing fails
 */
const parseSelectedTemplate = (llmOutput: string): { template: string; title: string } | null => {
  try {
    // Extract content between <templateName> tags
    const templateNameMatch = llmOutput.match(/<templateName>(.*?)<\/templateName>/);
    const titleMatch = llmOutput.match(/<title>(.*?)<\/title>/);

    if (!templateNameMatch) {
      return null;
    }

    return { template: templateNameMatch[1].trim(), title: titleMatch?.[1].trim() || 'Untitled Project' };
  } catch (error) {
    console.error('Error parsing template selection:', error);
    return null;
  }
};

/**
 * Main function to communicate with the LLM to select an appropriate starter template
 * Makes an API call to the LLM with the user's message and processes the response
 * 
 * @param options - Object containing message, model, and provider info
 * @returns Promise with the selected template and title, or default if parsing fails
 */
export const selectStarterTemplate = async (options: { message: string; model: string; provider: ProviderInfo }) => {
  const { message, model, provider } = options;
  // Prepare request body for LLM API call
  const requestBody = {
    message,
    model,
    provider,
    system: starterTemplateSelectionPrompt(templates),
  };
  const response = await fetch('/api/llmcall', {
    method: 'POST',
    body: JSON.stringify(requestBody),
  });
  const respJson: { text: string } = await response.json();
  console.log(respJson);

  const { text } = respJson;
  const selectedTemplate = parseSelectedTemplate(text);

  if (selectedTemplate) {
    return selectedTemplate;
  } else {
    console.log('No template selected, using blank template');

    return {
      template: 'blank',
      title: '',
    };
  }
};

/**
 * Fetches content from a GitHub repository
 * Recursively retrieves all files from a repo or specific path
 * 
 * @param repoName - The GitHub repository name (owner/repo)
 * @param path - Optional path within the repository to fetch
 * @returns Promise with array of file objects containing name, path, and content
 */
const getGitHubRepoContent = async (
  repoName: string,
  path: string = '',
): Promise<{ name: string; path: string; content: string }[]> => {
  const baseUrl = 'https://api.github.com';

  try {
    // Get GitHub token from cookies or environment variables
    const token = Cookies.get('githubToken') || import.meta.env.VITE_GITHUB_ACCESS_TOKEN;

    const headers: HeadersInit = {
      Accept: 'application/vnd.github.v3+json',
    };

    // Add GitHub token to headers if available
    if (token) {
      headers.Authorization = 'token ' + token;
    }

    // Fetch contents of the path
    const response = await fetch(`${baseUrl}/repos/${repoName}/contents/${path}`, {
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: any = await response.json();

    // Handle single file response
    if (!Array.isArray(data)) {
      if (data.type === 'file') {
        // If it's a file, get its content
        const content = atob(data.content); // Decode base64 content
        return [
          {
            name: data.name,
            path: data.path,
            content,
          },
        ];
      }
    }

    // Process directory contents recursively
    const contents = await Promise.all(
      data.map(async (item: any) => {
        if (item.type === 'dir') {
          // Recursively get contents of subdirectories
          return await getGitHubRepoContent(repoName, item.path);
        } else if (item.type === 'file') {
          // Fetch file content
          const fileResponse = await fetch(item.url, {
            headers,
          });
          const fileData: any = await fileResponse.json();
          const content = atob(fileData.content); // Decode base64 content

          return [
            {
              name: item.name,
              path: item.path,
              content,
            },
          ];
        }

        return [];
      }),
    );

    // Flatten the array of contents
    return contents.flat();
  } catch (error) {
    console.error('Error fetching repo contents:', error);
    throw error;
  }
};

/**
 * Main function to retrieve and prepare template files
 * Finds the template, fetches its files, applies filters and prepares them for import
 * 
 * @param templateName - Name of the selected template
 * @param title - Optional title for the project
 * @returns Promise with formatted assistant and user messages containing the template files
 */
export async function getTemplates(templateName: string, title?: string) {
  // Find the template object by name
  const template = STARTER_TEMPLATES.find((t) => t.name == templateName);

  if (!template) {
    return null;
  }

  // Get the GitHub repo associated with the template
  const githubRepo = template.githubRepo;
  // Fetch all files from the GitHub repo
  const files = await getGitHubRepoContent(githubRepo);

  let filteredFiles = files;

  /*
   * Apply filters to exclude unwanted files
   */
  
  // Exclude .git files
  filteredFiles = filteredFiles.filter((x) => x.path.startsWith('.git') == false);

  // Exclude common lock files
  const comminLockFiles = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'];
  filteredFiles = filteredFiles.filter((x) => comminLockFiles.includes(x.name) == false);

  // Exclude .bolt directory files
  filteredFiles = filteredFiles.filter((x) => x.path.startsWith('.bolt') == false);

  // Check for ignore file in .bolt folder
  const templateIgnoreFile = files.find((x) => x.path.startsWith('.bolt') && x.name == 'ignore');

  const filesToImport = {
    files: filteredFiles,
    ignoreFile: [] as typeof filteredFiles,
  };

  // Apply custom ignore patterns if available
  if (templateIgnoreFile) {
    // Get ignore patterns from the ignore file
    const ignorepatterns = templateIgnoreFile.content.split('\n').map((x) => x.trim());
    const ig = ignore().add(ignorepatterns);

    // Find files that match ignore patterns
    const ignoredFiles = filteredFiles.filter((x) => ig.ignores(x.path));

    filesToImport.files = filteredFiles;
    filesToImport.ignoreFile = ignoredFiles;
  }

  const assistantMessage = `
<boltArtifact id="imported-files" title="${title || 'Importing Starter Files'}" type="bundled">
${filesToImport.files
  .map(
    (file) =>
      `<boltAction type="file" filePath="${file.path}">
${file.content}
</boltAction>`,
  )
  .join('\n')}
</boltArtifact>
`;
  let userMessage = ``;
  const templatePromptFile = files.filter((x) => x.path.startsWith('.bolt')).find((x) => x.name == 'prompt');

  if (templatePromptFile) {
    userMessage = `
TEMPLATE INSTRUCTIONS:
${templatePromptFile.content}

IMPORTANT: Dont Forget to install the dependencies before running the app
---
`;
  }

  if (filesToImport.ignoreFile.length > 0) {
    userMessage =
      userMessage +
      `
STRICT FILE ACCESS RULES - READ CAREFULLY:

The following files are READ-ONLY and must never be modified:
${filesToImport.ignoreFile.map((file) => `- ${file.path}`).join('\n')}

Permitted actions:
✓ Import these files as dependencies
✓ Read from these files
✓ Reference these files

Strictly forbidden actions:
❌ Modify any content within these files
❌ Delete these files
❌ Rename these files
❌ Move these files
❌ Create new versions of these files
❌ Suggest changes to these files

Any attempt to modify these protected files will result in immediate termination of the operation.

If you need to make changes to functionality, create new files instead of modifying the protected ones listed above.
---
`;
  }

  userMessage += `
---
template import is done, and you can now use the imported files,
edit only the files that need to be changed, and you can create new files as needed.
NO NOT EDIT/WRITE ANY FILES THAT ALREADY EXIST IN THE PROJECT AND DOES NOT NEED TO BE MODIFIED
---
Now that the Template is imported please continue with my original request
`;

  return {
    assistantMessage,
    userMessage,
  };
}
