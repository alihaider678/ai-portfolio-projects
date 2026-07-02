import fitz  # PyMuPDF
import base64
from dataclasses import dataclass, field


@dataclass
class PDFSection:
    page: int
    section_index: int
    text: str
    images: list[bytes] = field(default_factory=list)  # raw PNG bytes per image
    image_descriptions: list[str] = field(default_factory=list)


def extract_sections(pdf_bytes: bytes, min_text_length: int = 20) -> list[PDFSection]:
    """
    Parse a PDF and return one PDFSection per page.
    Each section contains the page text + all embedded images as raw bytes.
    """
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    sections: list[PDFSection] = []

    for page_num, page in enumerate(doc):
        text = page.get_text("text").strip()
        images_bytes: list[bytes] = []

        for img_info in page.get_images(full=True):
            xref = img_info[0]
            base_image = doc.extract_image(xref)
            images_bytes.append(base_image["image"])

        if len(text) >= min_text_length or images_bytes:
            sections.append(PDFSection(
                page=page_num + 1,
                section_index=len(sections),
                text=text,
                images=images_bytes,
            ))

    doc.close()
    return sections


def image_to_base64(image_bytes: bytes) -> str:
    return base64.b64encode(image_bytes).decode("utf-8")