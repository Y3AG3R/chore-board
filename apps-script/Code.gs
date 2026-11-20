/**
 * Family Chore Board: Google Sheet backend.
 *
 * Paste this whole file into Extensions > Apps Script on your chore Google Sheet,
 * then Deploy > New deployment > Web app (Execute as: Me, Who has access: Anyone).
 *
 * The sheet gets two tabs:
 *   Chores       Room | Chore | Frequency | Points | Owner | ID   (edit this tab to change the plan)
 *   Completions  ID | Chore ID | Person | Points | Period | Date | Time
 */

const CHORES_TAB = 'Chores';
const DONE_TAB = 'Completions';
const CHORE_HEADERS = ['Room', 'Chore', 'Frequency', 'Points', 'Owner', 'ID'];
const DONE_HEADERS = ['ID', 'Chore ID', 'Person', 'Points', 'Period', 'Date', 'Time'];
const PEOPLE = ['Tracy', 'Billy', 'Vivian'];
// Leave blank when the script is opened from the sheet (Extensions > Apps Script).
// For a standalone script, paste the sheet's ID from its URL: docs.google.com/spreadsheets/d/<ID>/edit
const SHEET_ID = '';

function book_() {
  return SHEET_ID ? SpreadsheetApp.openById(SHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
}

function doGet(e) {
  return json_(readState_((e && e.parameter && e.parameter.since) || ''));
}

function doPost(e) {
  const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    if (body.op === 'done') markDone_(body.record || {});
    else if (body.op === 'undo') undo_(String(body.id || ''));
    else if (body.op === 'seed') seed_(body.chores || []);
  } finally {
    lock.releaseLock();
  }
  return json_(readState_(body.since || ''));
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function tab_(name, headers) {
  const ss = book_();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

function rows_(sh) {
  const n = sh.getLastRow() - 1;
  if (n < 1) return [];
  return sh.getRange(2, 1, n, sh.getLastColumn()).getValues();
}

function slug_(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'chore';
}

function dateText_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  return String(v);
}

function readChores_() {
  const sh = tab_(CHORES_TAB, CHORE_HEADERS);
  const data = rows_(sh);
  const used = {};
  const out = [];
  let wroteIds = false;
  data.forEach(function (r, i) {
    const name = String(r[1] || '').trim();
    if (!name) return;
    let id = String(r[5] || '').trim();
    if (!id || used[id]) {
      id = slug_(r[0]) + '-' + slug_(name);
      while (used[id]) id += 'x';
      sh.getRange(i + 2, 6).setValue(id);
      wroteIds = true;
    }
    used[id] = true;
    const f = String(r[2] || 'Weekly').trim().charAt(0).toLowerCase();
    out.push({
      id: id,
      room: String(r[0] || 'Other').trim(),
      name: name,
      freq: f === 'd' ? 'd' : f === 'm' ? 'm' : 'w',
      pts: Number(r[3]) || 5,
      owner: String(r[4] || '').trim(),
    });
  });
  if (wroteIds) SpreadsheetApp.flush();
  return out;
}

function readState_(since) {
  const done = rows_(tab_(DONE_TAB, DONE_HEADERS))
    .map(function (r) {
      return { id: String(r[0]), chore: String(r[1]), person: String(r[2]), pts: Number(r[3]) || 0, period: String(r[4]), date: dateText_(r[5]), ts: Number(r[6]) || 0 };
    })
    .filter(function (c) { return c.id && (!since || c.date >= since); });
  return { ok: true, people: PEOPLE, chores: readChores_(), completions: done };
}

function markDone_(rec) {
  const id = String(rec.id || '');
  if (!id || PEOPLE.indexOf(rec.person) < 0) return;
  const sh = tab_(DONE_TAB, DONE_HEADERS);
  const ids = rows_(sh).map(function (r) { return String(r[0]); });
  if (ids.indexOf(id) >= 0) return; // already done this period
  sh.getRange(sh.getLastRow() + 1, 1, 1, 7).setNumberFormat('@').setValues([[
    id, String(rec.chore || ''), rec.person, Number(rec.pts) || 0, String(rec.period || ''), String(rec.date || ''), String(Number(rec.ts) || Date.now()),
  ]]);
}

function undo_(id) {
  if (!id) return;
  const sh = tab_(DONE_TAB, DONE_HEADERS);
  const data = rows_(sh);
  for (let i = data.length - 1; i >= 0; i--) {
    if (String(data[i][0]) === id) sh.deleteRow(i + 2);
  }
}

// Fills the Chores tab with the starter plan, only if it is empty.
function seed_(chores) {
  const sh = tab_(CHORES_TAB, CHORE_HEADERS);
  if (sh.getLastRow() > 1 || !chores.length) return;
  const label = { d: 'Daily', w: 'Weekly', m: 'Monthly' };
  const values = chores.map(function (c) { return [c.room, c.name, label[c.freq] || 'Weekly', c.pts, c.owner, c.id]; });
  sh.getRange(2, 1, values.length, 6).setValues(values);
  sh.autoResizeColumns(1, 6);
  const rule = SpreadsheetApp.newDataValidation().requireValueInList(['Daily', 'Weekly', 'Monthly'], true).build();
  sh.getRange(2, 3, 500, 1).setDataValidation(rule);
  const who = SpreadsheetApp.newDataValidation().requireValueInList(PEOPLE, true).build();
  sh.getRange(2, 5, 500, 1).setDataValidation(who);
}
