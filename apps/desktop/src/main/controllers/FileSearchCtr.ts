import {
  ListLocalFileParams,
  LocalReadFileParams,
  LocalReadFileResult,
  LocalReadFilesParams,
  LocalSearchFilesParams,
  OpenLocalFileParams,
  OpenLocalFolderParams,
} from '@lobechat/electron-client-ipc';
import { loadFile } from '@lobechat/file-loaders';
import { shell } from 'electron';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { promisify } from 'node:util';

import FileSearchService from '@/services/fileSearchSrv';
import { FileResult, SearchOptions } from '@/types/fileSearch';

import { ControllerModule, ipcClientEvent } from './index';

const statPromise = promisify(fs.stat);
const readdirPromise = promisify(fs.readdir);

export default class FileSearchCtr extends ControllerModule {
  private get searchService() {
    return this.app.getService(FileSearchService);
  }

  /**
   * Handle IPC event for local file search
   */
  @ipcClientEvent('searchLocalFiles')
  async handleLocalFilesSearch(params: LocalSearchFilesParams): Promise<FileResult[]> {
    const options: Omit<SearchOptions, 'keywords'> = {
      limit: 30,
    };

    return this.searchService.search(params.keywords, options);
  }

  @ipcClientEvent('openLocalFile')
  async handleOpenLocalFile({ path: filePath }: OpenLocalFileParams): Promise<{
    error?: string;
    success: boolean;
  }> {
    try {
      await shell.openPath(filePath);
      return { success: true };
    } catch (error) {
      console.error(`Failed to open file ${filePath}:`, error);
      return { error: (error as Error).message, success: false };
    }
  }

  @ipcClientEvent('openLocalFolder')
  async handleOpenLocalFolder({ path: targetPath, isDirectory }: OpenLocalFolderParams): Promise<{
    error?: string;
    success: boolean;
  }> {
    try {
      const folderPath = isDirectory ? targetPath : path.dirname(targetPath);
      await shell.openPath(folderPath);
      return { success: true };
    } catch (error) {
      console.error(`Failed to open folder for path ${targetPath}:`, error);
      return { error: (error as Error).message, success: false };
    }
  }

  @ipcClientEvent('readLocalFiles')
  async readFiles({ paths }: LocalReadFilesParams): Promise<LocalReadFileResult[]> {
    const results: LocalReadFileResult[] = [];

    for (const filePath of paths) {
      // 初始化结果对象
      const result = await this.readFile({ path: filePath });

      results.push(result);
    }

    return results;
  }

  @ipcClientEvent('readLocalFile')
  async readFile({ path: filePath, loc }: LocalReadFileParams): Promise<LocalReadFileResult> {
    try {
      const effectiveLoc = loc ?? [0, 200];

      const fileDocument = await loadFile(filePath);

      const [startLine, endLine] = effectiveLoc;
      const lines = fileDocument.content.split('\n');
      const totalLineCount = lines.length;
      const totalCharCount = fileDocument.content.length;

      // Adjust slice indices to be 0-based and inclusive/exclusive
      const selectedLines = lines.slice(startLine, endLine);
      const content = selectedLines.join('\n');
      const charCount = content.length;
      const lineCount = selectedLines.length;

      const result: LocalReadFileResult = {
        // Char count for the selected range
        charCount,
        // Content for the selected range
        content,
        createdTime: fileDocument.createdTime,
        fileType: fileDocument.fileType,
        filename: fileDocument.filename,
        lineCount,
        loc: effectiveLoc,
        // Line count for the selected range
        modifiedTime: fileDocument.modifiedTime,

        // Total char count of the file
        totalCharCount,
        // Total line count of the file
        totalLineCount,
      };

      try {
        const stats = await statPromise(filePath);
        if (stats.isDirectory()) {
          result.content = 'This is a directory and cannot be read as plain text.';
          result.charCount = 0;
          result.lineCount = 0;
          // Keep total counts for directory as 0 as well, or decide if they should reflect metadata size
          result.totalCharCount = 0;
          result.totalLineCount = 0;
        }
      } catch (statError) {
        console.error(`Stat failed for ${filePath} after loadFile:`, statError);
      }

      return result;
    } catch (error) {
      console.error(`Error processing file ${filePath}:`, error);
      const errorMessage = (error as Error).message;
      return {
        charCount: 0,
        content: `Error accessing or processing file: ${errorMessage}`,
        createdTime: new Date(),
        fileType: path.extname(filePath).toLowerCase().replace('.', '') || 'unknown',
        filename: path.basename(filePath),
        lineCount: 0,
        loc: [0, 0],
        modifiedTime: new Date(),
        totalCharCount: 0, // Add total counts to error result
        totalLineCount: 0,
      };
    }
  }

  @ipcClientEvent('listLocalFiles')
  async listLocalFiles({ path: dirPath }: ListLocalFileParams): Promise<FileResult[]> {
    const results: FileResult[] = [];
    try {
      const entries = await readdirPromise(dirPath);

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry);
        try {
          const stats = await statPromise(fullPath);
          const isDirectory = stats.isDirectory();
          results.push({
            createdTime: stats.birthtime,
            isDirectory,
            lastAccessTime: stats.atime,
            modifiedTime: stats.mtime,
            name: entry,
            path: fullPath,
            size: stats.size,
            type: isDirectory ? 'directory' : path.extname(entry).toLowerCase().replace('.', ''),
          });
        } catch (statError) {
          // Silently ignore files we can't stat (e.g. permissions)
          console.error(`Failed to stat ${fullPath}:`, statError);
        }
      }

      // Sort entries: folders first, then by name
      results.sort((a, b) => {
        if (a.isDirectory !== b.isDirectory) {
          return a.isDirectory ? -1 : 1; // Directories first
        }
        // Add null/undefined checks for robustness if needed, though names should exist
        return (a.name || '').localeCompare(b.name || ''); // Then sort by name
      });

      return results;
    } catch (error) {
      console.error(`Failed to list directory ${dirPath}:`, error);
      // Rethrow or return an empty array/error object depending on desired behavior
      // For now, returning empty array on error listing directory itself
      return [];
    }
  }

  /**
   * Determine if a file can be read as text
   * @param fileType File extension
   * @returns Whether the file can be read as text
   */
  private isTextReadableFile(fileType: string): boolean {
    // Common file types that can be read as text
    const textReadableTypes = [
      'txt',
      'md',
      'json',
      'xml',
      'html',
      'htm',
      'css',
      'scss',
      'less',
      'js',
      'ts',
      'jsx',
      'tsx',
      'vue',
      'svelte',
      'php',
      'py',
      'rb',
      'java',
      'c',
      'cpp',
      'h',
      'hpp',
      'cs',
      'go',
      'rs',
      'swift',
      'kt',
      'sh',
      'bat',
      'yml',
      'yaml',
      'toml',
      'ini',
      'cfg',
      'conf',
      'log',
      'svg',
      'csv',
      'sql',
    ];

    return textReadableTypes.includes(fileType.toLowerCase());
  }
}
