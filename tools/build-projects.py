#!/usr/bin/env python3
"""Render the buildless archive from curated project data (standard library only)."""
import argparse
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATEGORIES = {'company': '회사', 'personal': '개인·사이드', 'team': '팀 프로젝트'}
VERSION = '20261104'


def escape(value):
    return html.escape(str(value), quote=True)


def prose(value):
    return re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', escape(value))


def head(title, description, path):
    return f'''<!doctype html>
<html lang="ko"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{escape(title)} · 최민석</title>
<meta name="description" content="{escape(description)}">
<meta name="theme-color" content="#090d16">
<link rel="canonical" href="https://devcms.me{path}">
<meta property="og:type" content="website"><meta property="og:locale" content="ko_KR">
<meta property="og:title" content="{escape(title)} · 최민석">
<meta property="og:description" content="{escape(description)}">
<meta property="og:url" content="https://devcms.me{path}">
<link rel="icon" href="/projects/assets/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/fonts/pretendard/pretendardvariable-dynamic-subset.css">
<link rel="stylesheet" href="/projects/assets/archive.css?v={VERSION}">
<script src="/projects/assets/archive.js?v={VERSION}" defer></script>
</head><body><a class="skip" href="#main">본문 바로가기</a>
<header class="site-header"><div class="container header-inner">
<a class="brand" href="/" aria-label="최민석 메인 포트폴리오"><span class="brand-mark" aria-hidden="true">cm<span>.</span></span><span>최민석<span class="brand-sub">SOFTWARE ENGINEER</span></span></a>
<nav class="header-nav" aria-label="주요 메뉴"><a href="/">소개</a><a href="/projects/" aria-current="{'page' if path == '/projects/' else 'location'}">전체 프로젝트 <span aria-hidden="true">↗</span></a><a class="contact-link" href="mailto:devcms21@gmail.com">연락하기</a></nav>
</div></header>'''


def footer():
    return '''<footer class="site-footer"><div class="container footer-inner"><div><a class="footer-name" href="/">최민석 <span>CHOI MINSEOK</span></a><p>아이디어를 구현하고, 쓰이는 과정까지 다룹니다.</p></div><nav aria-label="외부 링크"><a href="https://github.com/mstagon" target="_blank" rel="noopener noreferrer">GitHub ↗</a><a href="https://velog.io/@devcms21" target="_blank" rel="noopener noreferrer">Blog ↗</a><a href="mailto:devcms21@gmail.com">Email ↗</a></nav><span class="copyright">© 2026</span></div></footer></body></html>'''


def image_tag(image, css='', lazy=True):
    return f'<img src="{escape(image["src"])}" alt="{escape(image["alt"])}" width="{image["width"]}" height="{image["height"]}" class="{css}" loading="{"lazy" if lazy else "eager"}" decoding="async">'


def flow_markup(project, compact=False):
    steps=''.join(f'<li><span class="step-index">0{i+1}</span><span>{escape(step)}</span></li>' for i,step in enumerate(project['flow']))
    return f'<ol class="flow {"flow-compact" if compact else ""}" aria-label="구현 흐름">{steps}</ol>'


def card(project, index):
    p=project
    search=' '.join([p['title'],p['summary'],p['role'],p['keywords'],*p['stack']])
    images=p['images']
    if images:
        selected=images[:3] if p['slug'] in ('marblewalk','minerva') else images[:1]
        media=''.join(image_tag(im) for im in selected)
        visual=f'<div class="card-visual visual-{p["slug"]} {"phones" if len(selected)>1 else ""}">{media}</div>'
    else:
        visual=f'<div class="card-visual visual-diagram"><span class="diagram-label">{escape(p["eyebrow"])}</span>{flow_markup(p,True)}</div>'
    tags=''.join(f'<span>{escape(t)}</span>' for t in p['stack'][:3])
    return f'''<li class="project-item" data-category="{p['category']}" data-search="{escape(search)}">
<article class="project-card"><a class="card-link" href="/projects/{p['slug']}/" aria-labelledby="title-{p['slug']}">
<div class="card-top"><span class="category-dot cat-{p['category']}">{CATEGORIES[p['category']]}</span><span class="project-number">P.{index+1:02d}</span></div>
{visual}<div class="card-body"><p class="card-kind">{escape(p['kind'])} <span>·</span> {escape(p['period'])}</p><h2 id="title-{p['slug']}">{escape(p['title'])}<span class="card-arrow" aria-hidden="true">↗</span></h2><p class="card-summary">{escape(p['summary'])}</p><div class="card-stack">{tags}</div></div></a></article></li>'''


