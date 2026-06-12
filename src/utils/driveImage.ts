/**
 * Normaliza URLs de imagem para que funcionem em <img src>.
 *
 * O Google Drive não serve imagens diretamente pelo link de compartilhamento
 * (https://drive.google.com/file/d/ID/view). Esse link abre uma página HTML,
 * não a imagem. Convertemos para o formato lh3.googleusercontent.com/d/ID,
 * que serve o arquivo bruto (mesmo formato usado no logo do app).
 *
 * Extrai o FILE_ID dos formatos comuns:
 *   https://drive.google.com/file/d/FILE_ID/view?usp=sharing
 *   https://drive.google.com/open?id=FILE_ID
 *   https://drive.google.com/uc?id=FILE_ID&export=download
 *   https://drive.google.com/thumbnail?id=FILE_ID
 */
export function normalizeImageUrl(url: string | null | undefined): string {
  if (!url) return '';
  const u = url.trim();
  if (!u) return '';

  // Já está no formato googleusercontent → mantém
  if (u.includes('googleusercontent.com')) return u;

  // É um link do Google Drive?
  if (u.includes('drive.google.com')) {
    let id = '';
    // /file/d/FILE_ID/...
    const dMatch = u.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (dMatch) id = dMatch[1];
    // ?id=FILE_ID  ou  &id=FILE_ID
    if (!id) {
      const idMatch = u.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (idMatch) id = idMatch[1];
    }
    if (id) return `https://lh3.googleusercontent.com/d/${id}`;
  }

  // Qualquer outra URL (http direto de imagem) passa sem alteração
  return u;
}
