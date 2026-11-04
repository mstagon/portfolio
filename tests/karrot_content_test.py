"""Public portfolio scope, navigation and target-job regression checks."""
import re
import unittest
from pathlib import Path
from urllib.parse import urlsplit
from projects_content_test import Document, ROOT

class KarrotPortfolioTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.html=(ROOT/'karrot/index.html').read_text()
        cls.doc=Document(cls.html)

    def test_current_campaign_and_archive_entries(self):
        self.assertIn('산업기능요원 집중 채용', self.html)
        self.assertIn('https://careers.daangn.com/jobs/role/8043875003/', self.doc.urls)
        self.assertGreaterEqual(self.doc.urls.count('/projects/'),3)
        self.assertNotIn('Cross Product Growth',self.html)
        self.assertNotIn('AI 부팀장',self.html)

    def test_platform_and_team_tool_are_primary_cases(self):
        cases=re.findall(r'<section class="case" id="([^"]+)"', self.html)
        self.assertEqual(cases[0],'shell')
        for section in ('admin','ads','exp','way','proj'):self.assertIn(section,cases)
        self.assertIn('Forge Studio',self.html)
        self.assertIn('JSON 프리셋',self.html)
        self.assertIn('보충역 산업기능요원',self.html)
        self.assertNotIn('38 →',self.html)
        self.assertNotIn('GraphQL',self.html)
        self.assertNotIn('SSV 원자',self.html)

    def test_all_internal_links_and_images_exist(self):
        self.assertEqual(self.doc.h1,1)
        self.assertEqual(len(self.doc.ids),len(set(self.doc.ids)))
        for url in self.doc.urls:
            parsed=urlsplit(url)
            if parsed.scheme or parsed.netloc:continue
            path=ROOT/parsed.path.lstrip('/') if parsed.path.startswith('/') else ROOT/'karrot'/parsed.path
            if not parsed.path:path=ROOT/'karrot/index.html'
            if path.is_dir():path=path/'index.html'
            with self.subTest(url=url):
                self.assertTrue(path.exists(),url)
                if parsed.fragment and path.suffix=='.html':
                    self.assertIn(parsed.fragment,Document(path.read_text()).ids,url)

    def test_evidence_scope_is_readable_without_scripts(self):
        self.assertIn('451건',self.html)
        self.assertIn('30일',self.html)
        self.assertIn('무작위',self.html)
        self.assertIn('2026년 10월',self.html)
        for path in ('minerva','oracle-x','forge-studio','marblewalk','rapi','tripcut','teamo','phc','moyang'):
            self.assertIn('/projects/'+path+'/',self.doc.urls)

if __name__=='__main__':unittest.main()
