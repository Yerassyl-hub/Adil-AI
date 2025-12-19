import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { Checklist } from '../types/checklist';
import type { DocumentForm } from '../types/documents';
import { formatDate } from '../utils/date';

/**
 * PDF generation utilities
 */

export const generateChecklistPDF = async (checklist: Checklist): Promise<string> => {
  const progressPercent = Math.round(checklist.progress);
  const doneCount = checklist.items.filter((item) => item.done).length;
  const totalCount = checklist.items.length;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
          padding: 40px;
          color: #333;
          line-height: 1.6;
        }
        h1 {
          font-size: 24px;
          margin-bottom: 10px;
          color: #1a1a1a;
        }
        .description {
          color: #666;
          margin-bottom: 30px;
          font-size: 14px;
        }
        .progress-section {
          margin: 30px 0;
          padding: 20px;
          background: #f5f5f5;
          border-radius: 8px;
        }
        .progress-bar {
          width: 100%;
          height: 24px;
          background: #e0e0e0;
          border-radius: 12px;
          overflow: hidden;
          margin: 10px 0;
        }
        .progress-fill {
          height: 100%;
          background: #4CAF50;
          width: ${progressPercent}%;
          transition: width 0.3s;
        }
        .progress-text {
          text-align: center;
          margin-top: 10px;
          font-weight: 600;
          color: #333;
        }
        .items {
          margin-top: 30px;
        }
        .item {
          padding: 15px;
          margin: 10px 0;
          border: 1px solid #ddd;
          border-radius: 6px;
          display: flex;
          align-items: flex-start;
        }
        .item.done {
          background: #f0f8f0;
          border-color: #4CAF50;
        }
        .item.critical {
          border-left: 4px solid #f44336;
        }
        .item-checkbox {
          width: 20px;
          height: 20px;
          border: 2px solid #333;
          border-radius: 4px;
          margin-right: 15px;
          margin-top: 2px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .item-checkbox.checked {
          background: #4CAF50;
          border-color: #4CAF50;
        }
        .item-checkbox.checked::after {
          content: '✓';
          color: white;
          font-size: 14px;
          font-weight: bold;
        }
        .item-content {
          flex: 1;
        }
        .item-text {
          font-size: 15px;
          margin-bottom: 5px;
        }
        .item-date {
          font-size: 12px;
          color: #666;
        }
        .item-critical {
          display: inline-block;
          background: #ffebee;
          color: #c62828;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
          margin-top: 5px;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          text-align: center;
          color: #999;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <h1>${checklist.title}</h1>
      ${checklist.description ? `<div class="description">${checklist.description}</div>` : ''}
      
      <div class="progress-section">
        <div class="progress-bar">
          <div class="progress-fill"></div>
        </div>
        <div class="progress-text">
          ${doneCount} из ${totalCount} выполнено (${progressPercent}%)
        </div>
      </div>

      <div class="items">
        ${checklist.items
          .map(
            (item) => `
          <div class="item ${item.done ? 'done' : ''} ${item.critical ? 'critical' : ''}">
            <div class="item-checkbox ${item.done ? 'checked' : ''}"></div>
            <div class="item-content">
              <div class="item-text">${item.text}</div>
              ${item.dueDate ? `<div class="item-date">Срок: ${formatDate(item.dueDate)}</div>` : ''}
              ${item.critical ? '<div class="item-critical">Критично</div>' : ''}
            </div>
          </div>
        `
          )
          .join('')}
      </div>

      <div class="footer">
        Сгенерировано: ${formatDate(new Date())}
      </div>
    </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({ html });
  return uri;
};

export const generateDocumentPDF = async (form: DocumentForm, previewHtml: string): Promise<string> => {
  // Use the preview HTML from the API, or generate our own
  const html = previewHtml || `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
          padding: 40px;
          color: #333;
          line-height: 1.6;
        }
        h1 {
          font-size: 24px;
          margin-bottom: 30px;
          text-align: center;
          color: #1a1a1a;
        }
        .section {
          margin: 25px 0;
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 8px;
        }
        .field {
          margin: 15px 0;
        }
        .label {
          font-weight: 600;
          color: #555;
          margin-bottom: 5px;
          display: block;
        }
        .value {
          color: #333;
          font-size: 15px;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          text-align: center;
          color: #999;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <h1>Документ</h1>
      <div class="section">
        <div class="field">
          <span class="label">Стороны:</span>
          <div class="value">${form.parties?.join(', ') || ''}</div>
        </div>
        <div class="field">
          <span class="label">Город:</span>
          <div class="value">${form.city || ''}</div>
        </div>
        <div class="field">
          <span class="label">Предмет:</span>
          <div class="value">${form.subject || ''}</div>
        </div>
        ${form.dates?.start ? `
        <div class="field">
          <span class="label">Дата начала:</span>
          <div class="value">${formatDate(form.dates.start)}</div>
        </div>
        ` : ''}
        ${form.dates?.end ? `
        <div class="field">
          <span class="label">Дата окончания:</span>
          <div class="value">${formatDate(form.dates.end)}</div>
        </div>
        ` : ''}
      </div>
      <div class="footer">
        Сгенерировано: ${formatDate(new Date())}
      </div>
    </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({ html });
  return uri;
};

export const sharePDF = async (pdfUri: string, filename: string = 'document.pdf'): Promise<void> => {
  const isAvailable = await Sharing.isAvailableAsync();
  if (isAvailable) {
    await Sharing.shareAsync(pdfUri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Поделиться PDF',
    });
  } else {
    console.warn('Sharing is not available on this platform');
  }
};

export const savePDF = async (pdfUri: string, filename: string): Promise<string> => {
  const documentsDir = FileSystem.documentDirectory;
  if (!documentsDir) {
    throw new Error('Document directory not available');
  }

  const newPath = `${documentsDir}${filename}`;
  await FileSystem.copyAsync({
    from: pdfUri,
    to: newPath,
  });

  return newPath;
};



