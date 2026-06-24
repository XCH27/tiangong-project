/**
 * Browser-safe workspace naming helpers.
 *
 * Keep these pure so renderer code never needs the Node-backed workspace
 * storage module just to preview a folder name.
 */
export function workspaceFolderNameFromName(name: string): string {
  const folderName = name
    .normalize('NFC')
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1F]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/[. ]+$/g, '')
    .trim();

  return folderName || 'workspace';
}
