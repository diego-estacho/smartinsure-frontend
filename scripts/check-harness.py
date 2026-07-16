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
8. CSS global de componente escopado sob `.si-*` (ADR-015).
9. Código de produto (app/ ou server/) alterado tem exec-plan ativo OU dispensa em commit (ADR-016).
10. Identificador de código é inglês; só rota/UI em pt-BR (ADR-058; rede conservadora).

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
IGNORAR = (".git", ".claude", "node_modules",
           # artefato de framework (ADR-004): scratch/kit é invisível ao harness —
           # nem escaneado como doc, nem versionado (espelha PASTAS_FRAMEWORK).
           ".specify", "specs", "memory", ".grill", ".superpowers", ".agents")
MD_FUTUROS = {"db-schema.md", "rastreabilidade-rn.md"}
PASTAS_FRAMEWORK = {".specify", "specs", "memory", ".grill", ".superpowers", ".agents"}

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

# 8. CSS global de componente é escopado sob `.si-*` (ADR-015 — namespacing p/
#    microfrontend). Toda folha autoral em app/assets/styles (exceto tokens/, que
#    define :root/base) só pode ter seletores que contenham uma classe `.si-*`;
#    classes do Vuetify (`.v-*`) entram só como co-classe/descendente, nunca sozinhas.
CSS_COMMENT_RE = re.compile(r"/\*.*?\*/", re.S)
CSS_SELECTOR_RE = re.compile(r"([^{}]+)\{")
styles_dir = ROOT / "app" / "assets" / "styles"
if styles_dir.exists():
    for f in sorted(styles_dir.rglob("*.css")):
        if "tokens" in f.relative_to(styles_dir).parts:
            continue
        conteudo = CSS_COMMENT_RE.sub(" ", f.read_text(encoding="utf-8"))
        for prelude in CSS_SELECTOR_RE.findall(conteudo):
            prelude = prelude.strip()
            if not prelude or prelude.startswith("@"):
                continue
            for sel in prelude.split(","):
                sel = sel.strip()
                if sel and ".si-" not in sel:
                    errors.append(f"{f.relative_to(ROOT)}: seletor CSS fora do namespace "
                                  f"`.si-*` (ADR-015) -> {sel}")

# 9. Gate de exec-plan (ADR-016): código de produto (app/ ou server/) alterado exige uma
#    decisão de triagem registrada — OU um exec-plan ativo, OU uma dispensa declarada em
#    commit (trailer 'Exec-plan:'). Não força documentação para o trivial; força a DECISÃO
#    a existir e ficar auditável. Agnóstico de ferramenta (ADR-003). Base indeterminada
#    (sem git / sem branch principal) vira aviso — não trava dev local nem CI de repo só.
PRODUTO_DIRS = ("app/", "server/")
EXEC_TRAILER_RE = re.compile(r"^Exec-plan:\s*\S", re.M | re.I)
try:
    base = None
    for ref in ("origin/main", "origin/master", "main", "master"):
        r = subprocess.run(["git", "merge-base", "HEAD", ref], cwd=ROOT,
                           capture_output=True, text=True)
        if r.returncode == 0 and r.stdout.strip():
            base = r.stdout.strip()
            break
    if base is None:
        warnings.append("gate de exec-plan (ADR-016) não verificado — branch base indeterminada")
    else:
        changed = subprocess.run(["git", "diff", "--name-only", base, "HEAD"], cwd=ROOT,
                                 capture_output=True, text=True, check=True).stdout.splitlines()
        if any(c.startswith(PRODUTO_DIRS) for c in changed):
            plano_ativo = any((ROOT / "docs" / "exec-plans" / "active").glob("*.md"))
            msgs = subprocess.run(["git", "log", "--format=%B", f"{base}..HEAD"], cwd=ROOT,
                                 capture_output=True, text=True, check=True).stdout
            if not plano_ativo and not EXEC_TRAILER_RE.search(msgs):
                errors.append("código de produto (app//server/) alterado sem exec-plan ativo "
                              "nem declaração 'Exec-plan:' em commit — abra o plano em "
                              "docs/exec-plans/active/ ou dispense com motivo no commit "
                              "('Exec-plan: dispensado — <motivo>'). Ver AGENTS.md Passo 0 / ADR-016.")
except (OSError, subprocess.CalledProcessError):
    warnings.append("git indisponível — gate de exec-plan (ADR-016) pulado")

# 10. Idioma do código (ADR-058 do produto / AGENTS §Idioma): identificador de código é
#     inglês; só rota de página e texto de UI ficam em pt-BR. Rede conservadora — checa os
#     nomes DECLARADOS (const/let/var/function) no <script> de .vue e em .ts contra uma lista
#     de palavras pt-BR inequívocas, quebrando o identificador em segmentos camelCase. Não
#     parseia idioma (não é exaustiva); complementa o review. Termo de domínio no código deve
#     usar o técnico inglês do glossário — por isso cotacao/apolice/oferta também entram aqui.
PT_WORDS = {
    "senha", "senhas", "visivel", "invisivel", "enviar", "enviando", "enviado", "entrar",
    "sair", "erro", "erros", "sucesso", "falha", "aberto", "aberta", "fechado", "fechada",
    "carregando", "salvar", "salvando", "salvo", "excluir", "buscar", "busca", "lista",
    "listar", "novo", "nova", "editar", "criar", "criando", "nome", "nomes", "usuario",
    "usuarios", "senha", "cotacao", "cotacoes", "apolice", "apolices", "oferta", "ofertas",
    "proposta", "propostas", "tomador", "corretora", "seguradora", "situacao", "vigencia",
}
DECL_RE = re.compile(r"\b(?:const|let|var|function)\s+([A-Za-z_$][\w$]*)")
SCRIPT_RE = re.compile(r"<script\b[^>]*>(.*?)</script>", re.S | re.I)
CAMEL_RE = re.compile(r"[A-Z]?[a-z]+|[A-Z]+(?![a-z])")
for raiz in (ROOT / "app", ROOT / "server"):
    if not raiz.exists():
        continue
    for f in sorted(list(raiz.rglob("*.vue")) + list(raiz.rglob("*.ts"))):
        if "gen" in f.parts:
            continue
        conteudo = f.read_text(encoding="utf-8")
        if f.suffix == ".vue":
            conteudo = " ".join(SCRIPT_RE.findall(conteudo))
        for ident in DECL_RE.findall(conteudo):
            segs = {s.lower() for s in CAMEL_RE.findall(ident)}
            achados = segs & PT_WORDS
            if achados:
                errors.append(f"{f.relative_to(ROOT)}: identificador de código em pt-BR -> "
                              f"'{ident}' (código é inglês; só rota/UI em pt-BR — ADR-058, "
                              f"AGENTS §Idioma). Termo(s): {', '.join(sorted(achados))}")

for w in warnings:
    print(f"aviso: {w}")
if errors:
    print("HARNESS QUEBRADO:")
    for e in errors:
        print(f"  - {e}")
    sys.exit(1)
print("harness ok")
