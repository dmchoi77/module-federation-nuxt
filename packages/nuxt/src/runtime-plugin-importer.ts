const MF_REMOTE_ENTRY_ID = "virtual:mf-REMOTE_ENTRY_ID:";
export const MF_REMOTE_ENTRY_SSR_ID = "virtual:mf-REMOTE_ENTRY_SSR_ID";
const MF_EXPOSES_SSR_ID = "virtual:mf-exposes-ssr:";

export function isMfRemoteEntryImporter(importer?: string) {
  return normalizeMfImporter(importer)?.startsWith(MF_REMOTE_ENTRY_ID) ?? false;
}

export function isMfSsrRemoteEntryImporter(importer?: string) {
  const normalized = normalizeMfImporter(importer);
  if (!normalized) return false;

  return (
    normalized.includes(MF_REMOTE_ENTRY_SSR_ID) ||
    normalized.includes(MF_EXPOSES_SSR_ID) ||
    normalized.includes("/__mf_ssr__/")
  );
}

function normalizeMfImporter(importer?: string) {
  if (!importer) return;

  return importer
    .replace(/^\/@id\//, "")
    .replace(/^__x00__/, "")
    .replace(/^\0/, "");
}
