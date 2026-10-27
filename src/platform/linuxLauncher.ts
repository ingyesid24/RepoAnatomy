/**
 * Launcher estable para Linux AppImage.
 *
 * El problema que resuelve: el acceso .desktop no debe apuntar a un AppImage
 * con nombre versionado (RepoAnatomy-2.0.0.AppImage), porque al actualizar el
 * archivo cambia de nombre y el acceso queda roto. En su lugar se escribe un
 * script en ~/.local/bin/repoanatomy que busca el AppImage más reciente en el
 * directorio de instalación y lo ejecuta. El .desktop apunta siempre al
 * script, que nunca cambia de ruta.
 *
 * Durante la transición desde CodeAtlas se aceptan ambos nombres de artefacto
 * y se mantiene un comando de compatibilidad en ~/.local/bin/codeatlas.
 */

/**
 * Genera el script del launcher. `baseDir` es el directorio donde está
 * instalado el AppImage en curso (el que genera el script al arrancar).
 */
export function buildLauncherScript(baseDir: string): string {
  return `#!/usr/bin/env bash
# RepoAnatomy - launcher estable. Busca el AppImage mas reciente y lo ejecuta.
set -euo pipefail

BASE_DIR="${baseDir}"

# Directorios comunes de instalacion si el embebido no existe.
CANDIDATE_DIRS=("$BASE_DIR" "$HOME/Applications" "$HOME/AppImages" "$HOME/.local/bin" "$HOME/Downloads")

find_latest_appimage() {
  local latest=""
  local dir
  for dir in "\${CANDIDATE_DIRS[@]}"; do
    [ -d "$dir" ] || continue
    local f
    for f in "$dir"/RepoAnatomy-*.AppImage "$dir"/CodeAtlas-*.AppImage; do
      [ -f "$f" ] || continue
      [ -x "$f" ] || chmod +x "$f" 2>/dev/null || true
      if [ -z "$latest" ] || [ "$f" -nt "$latest" ]; then
        latest="$f"
      fi
    done
  done
  printf '%s' "$latest"
}

APPIMAGE_PATH="$(find_latest_appimage)"

if [ -z "$APPIMAGE_PATH" ]; then
  message="RepoAnatomy: no se encontro ningun RepoAnatomy-*.AppImage instalado.
Descarga la ultima version en https://github.com/ingyesid24/RepoAnatomy/releases/latest"
  if command -v notify-send >/dev/null 2>&1; then
    notify-send --urgency=critical "RepoAnatomy no encontrado" "$message" 2>/dev/null || true
  fi
  echo "$message" >&2
  exit 1
fi

exec "$APPIMAGE_PATH" --no-sandbox "$@"
`;
}

/**
 * Script de compatibilidad para quien ya tenia el comando `codeatlas`.
 * No se usa en el .desktop; solo evita que el comando antiguo desaparezca.
 */
export function buildLegacyLauncherScript(): string {
  return `#!/usr/bin/env bash
# Compatibilidad: el comando anterior codeatlas ahora abre RepoAnatomy.
exec "$HOME/.local/bin/repoanatomy" "$@"
`;
}

/** Entrada .desktop que siempre apunta al launcher estable. */
export function buildDesktopEntry(launcherPath: string): string {
  return [
    '[Desktop Entry]',
    'Name=RepoAnatomy',
    'Comment=Understand any codebase in minutes.',
    `Exec=${launcherPath} %U`,
    'Terminal=false',
    'Type=Application',
    'Icon=repoanatomy',
    'StartupWMClass=RepoAnatomy',
    'Categories=Development;'
  ].join('\n') + '\n';
}

/** Ruta del launcher dentro de ~/.local/bin. */
export function launcherPath(homeDir: string): string {
  return `${homeDir}/.local/bin/repoanatomy`;
}

/** Ruta del comando de compatibilidad con la marca anterior. */
export function legacyLauncherPath(homeDir: string): string {
  return `${homeDir}/.local/bin/codeatlas`;
}
