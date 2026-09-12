import { getLocalDocPath, type DocFeature } from '@craft-agent/shared/docs/doc-links'

/**
 * Open a feature's documentation from the copy on this machine.
 *
 * Every "Learn more" used to navigate to a Craft-operated docs site, which P8 forbids
 * as a silent dependency — and which fails outright with no network. The same pages
 * ship with the app and are synced to `~/.craft-agent/docs/` at startup, so the help
 * affordance reads the local file instead. It is also the text the agent is pointed
 * at when it has to explain a surface, so the person and the agent read one source.
 */
export async function openLocalDoc(feature: DocFeature): Promise<void> {
  const home = await window.electronAPI.getHomeDir()
  await window.electronAPI.openFile(`${home}/.craft-agent/${getLocalDocPath(feature)}`)
}
