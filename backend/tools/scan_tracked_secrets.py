"""Escaneo local de patrones de secretos en archivos versionables."""

import re
import subprocess
from pathlib import Path


ASSIGNMENT = re.compile(
    r"^\s*(?:export\s+)?"
    r"(SECRET_KEY|JWT_SECRET|REFRESH_SECRET|POSTGRES_[A-Z_]*PASSWORD)"
    r"\s*[:=]\s*['\"]?([^'\"\s#]+)",
    re.MULTILINE,
)
PRIVATE_KEY = re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----")
DATABASE_URL = re.compile(r"postgres(?:ql)?://[^:\s]+:([^@\s]+)@")
PLACEHOLDER_PARTS = ("change-me", "replace-with", "example", "<", "${")


def _looks_real(value: str) -> bool:
    normalized = value.strip().lower()
    return len(value.strip()) >= 20 and not any(
        marker in normalized for marker in PLACEHOLDER_PARTS
    )


def findings_for_text(path: str, text: str) -> list[str]:
    findings: list[str] = []
    if PRIVATE_KEY.search(text):
        findings.append(f"{path}: contiene una clave privada")

    for match in ASSIGNMENT.finditer(text):
        if _looks_real(match.group(2)):
            findings.append(f"{path}: posible valor real en {match.group(1)}")

    for match in DATABASE_URL.finditer(text):
        if _looks_real(match.group(1)):
            findings.append(f"{path}: posible contraseña real en URL PostgreSQL")
    return findings


def versionable_files() -> list[Path]:
    result = subprocess.run(
        ["git", "ls-files", "--cached", "--others", "--exclude-standard"],
        check=True,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    return [Path(item) for item in result.stdout.splitlines() if item]


def scan() -> list[str]:
    findings: list[str] = []
    for path in versionable_files():
        try:
            text = path.read_text(encoding="utf-8")
        except (OSError, UnicodeDecodeError):
            continue
        findings.extend(findings_for_text(path.as_posix(), text))
    return findings


def main() -> int:
    findings = scan()
    if findings:
        print("Posibles secretos detectados:")
        for finding in findings:
            print(f"- {finding}")
        return 1
    print("Escaneo basico de secretos: sin hallazgos.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
