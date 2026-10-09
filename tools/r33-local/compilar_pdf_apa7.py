"""Append per-entry APA 7 references and clickable related-entry links to full PDFs."""
import io
import json
import pathlib
import re
import sys
from collections import Counter

from pypdf import PdfReader, PdfWriter
from pypdf.generic import ArrayObject, DecodedStreamObject, DictionaryObject, NameObject
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph
from xml.sax.saxutils import escape

ROOT = pathlib.Path(__file__).resolve().parents[2]
WORK = ROOT / "tools/r33-local/workspace/output/r33"
SOURCE_DIR = pathlib.Path(r"C:\Users\Battlestation-Josu\Downloads\github backup mls\bibliotecas")
OUTPUT_DIR = ROOT / "output/pdf"
METADATA_FILE = WORK / "MLS-R33-pdf-metadata.jsonl"
STARTS_FILE = WORK / "MLS-R33-pdf-entry-starts.json"
PDFS = {
    "aleman": ("MLS-Aleman.pdf", "de", "DE"),
    "chino-taiwan": ("MLS-Chino-Taiwan.pdf", "zh-TW", "TW"),
    "coreano": ("MLS-Coreano.pdf", "ko", "KR"),
    "espanol-guatemala": ("MLS-Espanol.pdf", "es", "GT"),
    "frances": ("MLS-Frances.pdf", "fr", "FR"),
    "ingles": ("MLS-Ingles.pdf", "en", "GB"),
    "italiano": ("MLS-Italiano.pdf", "it", "IT"),
    "japones": ("MLS-Japones.pdf", "ja", "JP"),
    "portugues": ("MLS-Portugues.pdf", "pt", "PT"),
    "ruso": ("MLS-Ruso.pdf", "ru", "RU"),
}
LABELS = {
    "de": {"heading": "Quellen und Verweise", "refs": "APA-7-Referenzen", "related": "Verwandte Einträge", "verified": "Kanonische Evidenz: VERIFIED (gleiche Artikelversion)", "pending": "Keine kanonische VERIFIED-Evidenz für diese Artikelversion; keine Quellen zugeordnet.", "stale": "Die PDF-Artikelversion weicht vom aktuellen kanonischen Inhalt ab; Quellen wurden deshalb nicht übernommen.", "incomplete": "Quellen mit unvollständigen bibliografischen Metadaten", "none": "Keine verwandten Einträge verknüpft."},
    "zh-TW": {"heading": "來源與相關條目", "refs": "APA 第 7 版參考資料", "related": "相關條目", "verified": "典藏證據：VERIFIED（文章版本相同）", "pending": "此文章版本沒有相符的典藏 VERIFIED 證據；未附來源。", "stale": "此 PDF 版本與目前典藏內容不同，因此未沿用來源。", "incomplete": "書目資料不完整的來源", "none": "沒有相關條目連結。"},
    "ko": {"heading": "출처 및 관련 항목", "refs": "APA 제7판 참고문헌", "related": "관련 항목", "verified": "정본 증거: VERIFIED (동일한 문서 버전)", "pending": "이 문서 버전과 일치하는 정본 VERIFIED 증거가 없어 출처를 연결하지 않았습니다.", "stale": "PDF의 문서 버전이 현재 정본과 달라 출처를 가져오지 않았습니다.", "incomplete": "서지 정보가 불완전한 출처", "none": "연결된 관련 항목이 없습니다."},
    "es": {"heading": "Fuentes y enlaces relacionados", "refs": "Referencias en formato APA 7", "related": "Entradas relacionadas", "verified": "Evidencia canónica: VERIFIED (misma versión del artículo)", "pending": "Esta versión no tiene Evidence canónica VERIFIED coincidente; no se atribuyeron fuentes.", "stale": "La versión del artículo en este PDF difiere del contenido canónico actual; se omitieron las fuentes.", "incomplete": "Fuentes con metadatos bibliográficos incompletos", "none": "No hay entradas relacionadas enlazadas."},
    "fr": {"heading": "Sources et liens connexes", "refs": "Références au format APA 7", "related": "Entrées connexes", "verified": "Evidence canonique : VERIFIED (même version de l’article)", "pending": "Aucune Evidence canonique VERIFIED ne correspond à cette version ; les sources n’ont pas été attribuées.", "stale": "La version de l’article dans ce PDF diffère du contenu canonique actuel ; les sources ont été omises.", "incomplete": "Sources dont les métadonnées bibliographiques sont incomplètes", "none": "Aucune entrée connexe n’est liée."},
    "en": {"heading": "Sources and related links", "refs": "APA 7 references", "related": "Related entries", "verified": "Canonical evidence: VERIFIED (same article version)", "pending": "No matching canonical VERIFIED evidence for this article version; sources were not attributed.", "stale": "The article version in this PDF differs from current canonical content; sources were omitted.", "incomplete": "Sources with incomplete bibliographic metadata", "none": "No related entries are linked."},
    "it": {"heading": "Fonti e collegamenti correlati", "refs": "Riferimenti in formato APA 7", "related": "Voci correlate", "verified": "Evidence canonica: VERIFIED (stessa versione dell’articolo)", "pending": "Nessuna Evidence canonica VERIFIED corrisponde a questa versione; le fonti non sono state attribuite.", "stale": "La versione dell’articolo in questo PDF differisce dal contenuto canonico attuale; le fonti sono state omesse.", "incomplete": "Fonti con metadati bibliografici incompleti", "none": "Non ci sono voci correlate collegate."},
    "ja": {"heading": "出典と関連項目", "refs": "APA第7版の参考文献", "related": "関連項目", "verified": "正規Evidence：VERIFIED（同じ記事版）", "pending": "この記事版に一致する正規VERIFIED Evidenceがないため、出典を割り当てていません。", "stale": "このPDFの記事版は現在の正規内容と異なるため、出典を引き継いでいません。", "incomplete": "書誌情報が不完全な出典", "none": "関連項目のリンクはありません。"},
    "pt": {"heading": "Fontes e ligações relacionadas", "refs": "Referências no formato APA 7", "related": "Entradas relacionadas", "verified": "Evidence canônica: VERIFIED (mesma versão do artigo)", "pending": "Não há Evidence canônica VERIFIED correspondente a esta versão; as fontes não foram atribuídas.", "stale": "A versão do artigo neste PDF difere do conteúdo canônico atual; as fontes foram omitidas.", "incomplete": "Fontes com metadados bibliográficos incompletos", "none": "Não há entradas relacionadas vinculadas."},
    "ru": {"heading": "Источники и связанные статьи", "refs": "Список литературы APA 7", "related": "Связанные статьи", "verified": "Канонические данные: VERIFIED (версия статьи совпадает)", "pending": "Для этой версии нет совпадающих канонических данных VERIFIED; источники не указаны.", "stale": "Версия статьи в PDF отличается от текущего канонического текста; источники не перенесены.", "incomplete": "Источники с неполными библиографическими данными", "none": "Связанные статьи не указаны."},
}
FLAGS = {"DE": "de", "TW": "zh-TW", "KR": "ko", "GT": "es", "FR": "fr", "GB": "en", "IT": "it", "JP": "ja", "PT": "pt", "RU": "ru"}
BG = colors.HexColor("#F6F3EC")
INK = colors.HexColor("#242321")
MUTED = colors.HexColor("#746F68")
ACCENT = colors.HexColor("#087E9B")
RULE = colors.HexColor("#DED8CE")
PAGE_W, PAGE_H = A4
LEFT, RIGHT, TOP, BOTTOM = 54, 54, 70, 68


