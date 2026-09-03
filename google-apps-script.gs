const SHEET_NAME = 'Leads';

function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'createdAt','tipo','nombre','email','whatsapp','matricula','jurisdiccion',
      'modalidad','zona','orientacion','nuevos','agenda','pago','necesidad','consentimiento'
    ]);
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents || '{}');
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    sheet.appendRow([
      new Date(), data.tipo || '', data.nombre || '', data.email || '', data.whatsapp || '',
      data.matricula || '', data.jurisdiccion || '', data.modalidad || '', data.zona || '',
      data.orientacion || '', data.nuevos || '', data.agenda || '', data.pago || '',
      data.necesidad || '', data.consentimiento ? 'sí' : 'no'
    ]);
    return json({ok:true});
  } catch (err) {
    return json({ok:false, error:String(err)});
  }
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
