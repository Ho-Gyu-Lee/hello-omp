#!/usr/bin/env sh
# omp portable setup — macOS / Linux
# Deploy order: 1) role-based models  2) global rules (AGENTS.md)  3) OKF bundle  4) extensions  5) agents
# Idempotent: safe to re-run. Honors PI_CODING_AGENT_DIR via `omp config path`.
set -eu

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
normalize_path_for_compare() {
  p=$(printf '%s' "$1" | sed 's|\\|/|g')
  case "$p" in
    [A-Za-z]:/*)
      drive=$(printf '%s' "${p%%:*}" | tr 'A-Z' 'a-z')
      p="/${drive}${p#?:}"
      ;;
  esac
  p=${p%/}
  printf '%s' "$p"
}
SCRIPT_DIR_CMP=$(normalize_path_for_compare "${SCRIPT_DIR}")
if [ -n "${PI_CODING_AGENT_DIR:-}" ]; then
  ENV_CONFIG_DIR_CMP=$(normalize_path_for_compare "${PI_CODING_AGENT_DIR}")
  if [ "${ENV_CONFIG_DIR_CMP}" = "${SCRIPT_DIR_CMP}" ]; then
    echo "ERROR: refusing to use setup repo root as omp config dir; set PI_CODING_AGENT_DIR to a separate directory" >&2
    exit 1
  fi
fi

# --- preflight ---
if ! command -v omp >/dev/null 2>&1; then
  echo "ERROR: omp not found on PATH. Install: curl -fsSL https://omp.sh/install | sh" >&2
  exit 1
fi

CONFIG_DIR="$(omp config path)"
if [ -z "${CONFIG_DIR}" ]; then
  echo "ERROR: could not resolve omp config dir (omp config path returned empty)" >&2
  exit 1
fi
CONFIG_DIR_CMP=$(normalize_path_for_compare "${CONFIG_DIR}")
SCRIPT_DIR_CMP=$(normalize_path_for_compare "${SCRIPT_DIR}")
if [ "${CONFIG_DIR_CMP}" = "${SCRIPT_DIR_CMP}" ]; then
  echo "ERROR: refusing to use setup repo root as omp config dir; set PI_CODING_AGENT_DIR to a separate directory" >&2
  exit 1
fi
mkdir -p "${CONFIG_DIR}"
echo "omp config dir: ${CONFIG_DIR}"
# absolute OKF path (slash-normalized) injected into AGENTS.md/agents so agents read it from any cwd
OKF_ABS=$(printf '%s' "${CONFIG_DIR}/okf" | sed 's|\\|/|g')
OKF_SOURCE_ABS=$(printf '%s' "${SCRIPT_DIR}/okf" | sed 's|\\|/|g')

# --- 1) role-based models ---
echo "[1/5] applying model settings..."
SETTINGS="${SCRIPT_DIR}/config/settings.conf"
while IFS= read -r line || [ -n "${line}" ]; do
  case "${line}" in
    ''|\#*) continue ;;
  esac
  key=${line%% *}
  value=${line#* }
  omp config set "${key}" "${value}" >/dev/null
  echo "  set ${key}"
done < "${SETTINGS}"

# --- 2) global rules ---
echo "[2/5] deploying global rules (AGENTS.md)..."
if [ -f "${CONFIG_DIR}/AGENTS.md" ] && [ ! -f "${CONFIG_DIR}/AGENTS.md.bak" ]; then
  cp "${CONFIG_DIR}/AGENTS.md" "${CONFIG_DIR}/AGENTS.md.bak"
fi
cp "${SCRIPT_DIR}/rules/AGENTS.md" "${CONFIG_DIR}/AGENTS.md"
sed -e "s|__OKF_DIR__|${OKF_ABS}|g" -e "s|__OKF_SOURCE_DIR__|${OKF_SOURCE_ABS}|g" "${CONFIG_DIR}/AGENTS.md" > "${CONFIG_DIR}/AGENTS.md.tmp" && mv "${CONFIG_DIR}/AGENTS.md.tmp" "${CONFIG_DIR}/AGENTS.md"

# --- 3) OKF bundle (clean redeploy of the managed bundle) ---
echo "[3/5] deploying OKF bundle..."
rm -rf "${CONFIG_DIR}/okf"
mkdir -p "${CONFIG_DIR}/okf"
cp -R "${SCRIPT_DIR}/okf/." "${CONFIG_DIR}/okf/"
# conformance: every non-reserved .md must start with YAML frontmatter
bad=0
okf_list="${CONFIG_DIR}/.okf-md-files.$$"
find_bin=find
if [ -x /usr/bin/find ]; then find_bin=/usr/bin/find; fi
if ! "${find_bin}" "${CONFIG_DIR}/okf" -name '*.md' -print > "${okf_list}"; then
  rm -f "${okf_list}"
  exit 1
fi
while IFS= read -r c; do
  case "$(basename "$c")" in index.md|log.md) continue ;; esac
  if [ "$(head -n 1 "$c")" != "---" ]; then echo "  WARN: OKF concept missing frontmatter: $c"; bad=$((bad+1)); fi
done < "${okf_list}"
rm -f "${okf_list}"
if [ "$bad" -eq 0 ]; then echo "  OKF conformance OK"; fi

# --- 4) extensions (auto-discovered from user agent dir) ---
echo "[4/5] deploying extensions (if any)..."
n=0
for ext in "${SCRIPT_DIR}/extensions/"*.js "${SCRIPT_DIR}/extensions/"*.ts; do
  [ -f "$ext" ] || continue
  if [ "$n" -eq 0 ]; then mkdir -p "${CONFIG_DIR}/extensions"; fi
  base=$(basename "$ext")
  cp "$ext" "${CONFIG_DIR}/extensions/${base}"
  n=$((n+1))
done
if [ "$n" -gt 0 ]; then
  echo "  deployed ${n} extension(s)"
else
  echo "  none"
fi


# --- 5) agent overrides/custom agents (optional; built-in agents are default) ---
echo "[5/5] deploying agent overrides/custom agents (if any)..."
for managed in reviewer.md plan.md; do
  managed_role=${managed%.md}
  managed_marker="# source: omp v16.3.8 bundled ${managed_role}; only thinkingLevel changed high -> xhigh."
  if [ ! -f "${SCRIPT_DIR}/agents/${managed}" ] \
    && [ -f "${CONFIG_DIR}/agents/${managed}" ] \
    && grep -Fqx "${managed_marker}" "${CONFIG_DIR}/agents/${managed}"; then
    rm -f "${CONFIG_DIR}/agents/${managed}"
  fi
done
if ls "${SCRIPT_DIR}/agents/"*.md >/dev/null 2>&1; then
  mkdir -p "${CONFIG_DIR}/agents"
  n=0
  for a in "${SCRIPT_DIR}/agents/"*.md; do
    base=$(basename "$a")
    sed -e "s|__OKF_DIR__|${OKF_ABS}|g" -e "s|__OKF_SOURCE_DIR__|${OKF_SOURCE_ABS}|g" "$a" > "${CONFIG_DIR}/agents/${base}"
    n=$((n+1))
  done
  echo "  deployed ${n} agent file(s)"
else
  echo "  none — using omp built-in agents (models via roles)"
fi

echo ""
echo "done. verifying modelRoles:"
omp config get modelRoles
