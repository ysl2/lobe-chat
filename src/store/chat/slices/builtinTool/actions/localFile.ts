import {
  ListLocalFileParams,
  LocalReadFileParams,
  LocalReadFilesParams,
  LocalSearchFilesParams,
  MoveLocalFileParams,
  RenameLocalFileParams,
} from '@lobechat/electron-client-ipc';
import { StateCreator } from 'zustand/vanilla';

import { localFileService } from '@/services/electron/localFileService';
import { ChatStore } from '@/store/chat/store';
import {
  LocalFileListState,
  LocalFileSearchState,
  LocalMoveFileState,
  LocalReadFileState,
  LocalReadFilesState,
  LocalRenameFileState,
} from '@/tools/local-files/type';

// Define the parameters types inline for now
// Replace with actual types once defined in ipc package

// type MoveOrRenameParams = // REMOVE this complex type
//   | { type: 'rename'; oldPath: string; newName: string }
//   | { type: 'move'; oldPath: string; newPath: string };

export interface LocalFileAction {
  listLocalFiles: (id: string, params: ListLocalFileParams) => Promise<boolean>;
  moveLocalFile: (id: string, params: MoveLocalFileParams) => Promise<boolean>;
  reSearchLocalFiles: (id: string, params: LocalSearchFilesParams) => Promise<boolean>;
  readLocalFile: (id: string, params: LocalReadFileParams) => Promise<boolean>;
  readLocalFiles: (id: string, params: LocalReadFilesParams) => Promise<boolean>;
  renameLocalFile: (id: string, params: RenameLocalFileParams) => Promise<boolean>; // Added rename action
  searchLocalFiles: (id: string, params: LocalSearchFilesParams) => Promise<boolean>;
  toggleLocalFileLoading: (id: string, loading: boolean) => void;
}

export const localFileSlice: StateCreator<
  ChatStore,
  [['zustand/devtools', never]],
  [],
  LocalFileAction
