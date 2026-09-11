import { Platform } from 'react-native';
import { showAlert } from '@/src/context/DialogContext';
import * as FileSystem from 'expo-file-system/legacy';
import * as XLSX from 'xlsx';

type SheetRow = Record<string, string | number>;

async function shareFile(uri: string, mimeType: string, dialogTitle: string) {
  try {
    const Sharing = await import('expo-sharing');
    const available = await Sharing.isAvailableAsync();
    if (!available) {
      showAlert('Partage indisponible', 'Impossible d’ouvrir le menu de partage sur cet appareil.');
      return false;
    }
    await Sharing.shareAsync(uri, { mimeType, dialogTitle, UTI: mimeType });
    return true;
  } catch {
    showAlert('Erreur', 'Le module de partage n’est pas installé. Relancez l’application après mise à jour.');
    return false;
  }
}

export async function exportExcelFile(fileName: string, rows: SheetRow[], sheetName = 'Données') {
  if (rows.length === 0) {
    showAlert('Export', 'Aucune donnée à exporter.');
    return false;
  }
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
  const b64 = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
  const safe = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
  const uri = `${FileSystem.cacheDirectory}${safe}`;
  await FileSystem.writeAsStringAsync(uri, b64, { encoding: FileSystem.EncodingType.Base64 });
  return shareFile(
    uri,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    safe,
  );
}

export async function exportPdfFile(fileName: string, title: string, rows: SheetRow[]) {
  if (rows.length === 0) {
    showAlert('Export', 'Aucune donnée à exporter.');
    return false;
  }
  const keys = Object.keys(rows[0]);
  const head = keys.map((k) => `<th>${escapeHtml(k)}</th>`).join('');
  const body = rows
    .map((r) => `<tr>${keys.map((k) => `<td>${escapeHtml(String(r[k] ?? ''))}</td>`).join('')}</tr>`)
    .join('');
  const html = `<!doctype html>
<html><head><meta charset="utf-8"/>
<style>
  body { font-family: sans-serif; color: #1A1033; padding: 24px; }
  h1 { font-size: 18px; margin: 0 0 4px; }
  p { color: #7C6FA8; font-size: 11px; margin: 0 0 16px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th { background: #16123A; color: #D4AF37; text-align: left; padding: 8px; }
  td { border-bottom: 1px solid #E8E4F2; padding: 8px; }
</style></head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <p>TailorPro · ${new Date().toLocaleDateString('fr-FR')}</p>
  <table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>
</body></html>`;

  try {
    const Print = await import('expo-print');
    const { uri } = await Print.printToFileAsync({ html });
    const safe = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
    const dest = `${FileSystem.cacheDirectory}${safe}`;
    await FileSystem.copyAsync({ from: uri, to: dest });
    return shareFile(dest, 'application/pdf', safe);
  } catch {
    if (Platform.OS === 'web') {
      showAlert('Export PDF', 'Le PDF n’est pas disponible sur le web.');
      return false;
    }
    showAlert('Erreur', 'Impossible de générer le PDF.');
    return false;
  }
}

export async function shareLocalFile(uri: string, mimeType: string, dialogTitle: string) {
  return shareFile(uri, mimeType, dialogTitle);
}

export async function shareHtmlAsPdf(fileName: string, html: string) {
  try {
    const Print = await import('expo-print');
    const { uri } = await Print.printToFileAsync({ html, base64: false });
    const safe = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
    const dest = `${FileSystem.cacheDirectory}${safe}`;
    await FileSystem.copyAsync({ from: uri, to: dest });
    return shareFile(dest, 'application/pdf', safe);
  } catch {
    if (Platform.OS === 'web') {
      showAlert('Export PDF', 'Le PDF n’est pas disponible sur le web.');
      return false;
    }
    showAlert('Erreur', 'Impossible de générer le PDF.');
    return false;
  }
}

export function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
