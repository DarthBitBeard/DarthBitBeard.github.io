"""Save the printable resume page as Landon_Beard_Resume.pdf.

1. Start the local preview (see README), so http://localhost:4000/resume.html works.
2. From the repo root run:
       python tools/make_resume_pdf.py
   or point it at another copy of the page:
       python tools/make_resume_pdf.py --url https://landonbeard.beardlab.us/resume.html

Uses Microsoft Edge or Google Chrome in headless mode with a throwaway
profile, then sets the PDF title and metadata with pypdf (pip install pypdf).
"""
import argparse
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from pypdf import PdfReader, PdfWriter
from pypdf.generic import BooleanObject, DictionaryObject, NameObject

ROOT = Path(__file__).resolve().parent.parent
BROWSERS = [
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "microsoft-edge", "google-chrome", "chromium", "chromium-browser",
]
META = {
    "/Title": "Landon Beard - Resume",
    "/Author": "Landon Beard",
    "/Subject": "Resume: IT Specialist II, Cybersecurity",
    "/Keywords": "Landon Beard, resume, IT Specialist II, cybersecurity, CySA+, Security+, "
                 "Network+, A+, ISC2 CC, Active Directory, Python",
}


def find_browser() -> str:
    for candidate in BROWSERS:
        path = candidate if os.path.isabs(candidate) else shutil.which(candidate)
        if path and os.path.exists(path):
            return path
    sys.exit("Could not find Microsoft Edge or Google Chrome.")


def print_to_pdf(browser: str, url: str, out: Path) -> None:
    with tempfile.TemporaryDirectory() as profile:
        cmd = [
            browser,
            "--headless=new",
            "--disable-gpu",
            "--no-first-run",
            "--no-default-browser-check",
            f"--user-data-dir={profile}",
            "--no-pdf-header-footer",
            "--print-to-pdf-no-header",
            "--virtual-time-budget=8000",
            f"--print-to-pdf={out}",
            url,
        ]
        subprocess.run(cmd, check=True, timeout=120, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    if not out.exists() or out.stat().st_size == 0:
        sys.exit(f"The browser did not write {out}. Is {url} reachable?")


def set_metadata(path: Path) -> int:
    reader = PdfReader(str(path))
    writer = PdfWriter(clone_from=reader)
    writer.add_metadata(META)
    prefs = writer._root_object.get("/ViewerPreferences")
    prefs = prefs.get_object() if prefs is not None else DictionaryObject()
    prefs[NameObject("/DisplayDocTitle")] = BooleanObject(True)  # show the title, not the file name
    writer._root_object[NameObject("/ViewerPreferences")] = prefs
    with open(path, "wb") as fh:
        writer.write(fh)
    return len(reader.pages)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--url", default="http://localhost:4000/resume.html")
    parser.add_argument("--out", default=str(ROOT / "Landon_Beard_Resume.pdf"))
    args = parser.parse_args()

    out = Path(args.out).resolve()
    with tempfile.TemporaryDirectory() as tmp:
        tmp_pdf = Path(tmp) / "resume.pdf"
        print_to_pdf(find_browser(), args.url, tmp_pdf)
        pages = set_metadata(tmp_pdf)
        shutil.copyfile(tmp_pdf, out)
    print(f"Wrote {out} ({pages} page{'s' if pages != 1 else ''}, {out.stat().st_size // 1024} KB)")
    if pages > 2:
        print("Warning: the resume is longer than two pages. Shorten resume_pdf entries in _data/resume.yml.")


if __name__ == "__main__":
    main()