def register_fonts():
    font_dir = pathlib.Path(r"C:\Windows\Fonts")
    arial = font_dir / "arial.ttf"
    arial_bold = font_dir / "arialbd.ttf"
    arial_italic = font_dir / "ariali.ttf"
    if arial.exists() and arial_bold.exists():
        pdfmetrics.registerFont(TTFont("MLSBody", str(arial)))
        pdfmetrics.registerFont(TTFont("MLSBodyBold", str(arial_bold)))
        pdfmetrics.registerFont(TTFont("MLSBodyItalic", str(arial_italic if arial_italic.exists() else arial)))
        pdfmetrics.registerFontFamily("MLSBody", normal="MLSBody", bold="MLSBodyBold", italic="MLSBodyItalic", boldItalic="MLSBodyBold")
        for font in ("STSong-Light", "HeiseiKakuGo-W5", "HYSMyeongJo-Medium"):
            pdfmetrics.registerFont(UnicodeCIDFont(font))
        return {"default": "MLSBody", "de": "MLSBody", "es": "MLSBody", "fr": "MLSBody", "en": "MLSBody", "it": "MLSBody", "pt": "MLSBody", "ru": "MLSBody", "zh-TW": "STSong-Light", "ja": "HeiseiKakuGo-W5", "ko": "HYSMyeongJo-Medium"}
    for font in ("STSong-Light", "HeiseiKakuGo-W5", "HYSMyeongJo-Medium"):
        pdfmetrics.registerFont(UnicodeCIDFont(font))
    return {"default": "HeiseiKakuGo-W5", "de": "HeiseiKakuGo-W5", "es": "HeiseiKakuGo-W5", "fr": "HeiseiKakuGo-W5", "en": "HeiseiKakuGo-W5", "it": "HeiseiKakuGo-W5", "pt": "HeiseiKakuGo-W5", "ru": "HeiseiKakuGo-W5", "zh-TW": "STSong-Light", "ja": "HeiseiKakuGo-W5", "ko": "HYSMyeongJo-Medium"}


