import { describe, expect, it } from 'vitest';
import {
  buildDesktopEntry,
  buildLauncherScript,
  buildLegacyLauncherScript,
  launcherPath,
  legacyLauncherPath
} from '../../src/platform/linuxLauncher';

describe('buildLauncherScript', () => {
  it('embebe el directorio base de instalación', () => {
    const script = buildLauncherScript('/home/user/Applications');
    expect(script).toContain('BASE_DIR="/home/user/Applications"');
  });

  it('busca el AppImage más reciente, incluido el nombre anterior', () => {
    const script = buildLauncherScript('/home/user/Applications');
    expect(script).toContain('find_latest_appimage');
    expect(script).toContain('"$dir"/RepoAnatomy-*.AppImage');
    expect(script).toContain('"$dir"/CodeAtlas-*.AppImage');
    expect(script).toContain('exec "$APPIMAGE_PATH" --no-sandbox "$@"');
  });

  it('no contiene ninguna referencia a un nombre de archivo versionado', () => {
    const script = buildLauncherScript('/home/user/Applications');
    expect(script).not.toMatch(/RepoAnatomy-\d+\.\d+\.\d+\.AppImage/);
  });

  it('avisa con un mensaje claro si no encuentra ningún AppImage', () => {
    const script = buildLauncherScript('/home/user/Applications');
    expect(script).toContain('no se encontro ningun RepoAnatomy-*.AppImage instalado');
    expect(script).toContain('https://github.com/ingyesid24/RepoAnatomy/releases/latest');
  });
});

describe('buildLegacyLauncherScript', () => {
  it('redirige el comando anterior al launcher nuevo', () => {
    const script = buildLegacyLauncherScript();
    expect(script).toContain('exec "$HOME/.local/bin/repoanatomy" "$@"');
  });
});

describe('buildDesktopEntry', () => {
  it('apunta al launcher estable y no a un AppImage versionado', () => {
    const entry = buildDesktopEntry('/home/user/.local/bin/repoanatomy');
    expect(entry).toContain('Exec=/home/user/.local/bin/repoanatomy %U');
    expect(entry).not.toMatch(/RepoAnatomy-\d+\.\d+\.\d+\.AppImage/);
    expect(entry).not.toContain('--no-sandbox');
  });

  it('incluye los campos esenciales del escritorio', () => {
    const entry = buildDesktopEntry('/home/user/.local/bin/repoanatomy');
    expect(entry).toContain('[Desktop Entry]');
    expect(entry).toContain('Name=RepoAnatomy');
    expect(entry).toContain('Type=Application');
    expect(entry).toContain('Icon=repoanatomy');
    expect(entry).toContain('StartupWMClass=RepoAnatomy');
  });
});

describe('launcherPath', () => {
  it('resuelve la ruta dentro de ~/.local/bin', () => {
    expect(launcherPath('/home/user')).toBe('/home/user/.local/bin/repoanatomy');
  });
});

describe('legacyLauncherPath', () => {
  it('conserva la ruta del comando anterior', () => {
    expect(legacyLauncherPath('/home/user')).toBe('/home/user/.local/bin/codeatlas');
  });
});
