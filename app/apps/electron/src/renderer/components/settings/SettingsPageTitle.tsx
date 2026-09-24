/** Keep the page name available to assistive technology without repeating the selected nav label. */
export function SettingsPageTitle({ title }: { title: string }) {
  return <h1 className="sr-only">{title}</h1>
}