FONTS = register_fonts()


def flag(c, code, x, y, w=29, h=18):
    c.saveState()
    c.setLineWidth(0.45)
    c.setStrokeColor(colors.HexColor("#B9B4AC"))
    c.setFillColor(colors.white)
    c.rect(x, y, w, h, stroke=1, fill=1)
    if code == "DE":
        for i, color in enumerate(("#111111", "#D4232A", "#F1C232")):
            c.setFillColor(colors.HexColor(color)); c.rect(x, y + h * (2-i) / 3, w, h / 3, stroke=0, fill=1)
    elif code == "TW":
        c.setFillColor(colors.HexColor("#E2231A")); c.rect(x, y, w, h, stroke=0, fill=1)
        c.setFillColor(colors.HexColor("#001A70")); c.rect(x, y + h*0.45, w*0.52, h*0.55, stroke=0, fill=1)
        c.setFillColor(colors.white); c.circle(x+w*0.26, y+h*0.73, h*0.15, stroke=0, fill=1)
        c.setFillColor(colors.HexColor("#001A70")); c.circle(x+w*0.26, y+h*0.73, h*0.08, stroke=0, fill=1)
    elif code == "KR":
        c.setFillColor(colors.HexColor("#CD2E3A")); c.wedge(x+w*.36, y+h*.19, x+w*.67, y+h*.81, 0, 180, stroke=0, fill=1)
        c.setFillColor(colors.HexColor("#0047A0")); c.wedge(x+w*.36, y+h*.19, x+w*.67, y+h*.81, 180, 180, stroke=0, fill=1)
    elif code == "GT":
        for i, color in enumerate(("#4997D0", "#FFFFFF", "#4997D0")):
            c.setFillColor(colors.HexColor(color)); c.rect(x+w*i/3, y, w/3, h, stroke=0, fill=1)
    elif code in ("FR", "IT", "PT"):
        palette = {"FR": ("#0055A4", "#FFFFFF", "#EF4135"), "IT": ("#009246", "#FFFFFF", "#CE2B37"), "PT": ("#006600", "#006600", "#FF0000")}[code]
        for i, color in enumerate(palette):
            c.setFillColor(colors.HexColor(color)); c.rect(x+w*i/3, y, w/3, h, stroke=0, fill=1)
        if code == "PT":
            c.setFillColor(colors.HexColor("#FFCC00")); c.circle(x+w*.43, y+h*.5, h*.16, stroke=0, fill=1)
    elif code == "JP":
        c.setFillColor(colors.HexColor("#BC002D")); c.circle(x+w/2, y+h/2, h*.3, stroke=0, fill=1)
    elif code == "RU":
        for i, color in enumerate(("#FFFFFF", "#0039A6", "#D52B1E")):
            c.setFillColor(colors.HexColor(color)); c.rect(x, y+h*(2-i)/3, w, h/3, stroke=0, fill=1)
    elif code == "GB":
        c.setFillColor(colors.HexColor("#012169")); c.rect(x, y, w, h, stroke=0, fill=1)
        c.setStrokeColor(colors.white); c.setLineWidth(h*.26); c.line(x, y, x+w, y+h); c.line(x, y+h, x+w, y)
        c.setStrokeColor(colors.HexColor("#C8102E")); c.setLineWidth(h*.1); c.line(x, y, x+w, y+h); c.line(x, y+h, x+w, y)
        c.setFillColor(colors.white); c.rect(x+w*.39, y, w*.22, h, stroke=0, fill=1); c.rect(x, y+h*.35, w, h*.30, stroke=0, fill=1)
        c.setFillColor(colors.HexColor("#C8102E")); c.rect(x+w*.45, y, w*.10, h, stroke=0, fill=1); c.rect(x, y+h*.42, w, h*.16, stroke=0, fill=1)
    c.setStrokeColor(colors.HexColor("#B9B4AC")); c.rect(x, y, w, h, stroke=1, fill=0)
    c.restoreState()


