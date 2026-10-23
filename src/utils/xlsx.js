// 엑셀(.xlsx) 파일 만들기 (사용자 요청: 일정을 엑셀로 내려받기). npm을 쓸 수 없어 라이브러리 없이 직접 만든다.
// xlsx는 XML 파일 몇 개를 zip으로 묶은 것이라, 압축 없이(stored) 묶는다.
//
// sheets: [{ name, rows, cols, merges, freezeRows, heights }]
//   rows: 줄마다 칸 배열. 칸은 값(글·숫자·null) 또는 { v, s } — s는 STYLES의 이름
//   cols: 열 너비(글자 수), merges: ['A1:L1'], freezeRows: 위에서 고정할 줄 수, heights: { 줄 번호(1부터): 높이(pt) }

const STYLES = ['', 'title', 'sub', 'label', 'head', 'text', 'num', 'total', 'totalNum', 'wrap'];

const STYLES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="1"><numFmt numFmtId="164" formatCode="#,##0"/></numFmts>
<fonts count="5">
<font><sz val="10"/><name val="Malgun Gothic"/><family val="2"/></font>
<font><b/><sz val="16"/><color rgb="FF1F6F43"/><name val="Malgun Gothic"/><family val="2"/></font>
<font><sz val="10"/><color rgb="FF666666"/><name val="Malgun Gothic"/><family val="2"/></font>
<font><b/><sz val="10"/><color rgb="FFFFFFFF"/><name val="Malgun Gothic"/><family val="2"/></font>
<font><b/><sz val="10"/><name val="Malgun Gothic"/><family val="2"/></font>
</fonts>
<fills count="5">
<fill><patternFill patternType="none"/></fill>
<fill><patternFill patternType="gray125"/></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FF2E8B57"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFE8F3EC"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFF4F6F5"/></patternFill></fill>
</fills>
<borders count="2">
<border><left/><right/><top/><bottom/><diagonal/></border>
<border><left style="thin"><color rgb="FFC9D3CD"/></left><right style="thin"><color rgb="FFC9D3CD"/></right><top style="thin"><color rgb="FFC9D3CD"/></top><bottom style="thin"><color rgb="FFC9D3CD"/></bottom><diagonal/></border>
</borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="10">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"><alignment vertical="center"/></xf>
<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="0" fontId="4" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment vertical="center"/></xf>
<xf numFmtId="0" fontId="3" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>
<xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
<xf numFmtId="0" fontId="4" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>
<xf numFmtId="164" fontId="4" fillId="3" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

// XML에 넣을 수 없는 제어 문자는 지운다
const xml = (s) => String(s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g, '')
  .replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

const colName = (i) => (i >= 26 ? colName(Math.floor(i / 26) - 1) : '') + String.fromCharCode(65 + (i % 26));

function cellXml(cell, ref) {
  const { v, s } = cell !== null && typeof cell === 'object' ? cell : { v: cell };
  const style = s ? ` s="${STYLES.indexOf(s)}"` : '';
  if (v === null || v === undefined || v === '') return style ? `<c r="${ref}"${style}/>` : '';
  if (typeof v === 'number' && Number.isFinite(v)) return `<c r="${ref}"${style}><v>${v}</v></c>`;
  return `<c r="${ref}"${style} t="inlineStr"><is><t xml:space="preserve">${xml(v)}</t></is></c>`;
}

