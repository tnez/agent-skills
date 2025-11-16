"""
Composable image processing and PDF generation utilities.

This library provides modular components for working with images and PDFs,
designed to be composed into larger workflows like daily reports, reviews,
and documentation generation.
"""

from .image_processing import (
    ImageProcessor,
    create_thumbnail,
    optimize_for_pdf,
    get_image_info,
)

from .pdf_components import (
    create_annotation_box,
    create_screenshot_block,
    add_screenshot_section,
    create_title_page,
    get_default_styles,
)

__all__ = [
    # Image processing
    'ImageProcessor',
    'create_thumbnail',
    'optimize_for_pdf',
    'get_image_info',
    # PDF components
    'create_annotation_box',
    'create_screenshot_block',
    'add_screenshot_section',
    'create_title_page',
    'get_default_styles',
]