def header(c, meta, lang, country, labels, continuation=False):
    c.setFillColor(BG); c.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)
    flag(c, country, LEFT, PAGE_H-42)
    c.setFillColor(INK); c.setFont(FONTS.get(lang, FONTS["default"]), 9)
    c.drawString(LEFT+38, PAGE_H-32, "MASTER LANGUAGE SYSTEM")
    c.setFillColor(MUTED); c.setFont(FONTS.get(lang, FONTS["default"]), 8)
    c.drawString(LEFT+38, PAGE_H-44, str(meta.get("languageName") or lang))
    c.setStrokeColor(RULE); c.line(LEFT, PAGE_H-58, PAGE_W-RIGHT, PAGE_H-58)
    title = labels["heading"] + (" · " + str(meta["code"]) if continuation else "")
    c.setFillColor(INK); c.setFont(FONTS.get(lang, FONTS["default"]), 18)
    c.drawString(LEFT, PAGE_H-90, title)
    if not continuation:
        subtitle_text = f"{meta.get('number', '')} · {meta.get('title', '')} · {meta.get('code', '')}"
        subtitle_style = ParagraphStyle("EntrySubtitle", fontName=FONTS.get(lang, FONTS["default"]), fontSize=9, leading=11, textColor=MUTED, wordWrap="CJK")
        subtitle = Paragraph(escape(subtitle_text), subtitle_style)
        _, subtitle_height = subtitle.wrap(PAGE_W-LEFT-RIGHT, PAGE_H)
        subtitle.drawOn(c, LEFT, PAGE_H-111-subtitle_height)
        return PAGE_H-123-subtitle_height
    return PAGE_H-132


def clean_markup(markdown):
    escaped = escape(str(markdown or ""))
    escaped = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", escaped, flags=re.S)
    escaped = re.sub(r"(?<!\*)\*([^*]+)\*(?!\*)", r"<i>\1</i>", escaped)
    escaped = re.sub(r"`([^`]+)`", r"<font name='MLSBodyBold'>\1</font>", escaped)
    return escaped


