import React, { useState, useEffect, useRef, useMemo } from 'react';
import { webcontainer } from '~/lib/webcontainer';
import { toast } from 'react-toastify';

const COMMANDS = [
  '@allfiles',
  '@addfiles',
  '@help'
];

interface CommandCardProps {
  isVisible: boolean;
  onSelect: (command: string) => void;
  searchTerm: string;
}

// Interface for a formatted file with display information
interface FormattedFile {
  path: string;
  name: string;
  isDirectory: boolean;
  level: number;
  extension: string;
  children?: FormattedFile[];
}

export const CommandCard: React.FC<CommandCardProps> = ({ isVisible, onSelect, searchTerm }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showFilesList, setShowFilesList] = useState(false);
  const [files, setFiles] = useState<string[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Extrair o token com @ do searchTerm
  const atTokens = searchTerm.split(/\s+/).filter(token => token.includes('@'));
  const activeAtToken = atTokens.length > 0 ? atTokens[atTokens.length - 1] : '';
  
  // Extract the actual search term after the @ symbol
  const actualSearchTerm = activeAtToken ? activeAtToken.substring(activeAtToken.indexOf('@') + 1) : '';

  // Filter commands by search term
  const filteredCommands = COMMANDS.filter(cmd => 
    cmd.toLowerCase().includes('@' + actualSearchTerm.toLowerCase())
  );

  // Function to format file hierarchy
  const formatFilesHierarchy = (fileList: string[]): FormattedFile[] => {
    const root: FormattedFile[] = [];
    const map: Record<string, FormattedFile> = {};

    // First step: create all needed directory nodes
    fileList.forEach(path => {
      const parts = path.split('/').filter(Boolean);
      let currentPath = '';
      let parent: FormattedFile | null = null;

      // For each path segment, create a node if it doesn't exist
      parts.forEach((part, index) => {
        const isLast = index === parts.length - 1;
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        
        if (!map[currentPath]) {
          const extension = isLast ? part.split('.').pop() || '' : '';
          const newNode: FormattedFile = {
            path: currentPath,
            name: part,
            isDirectory: !isLast,
            level: index,
            extension: extension,
            children: []
          };
          
          map[currentPath] = newNode;
          
          if (parent) {
            parent.children!.push(newNode);
          } else {
            root.push(newNode);
          }
        }
        
        parent = map[currentPath];
      });
    });

    return root;
  };

  // Organize files in hierarchical structure
  const organizedFiles = useMemo(() => {
    if (!files.length) return [];

    // First, sort files alphabetically
    const sortedFiles = [...files].sort((a, b) => a.localeCompare(b));
    
    // Map files to formatted structure
    return formatFilesHierarchy(sortedFiles);
  }, [files]);

  // Filter files based on search term
  const filteredFiles = useMemo(() => {
    if (!actualSearchTerm) return files;
    return files.filter(file => 
      file.toLowerCase().includes(actualSearchTerm.toLowerCase())
    );
  }, [files, actualSearchTerm]);

  // Load files on component mount
  useEffect(() => {
    if (isVisible) {
      loadFilesFromWebContainer();
    }
  }, [isVisible]);

  // Reset state when card is closed
  useEffect(() => {
    if (!isVisible) {
      setShowFilesList(false);
      setSelectedIndex(0);
      setExpandedFolders({});
    }
  }, [isVisible]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isVisible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const maxItems = filteredFiles.length > 0 
          ? filteredFiles.length 
          : filteredCommands.length;
        setSelectedIndex(prev => Math.min(prev + 1, maxItems - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredFiles.length > 0) {
          const selectedFile = filteredFiles[selectedIndex];
          if (selectedFile) {
            handleFileSelect(selectedFile);
          }
        } else {
          const selected = filteredCommands[selectedIndex];
          if (selected) {
            handleCommandSelect(selected);
          }
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, selectedIndex, filteredCommands, filteredFiles]);

  // Function to recursively get all files from WebContainer
  const getAllFiles = async (container: any, dir: string): Promise<Record<string, string>> => {
    try {
      const files: Record<string, string> = {};
      
      // Recursive function to navigate directories
      const processDirectory = async (dirPath: string) => {
        try {
          const dirEntries = await container.fs.readdir(dirPath, { withFileTypes: true });
          
          for (const entry of dirEntries) {
            const fullPath = `${dirPath}/${entry.name}`;
            
            if (entry.isDirectory()) {
              // Ignore node_modules and .git
              if (entry.name !== 'node_modules' && entry.name !== '.git') {
                await processDirectory(fullPath);
              }
            } else if (entry.isFile()) {
              try {
                // Read file content
                const content = await container.fs.readFile(fullPath, 'utf-8');
                files[fullPath] = content;
              } catch (error) {
                console.error(`Error reading file ${fullPath}:`, error);
              }
            }
          }
        } catch (error) {
          console.error(`Error reading directory ${dirPath}:`, error);
        }
      };
      
      await processDirectory(dir);
      return files;
    } catch (error) {
      console.error('Error getting files:', error);
      throw error;
    }
  };

  // Function to load files directly from WebContainer
  const loadFilesFromWebContainer = async () => {
    setIsLoadingFiles(true);
    try {
      const container = await webcontainer;
      const filesObj = await getAllFiles(container, '/');
      const fileList = Object.keys(filesObj);
      setFiles(fileList);
      setShowFilesList(true);
      
      // Initialize expanded folders to show root files
      const initialExpanded: Record<string, boolean> = {};
      fileList.forEach(file => {
        const parts = file.split('/').filter(Boolean);
        if (parts.length > 1) {
          initialExpanded[parts[0]] = true;
        }
      });
      setExpandedFolders(initialExpanded);
    } catch (error) {
      console.error('Error loading files from WebContainer:', error);
      toast.error('Unable to load files from WebContainer');
    } finally {
      setIsLoadingFiles(false);
    }
  };

  // Function to add files to context
  const addFilesToContext = (file: string): void => {
    if (typeof window !== 'undefined') {
      // Initialize list if it doesn't exist
      if (!window.selectedContextFiles) {
        window.selectedContextFiles = [];
      }
      
      // Add file to the list if not already present
      if (!window.selectedContextFiles.includes(file)) {
        window.selectedContextFiles.push(file);
        
        // Store in localStorage for persistence
        localStorage.setItem('selectedContextFiles', JSON.stringify(window.selectedContextFiles));
        
        // Notify the user
        toast.success(`Added ${file} to context`);
      }
    }
  };

  // Handle file selection
  const handleFileSelect = (file: string) => {
    addFilesToContext(file);
    onSelect(`@${file}`); // Send the file path to the chat input
  };

  // Process command click
  const handleCommandSelect = (command: string) => {
    if (command === '@allfiles') {
      loadFilesFromWebContainer();
    } else {
      onSelect(command);
    }
  };

  // Function to toggle folder expansion
  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  // Function to render file or folder
  const renderFileItem = (file: FormattedFile, index: number) => {
    const isExpanded = expandedFolders[file.path] || false;
    const isMatchingSearch = actualSearchTerm ? 
      file.path.toLowerCase().includes(actualSearchTerm.toLowerCase()) : 
      false;
    
    // Determine icon based on file type
    let icon = "i-ph:file-text";
    let iconColor = "text-blue-500";
    
    if (file.isDirectory) {
      icon = isExpanded ? "i-ph:folder-open" : "i-ph:folder";
      iconColor = "text-yellow-500";
    } else {
      // Choose icon based on extension
      switch (file.extension.toLowerCase()) {
        case 'ts':
        case 'tsx':
          icon = "i-ph:file-ts";
          iconColor = "text-blue-600";
          break;
        case 'js':
        case 'jsx':
          icon = "i-ph:file-js";
          iconColor = "text-yellow-600";
          break;
        case 'json':
          icon = "i-ph:brackets-curly";
          iconColor = "text-yellow-400";
          break;
        case 'html':
          icon = "i-ph:file-html";
          iconColor = "text-orange-500";
          break;
        case 'css':
          icon = "i-ph:file-css";
          iconColor = "text-blue-400";
          break;
        case 'md':
          icon = "i-ph:file-text";
          iconColor = "text-gray-400";
          break;
        default:
          icon = "i-ph:file-code";
          iconColor = "text-blue-500";
      }
    }
    
    // Skip rendering if this is a directory and none of its children match the search
    if (actualSearchTerm && file.isDirectory && !isMatchingSearch) {
      // Check if any children match the search
      const hasMatchingChild = file.children?.some(child => 
        child.path.toLowerCase().includes(actualSearchTerm.toLowerCase())
      );
      if (!hasMatchingChild) return null;
    }
    
    return (
      <React.Fragment key={file.path}>
        <div 
          className={`p-1.5 text-xs rounded-md flex items-start ${
            index === selectedIndex 
              ? 'bg-blue-900/30 text-blue-300 selected' 
              : isMatchingSearch 
                ? 'bg-blue-900/20 text-white' 
                : 'hover:bg-zinc-800/50 text-white'
          } cursor-pointer`}
          style={{ paddingLeft: `${file.level * 12 + 6}px` }}
          onClick={() => file.isDirectory ? toggleFolder(file.path) : handleFileSelect(file.path)}
          onMouseEnter={() => setSelectedIndex(index)}
        >
          <div className={`${icon} ${iconColor} mr-1.5 flex-shrink-0 mt-0.5`} />
          <span className="truncate">{file.name}</span>
          <span className="text-xs text-zinc-400 ml-2 truncate">{file.isDirectory ? '' : `${file.path}`}</span>
        </div>
        
        {/* Render children if directory and expanded */}
        {file.isDirectory && isExpanded && file.children?.map((child, childIndex) => 
          renderFileItem(child, childIndex)
        )}
      </React.Fragment>
    );
  };

  // Render files directly in a flat list when searching
  const renderFlatFilesList = () => {
    return filteredFiles.map((file, index) => {
      // Extract file name from path
      const fileName = file.split('/').pop() || file;
      const extension = fileName.split('.').pop() || '';
      
      // Choose icon based on extension
      let icon = "i-ph:file-text";
      let iconColor = "text-blue-500";
      
      switch (extension.toLowerCase()) {
        case 'ts':
        case 'tsx':
          icon = "i-ph:file-ts";
          iconColor = "text-blue-600";
          break;
        case 'js':
        case 'jsx':
          icon = "i-ph:file-js";
          iconColor = "text-yellow-600";
          break;
        case 'json':
          icon = "i-ph:brackets-curly";
          iconColor = "text-yellow-400";
          break;
        case 'html':
          icon = "i-ph:file-html";
          iconColor = "text-orange-500";
          break;
        case 'css':
          icon = "i-ph:file-css";
          iconColor = "text-blue-400";
          break;
        default:
          icon = "i-ph:file-code";
          iconColor = "text-blue-500";
      }
      
      return (
        <div 
          key={file}
          className={`p-1.5 text-xs rounded-md flex items-start ${
            index === selectedIndex ? 'bg-blue-900/30 text-blue-300 selected' : 'text-white hover:bg-zinc-800/50'
          } cursor-pointer`}
          onClick={() => handleFileSelect(file)}
          onMouseEnter={() => setSelectedIndex(index)}
        >
          <div className={`${icon} ${iconColor} mr-1.5 flex-shrink-0 mt-0.5`} />
          <span className="truncate">{fileName}</span>
          <span className="text-xs text-zinc-400 ml-2 truncate">{file}</span>
        </div>
      );
    });
  };

  // Scroll selected element into view
  useEffect(() => {
    if (cardRef.current) {
      const selectedElement = cardRef.current.querySelector(`.selected`);
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isVisible) return null;

  return (
    <div 
      className="absolute bottom-full left-0 mb-2 p-2 bg-[#111113] border border-zinc-800 rounded-md shadow-lg w-96 z-50"
      ref={cardRef}
    >
      {isLoadingFiles ? (
        // Loading indicator 
        <div className="flex justify-center items-center py-6">
          <div className="i-svg-spinners:90-ring-with-bg text-blue-500 text-2xl animate-spin" />
          <span className="ml-2 text-white">Loading files...</span>
        </div>
      ) : (
        <>
          {/* Header with file count */}
          <div className="flex justify-between items-center mb-2 border-b border-zinc-800 pb-2">
            <div className="text-sm font-medium text-white">
              {actualSearchTerm ? 'Matching Files' : 'Available Files & Commands'}
            </div>
            {filteredFiles.length > 0 && (
              <div className="text-xs text-zinc-400">
                {filteredFiles.length} files found
              </div>
            )}
          </div>
          
          {/* Files and commands list */}
          <div className="max-h-60 overflow-y-auto mb-2">
            {actualSearchTerm && filteredFiles.length > 0 ? (
              // Show filtered files when searching
              renderFlatFilesList()
            ) : filteredFiles.length === 0 && actualSearchTerm ? (
              // No files found message
              <>
                <div className="py-2 text-center text-zinc-400">
                  No matching files found
                </div>
                {filteredCommands.length > 0 && (
                  <div className="pt-2 border-t border-zinc-800">
                    <div className="text-xs text-zinc-400 mb-1 px-2">Commands</div>
                    {filteredCommands.map((command, index) => (
                      <div 
                        key={command}
                        className={`p-1.5 cursor-pointer rounded-md text-sm ${
                          index === selectedIndex ? 'bg-blue-900/30 text-blue-300 selected' : 'text-white hover:bg-zinc-800/50'
                        }`}
                        onClick={() => handleCommandSelect(command)}
                        onMouseEnter={() => setSelectedIndex(index)}
                      >
                        <span className="font-semibold">{command}</span>
                        <span className="text-xs text-zinc-400 ml-2">
                          {command === '@allfiles' && 'Add all files to context'}
                          {command === '@addfiles' && 'Upload files to project'}
                          {command === '@help' && 'Show available commands'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              // Initial view shows both commands and files
              <>
                {/* Commands section */}
                {COMMANDS.length > 0 && (
                  <div className="mb-2">
                    <div className="text-xs text-zinc-400 mb-1 px-2">Commands</div>
                    {COMMANDS.map((command, index) => (
                      <div 
                        key={command}
                        className={`p-1.5 cursor-pointer rounded-md text-sm ${
                          index === selectedIndex ? 'bg-blue-900/30 text-blue-300 selected' : 'text-white hover:bg-zinc-800/50'
                        }`}
                        onClick={() => handleCommandSelect(command)}
                        onMouseEnter={() => setSelectedIndex(index)}
                      >
                        <span className="font-semibold">{command}</span>
                        <span className="text-xs text-zinc-400 ml-2">
                          {command === '@allfiles' && 'Add all files to context'}
                          {command === '@addfiles' && 'Upload files to project'}
                          {command === '@help' && 'Show available commands'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Files section */}
                {files.length > 0 && (
                  <div>
                    <div className="text-xs text-zinc-400 mb-1 px-2 pt-2 border-t border-zinc-800">Top Files</div>
                    {/* Show first 10 files */}
                    {files.slice(0, 10).map((file, index) => {
                      const fileName = file.split('/').pop() || file;
                      const extension = fileName.split('.').pop() || '';
                      let icon = "i-ph:file-code";
                      let iconColor = "text-blue-500";
                      
                      switch (extension.toLowerCase()) {
                        case 'ts':
                        case 'tsx':
                          icon = "i-ph:file-ts";
                          iconColor = "text-blue-600";
                          break;
                        case 'js':
                        case 'jsx':
                          icon = "i-ph:file-js";
                          iconColor = "text-yellow-600";
                          break;
                        default:
                          icon = "i-ph:file-code";
                          iconColor = "text-blue-500";
                      }
                      
                      return (
                        <div 
                          key={file}
                          className={`p-1.5 text-xs rounded-md flex items-start ${
                            index + COMMANDS.length === selectedIndex ? 'bg-blue-900/30 text-blue-300 selected' : 'text-white hover:bg-zinc-800/50'
                          } cursor-pointer`}
                          onClick={() => handleFileSelect(file)}
                          onMouseEnter={() => setSelectedIndex(index + COMMANDS.length)}
                        >
                          <div className={`${icon} ${iconColor} mr-1.5 flex-shrink-0 mt-0.5`} />
                          <span className="truncate">{fileName}</span>
                          <span className="text-xs text-zinc-400 ml-2 truncate">{file}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};