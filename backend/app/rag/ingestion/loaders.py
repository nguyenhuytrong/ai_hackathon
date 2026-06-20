from html.parser import HTMLParser
from urllib.request import Request, urlopen


class TextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts: list[str] = []
        self._skip_depth = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag in {"script", "style", "nav", "footer", "header"}:
            self._skip_depth += 1

    def handle_endtag(self, tag: str) -> None:
        if tag in {"script", "style", "nav", "footer", "header"} and self._skip_depth:
            self._skip_depth -= 1

    def handle_data(self, data: str) -> None:
        if not self._skip_depth and data.strip():
            self.parts.append(data.strip())

    def text(self) -> str:
        return " ".join(self.parts)


def load_source_text(*, source_url: str | None, source_type: str, content: str | None) -> str:
    if content:
        return content
    if not source_url:
        raise ValueError("source_url is required when manifest content is absent")

    request = Request(source_url, headers={"User-Agent": "CareBridgeNavigator/0.1"})
    with urlopen(request, timeout=20) as response:
        raw = response.read()

    if source_type == "webpage":
        extractor = TextExtractor()
        extractor.feed(raw.decode("utf-8", errors="ignore"))
        return extractor.text()
    return raw.decode("utf-8", errors="ignore")
