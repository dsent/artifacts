import os
import sys
from pathlib import Path


def get_artifacts():
    artifacts = []
    artifacts_dir = Path("artifacts")
    if not artifacts_dir.exists():
        return artifacts

    for item in artifacts_dir.iterdir():
        if item.is_dir():
            name = item.name
            description = "No description available."
            readme_path = item / "README.md"
            if readme_path.exists():
                try:
                    with open(readme_path, "r", encoding="utf-8") as f:
                        lines = f.readlines()
                        # Try to find the first non-header line that isn't empty
                        for line in lines:
                            line = line.strip()
                            if (
                                line
                                and not line.startswith("#")
                                and not line.startswith("[!")
                            ):
                                # Skip "Part of..." lines common in monorepos
                                if "Part of" in line and "Monorepo" in line:
                                    continue
                                description = line
                                break
                except Exception:
                    pass

            artifacts.append(
                {"name": name, "description": description, "path": f"/{name}/"}
            )
    return sorted(artifacts, key=lambda x: x["name"])


def generate_html(artifacts, build_timestamp=None):
    items_html = ""
    for artifact in artifacts:
        items_html += f"""
        <a href="{artifact["path"]}" class="artifact-item">
            <div class="artifact-name">{artifact["name"]}</div>
            <div class="artifact-desc">{artifact["description"]}</div>
        </a>
        """

    template_path = Path(__file__).parent / "index_template.html"
    with open(template_path, "r", encoding="utf-8") as f:
        template = f.read()

    html = template.replace("<!-- ARTIFACTS_LIST_PLACEHOLDER -->", items_html)
    
    if build_timestamp:
        html = html.replace("<!-- BUILD_TIMESTAMP_PLACEHOLDER -->", build_timestamp)
    
    return html


if __name__ == "__main__":
    build_timestamp = sys.argv[1] if len(sys.argv) > 1 else None
    artifacts = get_artifacts()
    html = generate_html(artifacts, build_timestamp)
    os.makedirs("dist", exist_ok=True)
    with open("dist/index.html", "w", encoding="utf-8") as f:
        f.write(html)