def draw_appendix(c, meta, lang, country, labels, number_to_code, code_to_title, start_pages):
    page_indices = []
    text_font = FONTS.get(lang, FONTS["default"])
    body = ParagraphStyle("Body", fontName=text_font, fontSize=8.5, leading=12, textColor=INK, spaceAfter=7, wordWrap="CJK")
    heading = ParagraphStyle("Heading", fontName=text_font, fontSize=10.5, leading=14, textColor=ACCENT, spaceBefore=7, spaceAfter=7, wordWrap="CJK")
    small = ParagraphStyle("Small", fontName=text_font, fontSize=8, leading=11, textColor=MUTED, spaceAfter=7, wordWrap="CJK")
    page_no = 0

    def new_page(continuation=False):
        nonlocal page_no
        if page_no:
            c.showPage()
        body_top = header(c, meta, lang, country, labels, continuation=continuation)
        page_no += 1
        # Canvas spans every entry's supplement, so the PDF page index must be
        # global rather than reset to zero for each entry.
        page_indices.append(c.getPageNumber()-1)
        return body_top

    y = new_page()
    if meta.get("canonicalVerified") and meta.get("evidenceVersionMatches"):
        status_text = labels["verified"]
    elif not meta.get("pdfVersionMatchesCanonical", False):
        status_text = labels["stale"]
    else:
        status_text = labels["pending"]
    p = Paragraph(escape(status_text), small)
    _, h = p.wrap(PAGE_W-LEFT-RIGHT, y)
    p.drawOn(c, LEFT, y-h); y -= h+10

    usable_refs = [r for r in meta.get("references", []) if r.get("citationReady") and meta.get("canonicalVerified") and meta.get("pdfVersionMatchesCanonical", False)]
    incomplete = [r for r in meta.get("references", []) if not r.get("citationReady") and meta.get("canonicalVerified") and meta.get("pdfVersionMatchesCanonical", False)]
    if usable_refs:
        p = Paragraph(escape(labels["refs"]), heading); _, h = p.wrap(PAGE_W-LEFT-RIGHT, y); p.drawOn(c, LEFT, y-h); y -= h+2
        for ref in usable_refs:
            citation = clean_markup(ref.get("text", ""))
            url = ref.get("url")
            if url:
                escaped_url = escape(str(url), {"'": "&apos;"})
                citation = citation.replace(escape(str(url)), f"<link href='{escaped_url}' color='#087E9B'>{escape(str(url))}</link>")
            para = Paragraph(citation, body)
            _, h = para.wrap(PAGE_W-LEFT-RIGHT, y)
            if y-h < BOTTOM+46:
                y = new_page(continuation=True)
            para.drawOn(c, LEFT, y-h); y -= h+5
    if incomplete:
        if y < BOTTOM+80:
            y = new_page(continuation=True)
        p = Paragraph(escape(labels["incomplete"]), heading); _, h = p.wrap(PAGE_W-LEFT-RIGHT, y); p.drawOn(c, LEFT, y-h); y -= h+2
        for ref in incomplete:
            fallback = escape(ref.get("title") or ref.get("sourceId") or "")
            if ref.get("url"):
                url = escape(str(ref["url"]), {"'": "&apos;"})
                fallback += f" · <link href='{url}' color='#087E9B'>{escape(str(ref['url']))}</link>"
            para = Paragraph(fallback, body); _, h = para.wrap(PAGE_W-LEFT-RIGHT, y)
            if y-h < BOTTOM+42:
                y = new_page(continuation=True)
            para.drawOn(c, LEFT, y-h); y -= h+5

    related = []
    unresolved = []
    for item in meta.get("related", []):
        target = number_to_code.get(item.get("number"))
        if target and target in start_pages:
            related.append((item.get("label") or code_to_title.get(target) or target, target))
        else:
            unresolved.append(item)
    if y < BOTTOM+90:
        y = new_page(continuation=True)
    p = Paragraph(escape(labels["related"]), heading); _, h = p.wrap(PAGE_W-LEFT-RIGHT, y); p.drawOn(c, LEFT, y-h); y -= h+2
    if related:
        for label, target in related:
            line = f"<link href='mls-entry:{target}' color='#087E9B'>{escape(str(label))}</link> · {escape(str(code_to_title.get(target, target)))} <font color='#746F68'>({target})</font>"
            para = Paragraph(line, body); _, h = para.wrap(PAGE_W-LEFT-RIGHT, y)
            if y-h < BOTTOM+42:
                y = new_page(continuation=True)
            para.drawOn(c, LEFT, y-h); y -= h+4
    else:
        p = Paragraph(escape(labels["none"]), small); _, h = p.wrap(PAGE_W-LEFT-RIGHT, y); p.drawOn(c, LEFT, y-h); y -= h+4
    return page_indices, len(usable_refs), len(related), len(unresolved)


