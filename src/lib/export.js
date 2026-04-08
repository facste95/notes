function stripHtml(html) {
  return html
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function noteToText(note) {
  return `${note.title}\n${'='.repeat(note.title.length)}\n\n${stripHtml(note.content)}`;
}

export function noteToMarkdown(note) {
  return `# ${note.title}\n\n${stripHtml(note.content)}`;
}

export function noteToHtml(note) {
  return `<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8"><title>${note.title}</title></head>
<body>
<h1>${note.title}</h1>
${note.content}
</body>
</html>`;
}

export function notesToJson(notes) {
  return JSON.stringify({ version: 1, exportedAt: Date.now(), notes }, null, 2);
}

export function parseJsonBackup(json) {
  const data = JSON.parse(json); // throws on invalid JSON
  if (!data.notes || !Array.isArray(data.notes)) {
    throw new Error('Invalid backup format');
  }
  return data;
}

export function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
