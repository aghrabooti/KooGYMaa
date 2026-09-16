#!/usr/bin/env python3
"""Fetch the Persian TTFs used to render the talk track to PDF.

    python3 docs/presentation/make_fa_fonts.py [outdir]   # default /tmp/fonts

Why not the Estedad file already in public/fonts? Two reasons:

  * ReportLab cannot read woff2, and it cannot select an instance out of a
    variable font, so the weights would have to be baked out anyway;
  * more importantly, Estedad draws Arabic letters as a skeleton plus
    separately positioned dot marks, and maps the Unicode presentation forms
    (U+FB50..U+FEFF) to *empty* glyphs. That is fine in a browser, which runs
    HarfBuzz and applies GSUB/GPOS, but ReportLab does no shaping: it looks
    the reshaped codepoints up in cmap and draws them, which yields dotless,
    half-missing text.

Vazirmatn ships real, self-contained presentation-form glyphs, so it renders
correctly without a shaping engine. It is also the first fallback the app
already declares for Persian, so the PDF stays visually close to the UI.
Licence: SIL OFL 1.1, same as Estedad.
"""
import os
import shutil
import subprocess
import sys
import tarfile
import tempfile

PKG = "vazirmatn@33.0.3"
WANT = {
    "package/fonts/ttf/Vazirmatn-Regular.ttf": "Vazirmatn-Regular.ttf",
    "package/fonts/ttf/Vazirmatn-Bold.ttf": "Vazirmatn-Bold.ttf",
}


def main() -> None:
    outdir = sys.argv[1] if len(sys.argv) > 1 else "/tmp/fonts"
    os.makedirs(outdir, exist_ok=True)

    if all(os.path.isfile(os.path.join(outdir, d)) for d in WANT.values()):
        print(f"fonts already present in {outdir}")
        return

    with tempfile.TemporaryDirectory() as tmp:
        subprocess.run(["npm", "pack", PKG], cwd=tmp, check=True,
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        tgz = next(f for f in os.listdir(tmp) if f.endswith(".tgz"))
        with tarfile.open(os.path.join(tmp, tgz)) as tar:
            for member, dest in WANT.items():
                src = tar.extractfile(member)
                if src is None:
                    sys.exit(f"{member} missing from {PKG}")
                target = os.path.join(outdir, dest)
                with open(target, "wb") as out:
                    shutil.copyfileobj(src, out)
                print(f"wrote {target}")


if __name__ == "__main__":
    main()
