# Drafts of the replies to an app's unanswered reviews -> data/replies/<app>.json, from the custom replies of
# data/replies/custom_<app>.py and the thank-you templates here:  python3 -I reviews/draft.py <app> [--show] [--held]
# Read the drafts, then reviews/reply.mjs posts them.
# custom_<app>.py: C = {key: reply} for the reviews with feedback, HOLD = [keys] / HOLD_RE for those waiting on an answer,
# LANG = {key: lang}. A key is a Play id prefix or 'a:<date>' for an App Store review (their ids share prefixes).
import json, re, sys, importlib.util, os
D = os.path.dirname(os.path.abspath(__file__)) + '/data/'; HERE = D + 'replies'  # the drafts and custom_<app>.py are kept with the data
app = sys.argv[1]
spec = importlib.util.spec_from_file_location('custom', f'{HERE}/custom_{app.replace("-", "_")}.py'); cfg = importlib.util.module_from_spec(spec); spec.loader.exec_module(cfg)
GROUPS = getattr(cfg, 'GROUPS', [])  # [(regex, {lang: reply})]: one reply for all the reviews about a topic
C, HOLD, HOLD_RE, LANG = cfg.C, getattr(cfg, 'HOLD', []), getattr(cfg, 'HOLD_RE', None), getattr(cfg, 'LANG', {})
OLD = getattr(cfg, 'OLD', '2021')  # before this year only the reviews with feedback and the longer ones get a reply

T = {
 'en': ["Sādhu! Thank you for the kind review. May the Triple Gem bless you.",
        "Thank you very much for your review. Theruwan saranai!",
        "Thank you for your kind words. May you be well and happy!"],
 'si': ["තෙරුවන් සරණයි! ඔබට බොහොම පින්.", "ඔබගේ අදහස් දැක්වීමට බොහොම පින්. තෙරුවන් සරණයි!", "බොහොම පින්! ඔබටත් තෙරුවන් සරණයි."],
}
SINGLISH = re.compile(r'\b(pin|pin[gk]\w*|theruwan\w*|teruwan|saranai|saranayi|budu\w*|wewa|weva|godak|godk|sadu|saadu|hodai|hodha|hoda|watina|ithama\w*|oba\w*|siyalu|puluwan)\b', re.I)
ENGLISH = re.compile(r'\b(the|this|that|is|it|for|and|to|very|app|thanks?|you|of|all|who|with|great|nice|much)\b', re.I)
def key_of(r): return 'a:' + r['created'][:10] if r['store'] == 'appstore' else r['id']
def match(keys, r): k = key_of(r); return next((p for p in keys if k.startswith(p)), None)
def lang(r):
    if match(LANG, r): return LANG[match(LANG, r)]
    t = r['title'] + ' ' + r['text']
    if re.search('[඀-෿]', t): return 'si'
    if SINGLISH.search(t) and len(ENGLISH.findall(t)) < 3: return 'si'  # singlish, not English with a 'theruwan saranai'
    if not re.search('[A-Za-z]', t) and r['language'] == 'si': return 'si'  # emoji only
    return 'en'

rs = [json.loads(l) for l in open(f'{D}{app}.jsonl') if l.strip()]
rs = sorted((r for r in rs if r['text'] and not r['reply']), key=lambda r: r['created'])
out, held, skipped, n, used = [], [], 0, {'en': 0, 'si': 0}, set()
for r in rs:
    text = (r['title'] + ' ' + r['text']).strip()
    k = match(C, r)
    if k: used.add(k); reply = C[k]
    elif group := next((g for rx, g in GROUPS if rx.search(text)), None): reply = group[lang(r)]; k = 'group'
    elif match(HOLD, r) or (HOLD_RE and HOLD_RE.search(text)): held.append(r); continue
    elif r['created'] < OLD and len(text) < 60: skipped += 1; continue
    else: l = lang(r); reply = T[l][n[l] % len(T[l])]; n[l] += 1
    assert len(reply) <= 350, (r['id'], len(reply))
    out.append({'id': r['id'], 'store': r['store'], 'appId': r['appId'], 'date': r['created'][:10], 'rating': r['rating'], 'version': r['version'],
                'review': text, 'custom': bool(k), 'reply': reply})
if not out: sys.exit(f'{app}: nothing to draft ({len(held)} held, {skipped} old short ones skipped)')  # keeps the last drafts file
json.dump(out, open(f'{HERE}/{app}.json', 'w'), ensure_ascii=False, indent=1)
print(f"{app}: {len(out)} drafts ({sum(o['custom'] for o in out)} custom), {len(held)} held, {skipped} old short ones skipped; longest {max(len(o['reply']) for o in out)}")
if '--show' in sys.argv:
    for o in out:
        if not o['custom']: print(f"  {o['rating']}* {o['review'][:60]!r} -> {o['reply']}")
if '--held' in sys.argv:
    for r in held: print(f"  HELD {key_of(r)[:10]} {r['rating']}* {r['created'][:10]} | {(r['title'] + ' ' + r['text']).strip()[:110]}")