> = (set, get) => ({
  listLocalFiles: async (id, params) => {
    get().toggleLocalFileLoading(id, true);
    try {
      const data = await localFileService.listLocalFiles(params);
      console.log(data);
      await get().updatePluginState(id, { listResults: data } as LocalFileListState);
      await get().internal_updateMessageContent(id, JSON.stringify(data));
    } catch (error) {
      console.error('Error listing local files:', error);
      await get().internal_updateMessagePluginError(id, {
        body: error,
        message: (error as Error).message,
        type: 'PluginServerError',
      });
    }
    get().toggleLocalFileLoading(id, false);

    return true;
  },

  moveLocalFile: async (id, params) => {
    // Params are { oldPath: string; newPath: string }
    get().toggleLocalFileLoading(id, true);
    let success = false;
    // REMOVE path calculation logic
    // let finalOldPath: string;
    // let finalNewPath: string;

    try {
      // Directly use the provided params
      const { oldPath, newPath } = params;

      // Optional: Check if paths are identical before calling service
      // Note: path.normalize is NOT available here. Basic string comparison might suffice for simple cases,
      // but identical paths should ideally be caught before calling the action or handled robustly by the backend.
      // For now, let the backend handle identical path logic if needed.
      // if (oldPath === newPath) { ... }

      // --- Call Service with provided paths ---
      const result = await localFileService.moveLocalFile({ newPath, oldPath });

      if (result.success) {
        await get().updatePluginState(id, {
          newPath,
          oldPath,
          success: true,
        } as LocalMoveFileState);
        await get().internal_updateMessageContent(
          id,
          JSON.stringify({
            message: `Successfully moved file from ${oldPath} to ${newPath}.`,
            success: true,
          }),
        );
        success = true;
      } else {
        throw new Error(result.error || 'Failed to move file.');
      }
    } catch (error) {
      console.error('Error in moveLocalFile action:', error);
      const errorMessage = (error as Error).message;
      await get().updatePluginState(id, {
        error: errorMessage,
        newPath: params.newPath,
        oldPath: params.oldPath,
        success: false,
      } as LocalMoveFileState);
      await get().internal_updateMessagePluginError(id, {
        body: error,
        message: errorMessage,
        type: 'PluginServerError',
      });
      await get().internal_updateMessageContent(
        id,
        JSON.stringify({ error: errorMessage, success: false }),
      );
      success = false;
    } finally {
      get().toggleLocalFileLoading(id, false);
    }

    return success;
  },

  reSearchLocalFiles: async (id, params) => {
    get().toggleLocalFileLoading(id, true);

    await get().updatePluginArguments(id, params);

    return get().searchLocalFiles(id, params);
  },

  readLocalFile: async (id, params) => {
    get().toggleLocalFileLoading(id, true);

    try {
      const result = await localFileService.readLocalFile(params);

      await get().updatePluginState(id, { fileContent: result } as LocalReadFileState);
      await get().internal_updateMessageContent(id, JSON.stringify(result));
    } catch (error) {
      console.error('Error reading local file:', error);
      await get().internal_updateMessagePluginError(id, {
        body: error,
        message: (error as Error).message,
        type: 'PluginServerError',
      });
    }
    get().toggleLocalFileLoading(id, false);
    return true;
  },

  readLocalFiles: async (id, params) => {
    get().toggleLocalFileLoading(id, true);

    try {
      const results = await localFileService.readLocalFiles(params);
      await get().updatePluginState(id, { filesContent: results } as LocalReadFilesState);
      await get().internal_updateMessageContent(id, JSON.stringify(results));
    } catch (error) {
      console.error('Error reading local files:', error);
      await get().internal_updateMessagePluginError(id, {
        body: error,
        message: (error as Error).message,
        type: 'PluginServerError',
      });
    }
    get().toggleLocalFileLoading(id, false);

    return true;
  },

  renameLocalFile: async (id, params) => {
    // New action for rename
    get().toggleLocalFileLoading(id, true);
    let success = false;
    try {
      // Params are { path: currentFullPath, newName: newNameOnly }
      const { path: currentPath, newName } = params;

      // Basic validation for newName (can be done here or backend, maybe better in backend)
      if (
        !newName ||
        newName.includes('/') ||
        newName.includes('\\') ||
        newName === '.' ||
        newName === '..' ||
        /["*/:<>?\\|]/.test(newName)
      ) {
        throw new Error(
          'Invalid new name provided. It cannot be empty, contain path separators, or invalid characters.',
        );
      }

      const result = await localFileService.renameLocalFile({ newName, path: currentPath }); // Call the specific service

      if (result.success) {
        // Assuming backend calculates the newPath and maybe returns it?
        // Or frontend reconstructs it for display if needed.
        // For now, just store success and input params.
        await get().updatePluginState(id, {
          // Keep track of original path
          newPath: result.newPath,
          oldPath: currentPath,
          success: true,
          // Keep track of the new name requested
          // newPath: result.newPath // Ideally backend would return this
        } as LocalRenameFileState); // Assuming LocalRenameFileState exists
        await get().internal_updateMessageContent(
          id,
          JSON.stringify({
            message: `Successfully renamed file ${currentPath} to ${newName}.`,
            success: true, // Simplified message
          }),
        );
        success = true;
      } else {
        throw new Error(result.error || 'Failed to rename file.');
      }
    } catch (error) {
      console.error('Error in renameLocalFile action:', error);
      const errorMessage = (error as Error).message;
      await get().updatePluginState(id, {
        error: errorMessage,
        newPath: '',
        oldPath: params.path,
        success: false,
      } as LocalRenameFileState);
      await get().internal_updateMessagePluginError(id, {
        body: error,
        message: errorMessage,
        type: 'PluginServerError',
      });
      await get().internal_updateMessageContent(
        id,
        JSON.stringify({ error: errorMessage, success: false }),
      );
      success = false;
    } finally {
      get().toggleLocalFileLoading(id, false);
    }
    return success;
  },

  searchLocalFiles: async (id, params) => {
    get().toggleLocalFileLoading(id, true);
    try {
      const data = await localFileService.searchLocalFiles(params);
      await get().updatePluginState(id, { searchResults: data } as LocalFileSearchState);
      await get().internal_updateMessageContent(id, JSON.stringify(data));
    } catch (error) {
      console.error('Error searching local files:', error);
      await get().internal_updateMessagePluginError(id, {
        body: error,
        message: (error as Error).message,
        type: 'PluginServerError',
      });
    }
    get().toggleLocalFileLoading(id, false);

    return true;
  },

  toggleLocalFileLoading: (id, loading) => {
    // Assuming a loading state structure similar to searchLoading
    set(
      (state) => ({
        localFileLoading: { ...state.localFileLoading, [id]: loading },
      }),
      false,
      `toggleLocalFileLoading/${loading ? 'start' : 'end'}`,
    );
  },
});