function sheetXml(sheet) {
  const cols = (sheet.cols ?? []).map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('');
  const rows = sheet.rows.map((row, r) => {
    const height = sheet.heights?.[r + 1];
    const cells = row.map((cell, c) => cellXml(cell, `${colName(c)}${r + 1}`)).join('');
    return `<row r="${r + 1}"${height ? ` ht="${height}" customHeight="1"` : ''}>${cells}</row>`;
  }).join('');
  const freeze = sheet.freezeRows
    ? `<pane ySplit="${sheet.freezeRows}" topLeftCell="A${sheet.freezeRows + 1}" activePane="bottomLeft" state="frozen"/>` : '';
  const merges = sheet.merges?.length
    ? `<mergeCells count="${sheet.merges.length}">${sheet.merges.map((m) => `<mergeCell ref="${m}"/>`).join('')}</mergeCells>` : '';
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<sheetViews><sheetView workbookViewId="0" showGridLines="0">${freeze}</sheetView></sheetViews>
<sheetFormatPr defaultRowHeight="18"/>
${cols ? `<cols>${cols}</cols>` : ''}<sheetData>${rows}</sheetData>${merges}
<pageMargins left="0.5" right="0.5" top="0.6" bottom="0.6" header="0.3" footer="0.3"/>
<pageSetup paperSize="9" orientation="landscape"/>
</worksheet>`;
}

// 시트 이름: 엑셀이 받지 않는 글자를 빼고 31자까지
const sheetName = (name) => String(name).replace(/[[\]:*?/\\]/g, ' ').slice(0, 31) || 'Sheet';

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(bytes) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < bytes.length; i += 1) c = CRC_TABLE[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

// 압축 없는 zip (파일 이름은 UTF-8 표시)
function zip(files) {
  const enc = new TextEncoder();
  const parts = [];
  const central = [];
  let offset = 0;
  files.forEach(({ name, data }) => {
    const nameBytes = enc.encode(name);
    const body = enc.encode(data);
    const crc = crc32(body);
    const head = new DataView(new ArrayBuffer(30));
    [[0, 0x04034b50, 4], [4, 20, 2], [6, 0x0800, 2], [8, 0, 2], [10, 0, 2], [12, 0x21, 2],
      [14, crc, 4], [18, body.length, 4], [22, body.length, 4], [26, nameBytes.length, 2], [28, 0, 2]]
      .forEach(([at, v, size]) => (size === 4 ? head.setUint32(at, v, true) : head.setUint16(at, v, true)));
    const dir = new DataView(new ArrayBuffer(46));
    [[0, 0x02014b50, 4], [4, 20, 2], [6, 20, 2], [8, 0x0800, 2], [10, 0, 2], [12, 0, 2], [14, 0x21, 2],
      [16, crc, 4], [20, body.length, 4], [24, body.length, 4], [28, nameBytes.length, 2],
      [30, 0, 2], [32, 0, 2], [34, 0, 2], [36, 0, 2], [38, 0, 4], [42, offset, 4]]
      .forEach(([at, v, size]) => (size === 4 ? dir.setUint32(at, v, true) : dir.setUint16(at, v, true)));
    parts.push(head, nameBytes, body);
    central.push(dir, nameBytes);
    offset += 30 + nameBytes.length + body.length;
  });
  const dirSize = central.reduce((n, p) => n + p.byteLength, 0);
  const end = new DataView(new ArrayBuffer(22));
  [[0, 0x06054b50, 4], [4, 0, 2], [6, 0, 2], [8, files.length, 2], [10, files.length, 2],
    [12, dirSize, 4], [16, offset, 4], [20, 0, 2]]
    .forEach(([at, v, size]) => (size === 4 ? end.setUint32(at, v, true) : end.setUint16(at, v, true)));
  return new Blob([...parts, ...central, end], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

export function buildXlsx(sheets) {
  const names = sheets.map((s) => sheetName(s.name));
  return zip([
    {
      name: '[Content_Types].xml',
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
${sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('\n')}
</Types>`,
    },
    {
      name: '_rels/.rels',
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`,
    },
    {
      name: 'xl/workbook.xml',
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets>${names.map((n, i) => `<sheet name="${xml(n)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets>
</workbook>`,
    },
    {
      name: 'xl/_rels/workbook.xml.rels',
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('\n')}
<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`,
    },
    { name: 'xl/styles.xml', data: STYLES_XML },
    ...sheets.map((s, i) => ({ name: `xl/worksheets/sheet${i + 1}.xml`, data: sheetXml(s) })),
  ]);
}

// 파일로 내려받기
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