def add_final_page_numbers(writer, start_page=0):
    total = len(writer.pages)
    font = DictionaryObject({
        NameObject("/Type"): NameObject("/Font"),
        NameObject("/Subtype"): NameObject("/Type1"),
        NameObject("/BaseFont"): NameObject("/Helvetica"),
        NameObject("/Encoding"): NameObject("/WinAnsiEncoding"),
    })
    font_ref = writer._add_object(font)
    for idx in range(start_page, total):
        page = writer.pages[idx]
        width = float(page.mediabox.width); height = float(page.mediabox.height)
        resources = page.get("/Resources").get_object()
        new_resources = DictionaryObject({key: value for key, value in resources.items()})
        old_fonts = resources.get("/Font")
        fonts = DictionaryObject({key: value for key, value in old_fonts.get_object().items()}) if old_fonts else DictionaryObject()
        fonts[NameObject("/MLSPgNo")] = font_ref
        new_resources[NameObject("/Font")] = fonts
        page[NameObject("/Resources")] = new_resources
        x = width - 57
        commands = (
            "q\n0.965 0.953 0.925 rg\n"
            f"{width-94:.2f} 34 78 20 re f\nQ\n"
            "BT\n/MLSPgNo 7 Tf\n0.45 0.43 0.41 rg\n"
            f"1 0 0 1 {x:.2f} 41 Tm\n({idx+1} / {total}) Tj\nET\n"
        ).encode("ascii")
        stream = DecodedStreamObject(); stream.set_data(commands)
        stream_ref = writer._add_object(stream)
        contents = page.get("/Contents")
        current = contents.get_object() if contents is not None else None
        if isinstance(current, ArrayObject):
            page[NameObject("/Contents")] = ArrayObject(list(current) + [stream_ref])
        elif current is None:
            page[NameObject("/Contents")] = stream_ref
        else:
            page[NameObject("/Contents")] = ArrayObject([contents, stream_ref])


