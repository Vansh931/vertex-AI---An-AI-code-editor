import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  Folder as FolderIcon,
  FolderOpen,
  FilePlus2,
  FolderPlus,
  Pencil,
  Trash2,
} from "lucide-react";

import { createFile, createFolder, getFile } from "../features/file";
import { getFileIcon, getFolderColor } from "../utils/fileIcons";

export default function Folder({
  projectId,
  node,
  openFile,
  onNewFile,
  onNewFolder,
  creatingFolderIn,
  setCreatingFolderIn,
  creatingFileIn,
  setCreatingFileIn,
  reloadTree,
}) {
  const [open, setOpen] = useState(true);
  const [folderName, setFolderName] = useState("");
  const [fileName, setFileName] = useState("");
  const [menu, setMenu] = useState(null);

  // ---------------- CREATE FOLDER ----------------
  const handleCreateFolder = async () => {
    if (!folderName.trim()) return;
    try {
      await createFolder({ projectId, parentId: node._id, name: folderName });
      setFolderName("");
      setCreatingFolderIn(null);
      await reloadTree();
    } catch (err) {
      console.log(err);
    }
  };

  // ---------------- CREATE FILE ----------------
  const handleCreateFile = async () => {
    if (!fileName.trim()) return;
    try {
      const res = await createFile({ projectId, parentId: node._id, name: fileName });
      setFileName("");
      setCreatingFileIn(null);
      await reloadTree();
      if (res?.file) openFile(res.file);
    } catch (err) {
      console.log(err);
    }
  };

  // ---------------- FILE ----------------
  if (node.type === "file") {
    const { icon: FileTypeIcon, color: fileColor } = getFileIcon(node.name);

    return (
      <div className="relative">
        <motion.div
          whileHover={{ x: 2 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="group flex items-center justify-between py-1.5 px-3 rounded-lg hover:bg-white/[0.05] cursor-pointer transition-colors"
          onClick={async () => {
            const data = await getFile(node._id);
            openFile(data.file);
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            setMenu({ x: e.clientX, y: e.clientY });
          }}
        >
          <div className="flex min-w-0 items-center gap-2">
            <FileTypeIcon size={14} className={`shrink-0 ${fileColor}`} />
            <span className="truncate text-[13px] text-zinc-400 transition-colors group-hover:text-zinc-100">
              {node.name}
            </span>
          </div>
        </motion.div>

        <AnimatePresence>
          {menu && (
            <>
              <motion.div
                className="fixed inset-0 z-40"
                onClick={() => setMenu(null)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -6 }}
                transition={{ duration: 0.14, ease: "easeOut" }}
                className="fixed z-50 w-48 rounded-xl border border-white/[0.08] bg-[#17171a]/95 py-1.5 shadow-2xl shadow-black/50 backdrop-blur-xl"
                style={{ left: menu.x, top: menu.y }}
              >
                <button
                  className="mx-1 flex w-[calc(100%-8px)] items-center gap-2 rounded-md px-3 py-2 text-[13px] text-zinc-300 transition-colors hover:bg-white/[0.06] hover:text-white"
                  onClick={() => setMenu(null)}
                >
                  <Pencil size={13} />
                  Rename
                </button>
                <button
                  className="mx-1 flex w-[calc(100%-8px)] items-center gap-2 rounded-md px-3 py-2 text-[13px] text-red-400 transition-colors hover:bg-red-500/10"
                  onClick={() => setMenu(null)}
                >
                  <Trash2 size={13} />
                  Delete
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ---------------- FOLDER ----------------
  const folderColor = getFolderColor(node.name);

  return (
    <div className="relative">
      <motion.div
        whileHover={{ x: 2 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="group flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-white/[0.05] transition-colors"
        onContextMenu={(e) => {
          e.preventDefault();
          setMenu({ x: e.clientX, y: e.clientY });
        }}
      >
        <div
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-1.5"
          onClick={() => setOpen(!open)}
        >
          <motion.div
            animate={{ rotate: open ? 90 : 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="shrink-0"
          >
            <ChevronRight size={14} className="text-zinc-500" />
          </motion.div>

          {open ? (
            <FolderOpen size={16} className={`shrink-0 ${folderColor}`} />
          ) : (
            <FolderIcon size={16} className={`shrink-0 ${folderColor} opacity-80`} />
          )}

          <span className="truncate text-[13px] text-zinc-300 transition-colors group-hover:text-white">
            {node.name}
          </span>
        </div>

        <div className="hidden items-center gap-0.5 group-hover:flex">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.92 }}
            className="rounded-md p-1 text-zinc-500 hover:bg-white/10 hover:text-white"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(true);
              onNewFile(node);
            }}
          >
            <FilePlus2 size={13} />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.92 }}
            className="rounded-md p-1 text-zinc-500 hover:bg-white/10 hover:text-white"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(true);
              onNewFolder(node);
            }}
          >
            <FolderPlus size={13} />
          </motion.button>
        </div>
      </motion.div>

      <AnimatePresence>
        {menu && (
          <>
            <motion.div
              className="fixed inset-0 z-40"
              onClick={() => setMenu(null)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -6 }}
              transition={{ duration: 0.14, ease: "easeOut" }}
              className="fixed z-50 w-52 rounded-xl border border-white/[0.08] bg-[#17171a]/95 py-1.5 shadow-2xl shadow-black/50 backdrop-blur-xl"
              style={{ left: menu.x, top: menu.y }}
            >
              <button
                className="mx-1 flex w-[calc(100%-8px)] items-center gap-2 rounded-md px-3 py-2 text-left text-[13px] text-zinc-300 transition-colors hover:bg-white/[0.06] hover:text-white"
                onClick={() => {
                  setMenu(null);
                  onNewFile(node);
                }}
              >
                <FilePlus2 size={13} />
                New File
              </button>

              <button
                className="mx-1 flex w-[calc(100%-8px)] items-center gap-2 rounded-md px-3 py-2 text-left text-[13px] text-zinc-300 transition-colors hover:bg-white/[0.06] hover:text-white"
                onClick={() => {
                  setMenu(null);
                  onNewFolder(node);
                }}
              >
                <FolderPlus size={13} />
                New Folder
              </button>

              <div className="my-1 h-px bg-white/[0.08]" />

              <button
                className="mx-1 flex w-[calc(100%-8px)] items-center gap-2 rounded-md px-3 py-2 text-[13px] text-zinc-300 transition-colors hover:bg-white/[0.06] hover:text-white"
                onClick={() => setMenu(null)}
              >
                <Pencil size={13} />
                Rename
              </button>

              <button
                className="mx-1 flex w-[calc(100%-8px)] items-center gap-2 rounded-md px-3 py-2 text-[13px] text-red-400 transition-colors hover:bg-red-500/10"
                onClick={() => setMenu(null)}
              >
                <Trash2 size={13} />
                Delete
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="ml-5 overflow-hidden border-l border-white/[0.05] pl-1"
          >
            {node.children?.map((child) => (
              <Folder
                key={child._id}
                projectId={projectId}
                node={child}
                openFile={openFile}
                onNewFile={onNewFile}
                onNewFolder={onNewFolder}
                creatingFolderIn={creatingFolderIn}
                setCreatingFolderIn={setCreatingFolderIn}
                creatingFileIn={creatingFileIn}
                setCreatingFileIn={setCreatingFileIn}
                reloadTree={reloadTree}
              />
            ))}

            {creatingFolderIn === node._id && (
              <div className="py-1 pl-1">
                <motion.input
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  autoFocus
                  value={folderName}
                  placeholder="Folder Name"
                  className="w-full rounded-md border border-white/[0.1] bg-white/[0.04] px-2.5 py-1.5 text-[13px] text-white placeholder-zinc-500 outline-none transition-all focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/15"
                  onChange={(e) => setFolderName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateFolder();
                    if (e.key === "Escape") {
                      setFolderName("");
                      setCreatingFolderIn(null);
                    }
                  }}
                />
              </div>
            )}

            {creatingFileIn === node._id && (
              <div className="py-1 pl-1">
                <motion.input
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  autoFocus
                  value={fileName}
                  placeholder="File Name"
                  className="w-full rounded-md border border-white/[0.1] bg-white/[0.04] px-2.5 py-1.5 text-[13px] text-white placeholder-zinc-500 outline-none transition-all focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/15"
                  onChange={(e) => setFileName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateFile();
                    if (e.key === "Escape") {
                      setFileName("");
                      setCreatingFileIn(null);
                    }
                  }}
                />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}