import { tool } from "@langchain/core/tools";
import { z } from "zod";

import {
  createFile,
  createFolder,
  getFile,
  getProjectTree,
  updateFile,
} from "../config/fileService.js";

// =====================================================
// COMPACT TREE
// =====================================================

const compactTree = (items = []) => {
  return items.map((item) => ({
    _id: item._id,
    parentId: item.parentId,
    name: item.name,
    type: item.type,
    language: item.language,
    extension: item.extension,

    children: compactTree(
      item.children || []
    ),
  }));
};

// =====================================================
// CREATE FILE TOOLS
// =====================================================

export const createFileTools = ({
  projectId,
  userId,
}) => {

  // ===================================================
  // GET TREE
  // ===================================================

  const getTreeTool = tool(
    async () => {
      console.log(
        "AI TOOL -> get_tree"
      );

      const result =
        await getProjectTree(
          projectId,
          userId
        );

      const tree =
        compactTree(
          result?.tree || []
        );

      console.log(
        "AI TREE LOADED:",
        tree.length
      );

      return JSON.stringify({
        success: true,
        tree,
      });
    },
    {
      name: "get_tree",

      description: `
Get the complete project file and folder tree.

IMPORTANT:

1. Use this when the project structure is unknown.
2. Do not repeatedly call get_tree.
3. type="folder" means folder.
4. type="file" means file.
5. Folder IDs are used as parentId.
6. NEVER call get_file with a folder ID.
7. Do not use terminal commands to inspect the project.
8. Use the exact IDs returned by this tool.

The tree contains:
_id
parentId
name
type
language
extension
children
`,

      schema: z.object({}),
    }
  );

  // ===================================================
  // GET FILE
  // ===================================================

  const getFileTool = tool(
    async ({
      fileId,
    }) => {
      console.log(
        "AI TOOL -> get_file:",
        fileId
      );

      const result =
        await getFile(
          fileId,
          userId
        );

      // -----------------------------------------------
      // FILE VALIDATION
      // -----------------------------------------------

      if (
        result?.file &&
        result.file.type !== "file"
      ) {
        console.log(
          "GET FILE BLOCKED - ID IS FOLDER:",
          fileId
        );

        return JSON.stringify({
          success: false,

          error:
            "The provided ID belongs to a folder, not a file.",

          instruction:
            "Do not call get_file for folders. Use the folder ID as parentId.",
        });
      }

      if (!result?.file) {
        return JSON.stringify({
          success: false,
          error: "File not found.",
        });
      }

      // -----------------------------------------------
      // IMPORTANT
      //
      // Existing file content MUST be returned because
      // AI needs it before updating the file.
      // -----------------------------------------------

      return JSON.stringify({
        success: true,

        file: {
          _id:
            result.file._id,

          parentId:
            result.file.parentId,

          name:
            result.file.name,

          type:
            result.file.type,

          language:
            result.file.language,

          extension:
            result.file.extension,

          content:
            result.file.content || "",
        },
      });
    },
    {
      name: "get_file",

      description: `
Read an EXISTING FILE before modifying it.

STRICT RULES:

1. fileId must belong to a file.
2. NEVER pass a folder ID.
3. Use exact file ID from get_tree.
4. Call this before update_file.
5. Do not call this for newly created files unless necessary.
6. Do not call this repeatedly for the same file.

The response contains the complete file content.
`,

      schema: z.object({
        fileId:
          z.string(),
      }),
    }
  );

  // ===================================================
  // CREATE FOLDER
  // ===================================================

  const createFolderTool = tool(
    async ({
      parentId,
      name,
    }) => {
      console.log(
        "AI TOOL -> create_folder:",
        name
      );

      const result =
        await createFolder(
          {
            projectId,
            parentId,
            name,
          },
          userId
        );

      const folder =
        result?.folder;

      console.log(
        "FOLDER CREATED:",
        folder?._id,
        folder?.name
      );

      // IMPORTANT:
      // Return only compact information.
      // Do not send full DB document back to LLM.
      return JSON.stringify({
        success: true,

        operation:
          "folder_created",

        folder: {
          _id:
            folder?._id,

          parentId:
            folder?.parentId,

          name:
            folder?.name,

          type:
            folder?.type,
        },
      });
    },
    {
      name: "create_folder",

      description: `
Create a new folder.

RULES:

1. Create parent folders first.
2. Use exact parentId from get_tree.
3. Never create duplicate folders.
4. A folder directly inside another folder must use that
   folder's ID as parentId.
5. After creation continue with the remaining files.
6. Do not call get_tree again just to verify the folder.
`,

      schema: z.object({
        parentId:
          z.string().nullable(),

        name:
          z.string(),
      }),
    }
  );

  // ===================================================
  // CREATE FILE
  // ===================================================

  const createFileTool = tool(
    async ({
      parentId,
      name,
      language,
      content,
    }) => {
      console.log(
        "AI TOOL -> create_file:",
        name
      );

      const result =
        await createFile(
          {
            projectId,

            parentId,

            name,

            language:
              language ||
              "plaintext",

            content,
          },

          userId
        );

      const file =
        result?.file;

      console.log(
        "FILE CREATED:",
        file?._id,
        file?.name
      );

      // IMPORTANT:
      // Do NOT return content.
      //
      // The AI already knows the content because
      // it generated it itself.
      //
      // Returning content again increases context size.
      return JSON.stringify({
        success: true,

        operation:
          "file_created",

        file: {
          _id:
            file?._id,

          parentId:
            file?.parentId,

          name:
            file?.name,

          type:
            file?.type,

          language:
            file?.language,

          extension:
            file?.extension,

          size:
            file?.size,
        },
      });
    },
    {
      name: "create_file",

      description: `
Create a NEW FILE.

RULES:

1. Use get_tree first when project structure is unknown.
2. Use exact folder ID as parentId.
3. Never create duplicate files.
4. Send complete file content.
5. Create folders before files inside them.
6. Never use terminal commands to create files.
7. Do not call get_file immediately after creating a file.
8. Continue creating all required files.
9. Do not stop after creating only one file.

For a React/Vite project, create ALL required files.
`,

      schema: z.object({
        parentId:
          z.string(),

        name:
          z.string(),

        language:
          z.string()
            .optional(),

        content:
          z.string(),
      }),
    }
  );

  // ===================================================
  // UPDATE FILE
  // ===================================================

  const updateFileTool = tool(
    async ({
      fileId,
      content,
    }) => {
      console.log(
        "AI TOOL -> update_file:",
        fileId
      );

      const result =
        await updateFile(
          fileId,

          {
            content,
          },

          userId
        );

      const file =
        result?.file;

      console.log(
        "FILE UPDATED:",
        file?._id,
        file?.name
      );

      // IMPORTANT:
      // Do NOT return updated content.
      return JSON.stringify({
        success: true,

        operation:
          "file_updated",

        file: {
          _id:
            file?._id,

          parentId:
            file?.parentId,

          name:
            file?.name,

          type:
            file?.type,

          language:
            file?.language,

          extension:
            file?.extension,

          size:
            file?.size,
        },
      });
    },
    {
      name: "update_file",

      description: `
Update an EXISTING FILE.

RULES:

1. Call get_file before updating.
2. fileId must be an actual file ID.
3. NEVER use a folder ID.
4. Send the complete updated file content.
5. Do not update files that do not exist.
6. After successful update continue with remaining work.
7. Do not call get_file again unless another modification is needed.
`,

      schema: z.object({
        fileId:
          z.string(),

        content:
          z.string(),
      }),
    }
  );

  // ===================================================
  // RETURN TOOLS
  // ===================================================

  return [
    getTreeTool,
    getFileTool,
    createFolderTool,
    createFileTool,
    updateFileTool,
  ];
};