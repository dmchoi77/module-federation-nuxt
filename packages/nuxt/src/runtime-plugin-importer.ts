const MF_REMOTE_ENTRY_ID = "virtual:mf-REMOTE_ENTRY_ID:";
const MF_REMOTE_ENTRY_SSR_ID = "virtual:mf-REMOTE_ENTRY_SSR_ID";
const MF_EXPOSES_SSR_ID = "virtual:mf-exposes-ssr:";

export function isMfRemoteEntryImporter(importer?: string) {
  if (!importer) return false;

  const normalized = importer
    .replace(/^\/@id\//, "")
    .replace(/^__x00__/, "")
    .replace(/^\0/, "");
  return normalized.startsWith(MF_REMOTE_ENTRY_ID);
}

export function isMfSsrRemoteEntryImporter(importer?: string) {
  if (!importer) return false;

  return (
    importer.includes(MF_REMOTE_ENTRY_SSR_ID) ||
    importer.includes(MF_EXPOSES_SSR_ID) ||
    importer.includes("/__mf_ssr__/")
  );
}
