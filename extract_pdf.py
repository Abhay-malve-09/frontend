import re
import json
import sys

try:
    from PyPDF2 import PdfReader
except ImportError:
    print(json.dumps({"error":"missing-pypdf2"}))
    sys.exit(0)

PDF_PATH = 'ABHAY Malve.....pdf'

def extract_text(path):
    reader = PdfReader(path)
    pages = []
    for p in reader.pages:
        try:
            pages.append(p.extract_text() or '')
        except Exception:
            pages.append('')
    return '\n\n'.join(pages)

text = extract_text(PDF_PATH)
clean = re.sub(r"\s+", ' ', text).strip()

result = {"raw": clean}

# simple extractors
m = re.search(r'Name[:\-\s]{1,5}([A-Z][A-Za-z .,-]{2,100})', clean)
if m:
    result['name'] = m.group(1).strip()

m = re.search(r'Email[:\-\s]{0,5}([\w.%-]+@[\w.-]+\.[A-Za-z]{2,6})', clean, re.IGNORECASE)
if m:
    result['email'] = m.group(1).strip()

m = re.search(r'Phone[:\-\s]{0,5}([+\d][\d \-()]{6,20}\d)', clean, re.IGNORECASE)
if m:
    result['phone'] = m.group(1).strip()

# Objective
m = re.search(r'(Objective|Career Objective)[:\-\s]*(.*?)((Education|Experience|Certif|Projects|Skills|Languages)[:\-\s])', clean, re.IGNORECASE)
if m:
    result['objective'] = m.group(2).strip()
else:
    # try short first paragraph as objective
    first_sentence = clean.split('.')
    if first_sentence:
        result.setdefault('objective', first_sentence[0].strip())

# Sections by headings
def section_between(start_kw, end_kws):
    s = re.search(start_kw + r'(.*?)(?:' + '|'.join(end_kws) + r')', clean, re.IGNORECASE)
    return s.group(1).strip() if s else None

result['education'] = section_between('Education', ['Experience', 'Projects', 'Certif', 'Skills', 'Languages'])
result['experience'] = section_between('Experience', ['Education', 'Projects', 'Certif', 'Skills', 'Languages'])
result['certifications'] = section_between('Certificat', ['Projects', 'Experience', 'Education', 'Skills', 'Languages'])
result['projects'] = section_between('Project', ['Certificat', 'Experience', 'Education', 'Skills', 'Languages'])
result['languages'] = section_between('Languages', ['$'])

print(json.dumps(result, ensure_ascii=False))
