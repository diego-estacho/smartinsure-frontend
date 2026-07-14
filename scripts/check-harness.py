#!/usr/bin/env python3
"""Lint mecânico do harness do smartinsure-frontend (harness fino).

Checagens:
1. Links markdown relativos quebrados dentro do repo.
2. Ponteiros de workspace (links que saem do repo, ex.: ../smartinsure-backend/...):
   validados quando o repo irmão existe no layout lado a lado (ADR-001 do produto);
   quando o irmão está ausente (caso do CI, que clona só este repo) viram aviso.
3. Referências a arquivos .md em prosa (fora de código/links) resolvem — local ou,
   quando presente, no repo irmão; ausente o irmão, viram aviso.
4. AGENTS.md com no máximo 100 linhas (harness fino).
5. Cada ADR de UI em docs/adr/ tem título '# ADR-NNN' e seção '## Status'.
6. Exec-plan ativo tem seção 'Evidências'; exec-plan concluído a tem preenchida.
7. Nenhuma pasta de framework de desenvolvimento está versionada (ADR-004 do produto).

IDs de produto (glossário/RN/OPEN e ADRs do produto) são validados no backend, que
os define. Aqui só se validam os ADRs de UI locais (docs/adr/).

Sai com código 1 e a lista de erros quando o harness está quebrado.
"""
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
IRMAO = ROOT.parent / "smartinsure-backend"
IGNORAR = (".git", ".claude", "node_modules")
MD_FUTUROS = {"db-schema.md", "rastreabilidade-rn.md"}
PASTAS_FRAMEWORK = {".specify", "specs", "memory", ".gsd", "gsd", ".superpowers"}

LINK_RE = re.compile(r"\[[^\]]*\]\(([^)\s#]+)(?:#[^)]*)?\)")
FENCE_RE = re.compile(r"```.*?```", re.S)
INLINE_RE = re.compile(r"`[^`]*`")
MD_NAME_RE = re.compile(r"\b[\w][\w.\-]*\.md\b")

errors, warnings = [], []


def sem_codigo(texto):
    texto = FENCE_RE.sub(" ", texto)
    texto = INLINE_RE.sub(" ", texto)
    return LINK_RE.sub(" ", texto)


md_files = [f for f in ROOT.rglob("*.md")
            if not any(p in f.parts for p in IGNORAR)]

irmao_presente = IRMAO.exists()
basenames = {f.name for f in md_files} | MD_FUTUROS
if irmao_presente:
    basenames |= {f.name for f in IRMAO.rglob("*.md")
                  if not any(p in f.parts for p in IGNORAR)}

for f in md_files:
    texto = f.read_text(encoding="utf-8")

    # 1 e 2. links markdown / ponteiros de workspace
    for m in LINK_RE.finditer(texto):
        alvo = m.group(1)
        if alvo.startswith(("http://", "https://", "mailto:")):
            continue
        destino = (f.parent / alvo).resolve()
        try:
            destino.relative_to(ROOT)
            dentro_do_repo = True
        except ValueError:
            dentro_do_repo = False

        if dentro_do_repo:
            if not destino.exists():
                errors.append(f"{f.relative_to(ROOT)}: link quebrado -> {alvo}")
        elif irmao_presente:
            if not destino.exists():
                errors.append(f"{f.relative_to(ROOT)}: ponteiro de workspace quebrado -> {alvo}")
        else:
            warnings.append(f"{f.relative_to(ROOT)}: ponteiro de workspace não verificado (../smartinsure-backend ausente) -> {alvo}")

    if f.name.startswith("_"):
        continue

    # 3. .md citado em prosa
    for nome in MD_NAME_RE.findall(sem_codigo(texto)):
        if nome in basenames:
            continue
        if irmao_presente:
            errors.append(f"{f.relative_to(ROOT)}: referência a .md inexistente em prosa -> {nome}")
        else:
            warnings.append(f"{f.relative_to(ROOT)}: .md citado em prosa não verificado (irmão ausente) -> {nome}")

# 4. AGENTS.md fino
agents = ROOT / "AGENTS.md"
if not agents.exists():
    errors.append("AGENTS.md não existe")
elif len(agents.read_text(encoding="utf-8").splitlines()) > 100:
    n = len(agents.read_text(encoding="utf-8").splitlines())
    errors.append(f"AGENTS.md tem {n} linhas (máximo 100 — harness fino, ADR-001 do produto)")

# 5. formato dos ADRs de UI locais (docs/adr/)
adr_dir = ROOT / "docs" / "adr"
adr_files = sorted(adr_dir.glob("[0-9][0-9][0-9]-*.md")) if adr_dir.exists() else []
for f in adr_files:
    t = f.read_text(encoding="utf-8")
    num = f.name[:3]
    if not re.search(rf"^#\s+ADR-{num}\b", t, re.M):
        errors.append(f"{f.relative_to(ROOT)}: título deve começar com '# ADR-{num}:'")
    if not re.search(r"^##\s+Status", t, re.M):
        errors.append(f"{f.relative_to(ROOT)}: ADR sem a seção '## Status'")

# 6. exec-plans (quando existirem): plano ativo tem 'Evidências'; concluído a tem preenchida
for f in (ROOT / "docs" / "exec-plans" / "active").glob("*.md"):
    if not re.search(r"^#+\s*Evid[êe]ncias", f.read_text(encoding="utf-8"), re.M):
        errors.append(f"{f.relative_to(ROOT)}: exec-plan ativo sem seção 'Evidências'")
for f in (ROOT / "docs" / "exec-plans" / "completed").glob("*.md"):
    m = re.search(r"^#+\s*Evid[êe]ncias\s*\n(.*)$", f.read_text(encoding="utf-8"), re.S | re.M)
    corpo = (m.group(1).strip() if m else "")
    if not corpo or corpo.startswith("("):
        errors.append(f"{f.relative_to(ROOT)}: exec-plan concluído com seção 'Evidências' vazia")

# 7. pastas de framework de desenvolvimento não podem ser versionadas (ADR-004 do produto)
try:
    tracked = subprocess.run(["git", "ls-files"], cwd=ROOT,
                             capture_output=True, text=True, check=True).stdout.splitlines()
    poluidas = sorted({p.split("/", 1)[0] for p in tracked
                       if p.split("/", 1)[0] in PASTAS_FRAMEWORK})
    for d in poluidas:
        errors.append(f"pasta de framework '{d}/' está versionada — é scratch de "
                      f"ferramenta, não produto (ADR-004): remova do versionamento.")
except (OSError, subprocess.CalledProcessError):
    warnings.append("git indisponível — checagem de pasta de framework (ADR-004) pulada")

for w in warnings:
    print(f"aviso: {w}")
if errors:
    print("HARNESS QUEBRADO:")
    for e in errors:
        print(f"  - {e}")
    sys.exit(1)
print("harness ok")