def index_page(items):
    counts={k:sum(p['category']==k for p in items) for k in CATEGORIES}
    controls='<button type="button" data-filter="all" aria-pressed="true">전체 <span>34</span></button>' + ''.join(f'<button type="button" data-filter="{k}" aria-pressed="false">{v} <span>{counts[k]}</span></button>' for k,v in CATEGORIES.items())
    result=head('전체 프로젝트','회사 서비스부터 개인 개발 도구, 대학 팀 프로젝트까지. 최민석이 만든 34개 프로젝트의 역할과 구현 기록.','/projects/')
    result+=f'''<main id="main"><section class="archive-hero container" aria-labelledby="archive-title">
<div class="hero-copy"><p class="eyebrow"><span class="tiny-cross" aria-hidden="true">+</span> THE PROJECT ARCHIVE <span>2021—2026</span></p><h1 id="archive-title">만든 것들의<br>모든 기록<span class="terminal-cursor" aria-hidden="true">_</span></h1><p class="hero-description">출시한 서비스, 직접 만든 개발 도구, 함께한 팀 프로젝트.<br class="desktop-break"> 무엇을 맡았고 어떻게 풀었는지, 한곳에 모았습니다.</p><a class="hero-jump" href="#collection">프로젝트 둘러보기 <span aria-hidden="true">↓</span></a></div>
<div class="hero-exhibit" aria-label="실제 프로젝트 화면 모음"><div class="exhibit-grid" aria-hidden="true"></div><span class="exhibit-label mono">SELECTED INTERFACES / 01—02</span>
<figure class="exhibit-window window-back"><figcaption><span aria-hidden="true">● ● ●</span> TEAMO / TEAM PROJECT</figcaption><img src="/img/prev-teamo.webp" alt="Teamo 프로젝트 화면" width="1200" height="608" decoding="async"></figure>
<figure class="exhibit-window window-front"><figcaption><span aria-hidden="true">● ● ●</span> FORGE STUDIO / COMPANY</figcaption><img src="/img/forge-dash.webp" alt="Forge Studio 대시보드" width="1443" height="832" decoding="async"></figure>
<div class="exhibit-foot"><span class="crosshair" aria-hidden="true">⌖</span><p>DESIGNED. BUILT.<br><b>KEPT WORKING.</b></p><span class="exhibit-count">{len(items)}<small>PROJECTS</small></span></div></div>
</section>
<section class="collection container" id="collection" aria-labelledby="collection-title">
<div class="collection-heading"><h2 id="collection-title">프로젝트 탐색 <span>PROJECT INDEX</span></h2><p>서비스의 시작부터 운영의 디테일까지.</p></div>
<div class="archive-controls" hidden><div class="filter-buttons" role="group" aria-label="프로젝트 분류">{controls}</div><div class="search-wrap"><label for="project-search" class="sr-only">프로젝트 또는 기술 검색</label><svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="10" cy="10" r="6.5"/><path d="m15 15 6 6"/></svg><input type="search" id="project-search" autocomplete="off" placeholder="프로젝트, 기술, 키워드 검색"><button type="button" class="clear-search" aria-label="검색어 지우기" hidden>×</button></div></div>
<div class="results-line"><p id="result-count" role="status" aria-live="polite">전체 프로젝트 <strong>{len(items)}</strong>개</p><span class="mono">BUILD / SHIP / OPERATE</span></div>
<ul class="project-grid">{''.join(card(p,i) for i,p in enumerate(items))}</ul>
<div class="empty-state" hidden><span aria-hidden="true">⌕</span><h3>일치하는 프로젝트가 없습니다.</h3><p>다른 키워드로 검색하거나 분류를 바꿔 보세요.</p><button type="button" class="reset-filters">전체 프로젝트 보기</button></div>
</section><aside class="archive-end container"><p>프로젝트 밖의 이야기도 궁금하다면.</p><a href="/">경력과 개발 경험 보기 <span aria-hidden="true">↗</span></a></aside></main>'''
    return result+footer()