def normalized_pdf_text(value):
    return re.sub(r"\s+", "", str(value or "")).casefold()


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    metadata = [json.loads(line) for line in METADATA_FILE.read_text(encoding="utf-8").splitlines() if line.strip()]
    metadata_by_language = {}
    for row in metadata:
        metadata_by_language.setdefault(row["language"], []).append(row)
    starts_data = json.loads(STARTS_FILE.read_text(encoding="utf-8"))
    report = {"schema": "MLS-R33-PDF-APA7-1", "outputs": [], "brokenRelatedLinks": [], "pdfTitleMismatches": [], "references": 0}
    for language, (filename, locale, country) in PDFS.items():
        source = SOURCE_DIR / filename
        if not source.is_file():
            raise FileNotFoundError(source)
        entries = metadata_by_language.get(language, [])
        starts = starts_data[language]["starts"]
        expected_codes = {x["code"] for x in entries}
        if set(starts) != expected_codes:
            raise RuntimeError(f"PDF entry coverage mismatch for {language}: missing={len(expected_codes-set(starts))}, unexpected={len(set(starts)-expected_codes)}")
        number_to_code = {int(x["number"]): x["code"] for x in entries}
        code_to_title = {x["code"]: x.get("title", "") for x in entries}
        by_code = {x["code"]: x for x in entries}
        source_reader = PdfReader(str(source), strict=False)
        ordered = sorted(starts.items(), key=lambda x: x[1])
        appendix_buffer = io.BytesIO()
        c = canvas.Canvas(appendix_buffer, pagesize=A4, pageCompression=1)
        appendix_ranges = {}
        counts = Counter()
        for entry_pos, (code, _) in enumerate(ordered):
            if entry_pos:
                # Start each entry on its own newly generated page. Continuation
                # pages inside draw_appendix are separated by new_page().
                c.showPage()
            meta = by_code[code]
            # The original PDFs are generated from the imported backup. Only exact canonical
            # article versions may inherit their canonical Evidence references.
            first_text = source_reader.pages[starts[code]].extract_text() or ""
            expected_title = normalized_pdf_text(meta.get("backupTitle"))
            meta["pdfTitleMatchesBackup"] = bool(expected_title and expected_title in normalized_pdf_text(first_text))
            if not meta["pdfTitleMatchesBackup"]:
                report["pdfTitleMismatches"].append({"code": code, "language": language, "expectedBackupTitle": meta.get("backupTitle")})
            meta["pdfVersionMatchesCanonical"] = bool(meta.get("backupVersionMatchesCanonical", False) and meta["pdfTitleMatchesBackup"])
            if not meta["pdfVersionMatchesCanonical"]:
                meta["canonicalVerified"] = False
            page_ids, ref_count, related_count, unresolved_count = draw_appendix(c, meta, locale, country, LABELS[locale], number_to_code, code_to_title, starts)
            appendix_ranges[code] = page_ids
            counts["appendixPages"] += len(page_ids)
            counts["references"] += ref_count
            counts["relatedLinks"] += related_count
            counts["unresolvedRelatedLinks"] += unresolved_count
            if unresolved_count:
                report["brokenRelatedLinks"].append({"code": code, "language": language, "unresolved": unresolved_count})
        c.save(); appendix_buffer.seek(0)
        supplement = PdfReader(appendix_buffer, strict=False)
        writer = PdfWriter(clone_from=source_reader)
        code_pages = {code: start for code, start in ordered}
        code_page_refs = {code: writer.pages[start].indirect_reference for code, start in ordered}
        for code, start in ordered:
            writer.add_named_destination(code, start)
        # Keep the original book, chapter pagination, and table of contents intact.
        # Place one source/link page per entry after the complete original volume.
        for supp_page in supplement.pages:
            writer.add_page(supp_page)
        # Convert reportlab's synthetic internal URIs into real PDF GoTo links.
        for page_i, page in enumerate(writer.pages):
            for annotation_ref in page.get("/Annots", []):
                annotation = annotation_ref.get_object()
                action = annotation.get("/A")
                uri = str(action.get("/URI", "")) if action else ""
                if not uri.startswith("mls-entry:"):
                    continue
                target_code = uri.split(":", 1)[1]
                if target_code not in code_pages:
                    report["brokenRelatedLinks"].append({"code": target_code, "language": language, "fromPage": page_i+1})
                    continue
                annotation.pop(NameObject("/A"), None)
                annotation[NameObject("/Dest")] = ArrayObject([code_page_refs[target_code], NameObject("/Fit")])
        add_final_page_numbers(writer, start_page=len(source_reader.pages))
        dest = OUTPUT_DIR / filename
        with dest.open("wb") as stream:
            writer.write(stream)
        report["references"] += counts["references"]
        report["outputs"].append({"language": language, "file": str(dest), "entries": len(entries), "sourcePages": len(source_reader.pages), "supplementPages": counts["appendixPages"], "outputPages": len(writer.pages), "apaReferences": counts["references"], "relatedEntryLinks": counts["relatedLinks"], "unresolvedRelatedLinks": counts["unresolvedRelatedLinks"]})
        print(f"{language}: entries={len(entries)} pages={len(writer.pages)} refs={counts['references']} related={counts['relatedLinks']}", flush=True)
    report_path = OUTPUT_DIR / "MLS-R33-PDF-APA7-manifest.json"
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"manifest": str(report_path), "outputs": len(report["outputs"]), "entries": sum(x["entries"] for x in report["outputs"]), "brokenRelatedLinks": len(report["brokenRelatedLinks"])}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
