// Keep external text from becoming Markdown structure or terminal control codes.
export function plain(value) {
  return String(value ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g, '');
}

export function md(value) {
  return plain(value).replace(/[\r\n]+/g, ' ').replace(/([\\`*_{}\[\]<>|#!])/g, '\\$1').trim();
}

export function html(value) {
  return plain(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function httpsUrl(value) {
  if (typeof value !== 'string' || /[\s\u0000-\u001f\u007f]/.test(value)) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || !url.hostname || url.username || url.password) return null;
    return url.href.replace(/[()<>"\\]/g, (char) => '%' + char.charCodeAt(0).toString(16).toUpperCase());
  } catch { return null; }
}

export function repoUrl(repo) {
  return 'https://github.com/' + String(repo.full_name || '').split('/').map(encodeURIComponent).join('/');
}