def detail_page(p, items):
    result=head(p['title'],p['summary'],f'/projects/{p["slug"]}/')
    tags=''.join(f'<li>{escape(t)}</li>' for t in p['stack'])
    links=''.join(f'<a class="external-link" href="{escape(l["url"])}" target="_blank" rel="noopener noreferrer">{escape(l["label"])} <span aria-hidden="true">↗</span></a>' for l in p['links'])
    gallery_link='<a href="#screens">프로젝트 화면</a>' if p['images'] else ''
    company='더줌코리아 · ' if p['category']=='company' else ''
    result+=f'''<main id="main" class="detail-main container"><nav class="breadcrumb" aria-label="현재 위치"><a href="/projects/" data-archive-back>← 전체 프로젝트</a><span>/</span><span>{escape(p['title'])}</span></nav>
<header class="detail-hero"><p class="eyebrow"><span class="category-dot cat-{p['category']}">{company}{CATEGORIES[p['category']]}</span><span>{escape(p['eyebrow'])}</span></p><h1>{escape(p['title'])}</h1><p class="detail-summary">{escape(p['summary'])}</p>
<dl class="project-facts"><div><dt>PERIOD</dt><dd>{escape(p['period'])}</dd></div><div><dt>MY ROLE</dt><dd>{escape(p['role'])}</dd></div><div><dt>PROJECT TYPE</dt><dd>{escape(p['kind'])}</dd></div></dl>
<ul class="tech-list" aria-label="사용 기술">{tags}</ul>{f'<div class="external-links">{links}</div>' if links else ''}</header>
<div class="detail-layout"><nav class="detail-toc" aria-label="프로젝트 목차"><span class="mono">IN THIS PROJECT</span><a href="#overview">프로젝트 소개</a><a href="#decisions">구현과 판단</a>{gallery_link}<a href="#outcome">결과와 범위</a></nav><div class="detail-content">
<section class="overview-section" id="overview"><p class="section-label">01 / OVERVIEW</p><h2>어떤 프로젝트인가요?</h2><p>{prose(p['overview'])}</p>{flow_markup(p)}</section>
<section class="decisions-section" id="decisions"><p class="section-label">02 / ENGINEERING</p><h2>구현과 판단</h2><div class="decisions-list">'''
    for i,d in enumerate(p['decisions']):
        result+=f'<article class="decision"><span class="decision-index">{i+1:02d}</span><div><h3>{escape(d["title"])}</h3><p>{prose(d["body"])}</p></div></article>'
    result+='</div></section>'
    if p['images']:
        figures=''
        for im in p['images']:
            portrait=im['height'] > im['width']*1.3
            figures+=f'<figure class="screen-figure {"portrait" if portrait else "landscape"}"><a href="{escape(im["src"])}" class="screen-link" aria-label="{escape(im["alt"])} 크게 보기">{image_tag(im)}<span class="screen-zoom" aria-hidden="true">↗ 크게 보기</span></a><figcaption>{escape(im["alt"])}</figcaption></figure>'
        result+=f'<section id="screens" class="screens-section"><p class="section-label">03 / INTERFACE</p><h2>프로젝트 화면</h2><p class="section-intro">이미지를 누르면 크게 볼 수 있습니다.</p><div class="screen-grid">{figures}</div></section>'
    result+=f'<section class="outcome-section" id="outcome"><p class="section-label">{"04" if p["images"] else "03"} / OUTCOME</p><h2>결과와 범위</h2><p>{prose(p["outcome"])}</p></section></div></div>'
    others=[q for q in items if q['category']==p['category'] and q['slug']!=p['slug']][:3]
    related=''.join(f'<a href="/projects/{q["slug"]}/"><span>{escape(q["kind"])}</span><h3>{escape(q["title"])}</h3><p>{escape(q["summary"])}</p><b aria-hidden="true">↗</b></a>' for q in others)
    result+=f'<section class="related"><p class="section-label">CONTINUE EXPLORING</p><div class="related-heading"><h2>다른 {CATEGORIES[p["category"]]} 프로젝트</h2><a href="/projects/?category={p["category"]}" data-category-link>목록 보기 ↗</a></div><div class="related-grid">{related}</div></section><a class="back-bottom" href="/projects/" data-archive-back>← 전체 프로젝트로 돌아가기</a></main>'
    if p['images']:
        result+='''<dialog class="lightbox" aria-labelledby="lightbox-caption"><div class="lightbox-toolbar"><p id="lightbox-caption"></p><button type="button" class="lightbox-close" aria-label="이미지 닫기">닫기 ×</button></div><div class="lightbox-image-wrap"></div></dialog>'''
    return result+footer()


def build(check=False):
    items=json.loads((ROOT/'projects/data/projects.json').read_text())
    outputs={ROOT/'projects/index.html': index_page(items)}
    outputs.update({ROOT/'projects'/p['slug']/'index.html': detail_page(p,items) for p in items})
    stale=[]
    for path,content in outputs.items():
        if check:
            if not path.exists() or path.read_text()!=content: stale.append(str(path.relative_to(ROOT)))
        else:
            path.parent.mkdir(parents=True,exist_ok=True); path.write_text(content)
    if stale: raise SystemExit('Stale generated output: '+', '.join(stale))
    print(f'{"Checked" if check else "Built"} {len(outputs)} pages')

if __name__=='__main__':
    parser=argparse.ArgumentParser(); parser.add_argument('--check',action='store_true')
    build(parser.parse_args().check)
