import json, re, urllib.request, html
sites = [
("Metalab","https://metalab.com"),
("Work & Co","https://www.work.co"),
("Instrument","https://www.instrument.com"),
("R/GA","https://www.rga.com"),
("AKQA","https://www.akqa.com"),
("Active Theory","https://activetheory.net"),
("Locomotive","https://locomotive.ca"),
("Basement Studio","https://basement.studio"),
("Unseen Studio","https://unseen.studio"),
("Resn","https://www.resn.co.nz"),
("Hello Monday","https://hellomonday.com"),
("UNIT9","https://www.unit9.com"),
("Adoratorio","https://adoratorio.studio"),
("Merci-Michel","https://www.merci-michel.com"),
("14islands","https://14islands.com"),
("Significa","https://significa.co"),
("Build in Amsterdam","https://www.buildinamsterdam.com"),
("Focus Lab","https://www.focuslab.com"),
("Fantasy","https://www.fantasy.co"),
("Ramotion","https://www.ramotion.com"),
("Ueno","https://www.ueno.co"),
("Collins","https://www.wearecollins.com"),
("OMSE","https://www.omse.co"),
("Studio Freight","https://studiofreight.com"),
("Huge","https://www.hugeinc.com"),
]
ua={'User-Agent':'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36'}
def meta(htmlsrc, names):
    for n in names:
        m=re.search(r'<meta[^>]+(?:property|name)=["\']%s["\'][^>]*content=["\']([^"\']+)'%re.escape(n),htmlsrc,re.I)
        if not m:
            m=re.search(r'<meta[^>]+content=["\']([^"\']+)["\'][^>]*(?:property|name)=["\']%s["\']'%re.escape(n),htmlsrc,re.I)
        if m: return html.unescape(m.group(1))
    return None
out=[]
for name,url in sites:
    d={"name":name,"url":url}
    try:
        req=urllib.request.Request(url,headers=ua)
        src=urllib.request.urlopen(req,timeout=20).read().decode('utf-8','ignore')
        d["title"]=(meta(src,["og:title"]) or re.search(r'<title[^>]*>(.*?)</title>',src,re.S|re.I).group(1)).strip()
        d["desc"]=meta(src,["og:description","description"]) or ""
        d["image"]=meta(src,["og:image","twitter:image"])
        d["ok"]=True
    except Exception as e:
        d["ok"]=False; d["err"]=str(e)[:120]
    out.append(d)
    print(name, d.get("ok"), (d.get("image") or "")[:90])
json.dump(out,open('meta.json','w'),indent=1)
