"""Coverage and public-output checks for the project archive."""
import json
import unittest
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
EXPECTED = set('marblewalk minerva oracle-x forge-studio legacy-mcp figmcp marblewalk-global rapi home-control-plane rapi-v1 onchain-credit pixel-trading-floor mini-arcade iseonjwa app-factory ringtap ai-office commute-timer prediction-vote log-monitor b2b-crawler turn-board prediction-homepage teamo phc doss moyang rest-forest planz tripcut employment digital-bridge ecampus skin-classifier'.split())

class Document(HTMLParser):
    def __init__(self, text):
        super().__init__(); self.urls=[]; self.ids=[]; self.h1=0
        self.feed(text)
    def handle_starttag(self, tag, attrs):
        a=dict(attrs)
        if tag == 'h1': self.h1 += 1
        if 'id' in a: self.ids.append(a['id'])
        if tag in ('a', 'link') and 'href' in a: self.urls.append(a['href'])
        if tag in ('img', 'script') and 'src' in a: self.urls.append(a['src'])

class ArchiveContentTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.items=json.loads((ROOT/'projects/data/projects.json').read_text())
    def test_every_known_project_is_present_once(self):
        slugs=[p['slug'] for p in self.items]
        self.assertEqual(set(slugs), EXPECTED)
        self.assertEqual(len(slugs), len(set(slugs)))
    def test_company_ownership_and_scope(self):
        by_slug={p['slug']:p for p in self.items}
        self.assertEqual(by_slug['forge-studio']['category'], 'company')
        self.assertEqual(by_slug['ecampus']['category'], 'personal')
        self.assertNotIn('Elasticsearch', json.dumps(by_slug['doss'], ensure_ascii=False))
        self.assertIn('합성', json.dumps(by_slug['onchain-credit'], ensure_ascii=False))
        self.assertIn('451', json.dumps(by_slug['marblewalk'], ensure_ascii=False))
    def test_each_project_has_real_content_and_public_page(self):
        for p in self.items:
            with self.subTest(project=p['slug']):
                for key in ('title','summary','period','role','overview','decisions','stack','flow'):
                    self.assertTrue(p[key], key)
                self.assertIn(p['category'], ('company','personal','team'))
                self.assertTrue((ROOT/'projects'/p['slug']/'index.html').exists())
                for img in p.get('images', []):
                    self.assertTrue((ROOT/img['src'].lstrip('/')).is_file(), img['src'])
    def test_static_pages_and_internal_links(self):
        pages=list((ROOT/'projects').glob('**/index.html'))
        self.assertEqual(len(pages),len(EXPECTED)+1)
        for page in pages:
            text=page.read_text(); doc=Document(text)
            with self.subTest(page=str(page)):
                self.assertEqual(doc.h1,1)
                self.assertEqual(len(doc.ids),len(set(doc.ids)))
                self.assertNotIn('AI 부팀장', text)
                for url in doc.urls:
                    parsed=urlsplit(url)
                    if parsed.scheme or parsed.netloc: continue
                    target=(ROOT/parsed.path.lstrip('/')) if parsed.path.startswith('/') else page.parent/parsed.path
                    if not parsed.path: target=page
                    if target.is_dir(): target=target/'index.html'
                    self.assertTrue(target.exists(), f'{page.name}: {url}')
                    if parsed.fragment and target.suffix=='.html':
                        self.assertIn(parsed.fragment,Document(target.read_text()).ids,url)
    def test_index_works_without_javascript(self):
        text=(ROOT/'projects/index.html').read_text()
        for slug in EXPECTED: self.assertIn(f'href="/projects/{slug}/"',text)
        self.assertNotIn('loading="eager"', text)

if __name__=='__main__': unittest.main()
