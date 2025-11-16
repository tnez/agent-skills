"""
Composable PDF components for adding screenshots and annotations.

Provides building blocks for creating PDFs with screenshots, annotation
spaces, and other common elements. Designed to be integrated into larger
PDF generation workflows.
"""

from pathlib import Path
from typing import List, Optional, Dict, Any
from datetime import datetime

try:
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.units import inch
    from reportlab.lib import colors
    from reportlab.platypus import (
        Paragraph, Spacer, Image as RLImage, PageBreak,
        Table, TableStyle, KeepTogether
    )
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.enums import TA_CENTER, TA_LEFT
    from PIL import Image
except ImportError:
    raise ImportError(
        "ReportLab and Pillow are required. "
        "Install with: pip install reportlab Pillow"
    )

from .image_processing import create_thumbnail, optimize_for_pdf


def get_default_styles() -> Dict[str, ParagraphStyle]:
    """
    Get default paragraph styles for PDF components.

    Returns:
        Dictionary of style name -> ParagraphStyle

    Example:
        >>> styles = get_default_styles()
        >>> story.append(Paragraph("Title", styles['title']))
    """
    base_styles = getSampleStyleSheet()

    return {
        'title': ParagraphStyle(
            'CustomTitle',
            parent=base_styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1a1a1a'),
            spaceAfter=20,
            alignment=TA_CENTER
        ),
        'subtitle': ParagraphStyle(
            'CustomSubtitle',
            parent=base_styles['Heading2'],
            fontSize=16,
            textColor=colors.HexColor('#333333'),
            spaceAfter=12,
            alignment=TA_LEFT
        ),
        'metadata': ParagraphStyle(
            'Metadata',
            parent=base_styles['Normal'],
            fontSize=10,
            textColor=colors.grey,
            spaceAfter=20,
            alignment=TA_CENTER
        ),
        'filename': ParagraphStyle(
            'Filename',
            parent=base_styles['Normal'],
            fontSize=9,
            textColor=colors.HexColor('#666666'),
            spaceAfter=6,
            alignment=TA_LEFT
        ),
        'caption': ParagraphStyle(
            'Caption',
            parent=base_styles['Normal'],
            fontSize=9,
            textColor=colors.HexColor('#666666'),
            spaceAfter=6,
            alignment=TA_CENTER,
            fontName='Helvetica-Oblique'
        ),
    }


def create_annotation_box(
    width: float,
    height: float,
    background_color: colors.Color = colors.Color(0.98, 0.98, 0.98),
    line_color: colors.Color = colors.lightgrey,
    line_height: float = 20
) -> Table:
    """
    Create an annotation box with lines for handwritten notes.

    Args:
        width: Width of annotation box in points
        height: Height of annotation box in points
        background_color: Background color of the box
        line_color: Color of the lines
        line_height: Height between lines in points

    Returns:
        ReportLab Table object ready to add to story

    Example:
        >>> # In your PDF generation
        >>> story = []
        >>> annotation = create_annotation_box(6*inch, 2*inch)
        >>> story.append(annotation)
    """
    # Calculate number of lines that fit
    num_lines = max(1, int(height / line_height))

    # Create table with empty cells
    data = [['']] * num_lines

    table = Table(data, colWidths=[width], rowHeights=[line_height] * num_lines)
    table.setStyle(TableStyle([
        ('GRID', (0, 0), (-1, -1), 0.5, line_color),
        ('BACKGROUND', (0, 0), (-1, -1), background_color),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
    ]))

    return table


def create_screenshot_block(
    image_path: Path,
    max_width: float = 6*inch,
    annotation_height: float = 150,
    show_filename: bool = True,
    caption: Optional[str] = None,
    styles: Optional[Dict[str, ParagraphStyle]] = None
) -> List:
    """
    Create a complete screenshot block with image and annotation space.

    This is a building block that can be added to any ReportLab story.

    Args:
        image_path: Path to screenshot image
        max_width: Maximum width for image in points
        annotation_height: Height of annotation space in points (0 to disable)
        show_filename: Whether to show filename above image
        caption: Optional caption below image
        styles: Custom styles dictionary (uses defaults if None)

    Returns:
        List of ReportLab flowables ready to add to story

    Example:
        >>> # Add to your daily report
        >>> story = []
        >>> screenshot = create_screenshot_block(
        ...     Path("inbox/item-1.png"),
        ...     max_width=4*inch,
        ...     annotation_height=100,
        ...     caption="Review and respond"
        ... )
        >>> story.extend(screenshot)
    """
    if styles is None:
        styles = get_default_styles()

    elements = []

    # Add filename if requested
    if show_filename:
        filename_para = Paragraph(
            f"<b>{image_path.name}</b>",
            styles['filename']
        )
        elements.append(filename_para)

    # Process and add image
    try:
        img = Image.open(image_path)
        width, height = img.size

        # Calculate dimensions maintaining aspect ratio
        if width > max_width:
            ratio = max_width / width
            new_width = max_width
            new_height = height * ratio
        else:
            new_width = width
            new_height = height

        # Add image
        rl_img = RLImage(str(image_path), width=new_width, height=new_height)
        elements.append(rl_img)

    except Exception as e:
        # Fallback if image can't be loaded
        error_para = Paragraph(
            f"<i>[Error loading image: {image_path.name}]</i>",
            styles.get('caption', getSampleStyleSheet()['Normal'])
        )
        elements.append(error_para)

    # Add caption if provided
    if caption:
        elements.append(Spacer(1, 6))
        caption_para = Paragraph(caption, styles['caption'])
        elements.append(caption_para)

    # Add annotation space
    if annotation_height > 0:
        elements.append(Spacer(1, 10))
        annotation_box = create_annotation_box(max_width, annotation_height)
        elements.append(annotation_box)

    return elements


def add_screenshot_section(
    story: List,
    screenshots: List[Path],
    section_title: Optional[str] = None,
    max_width: float = 6*inch,
    annotation_height: float = 150,
    screenshots_per_page: int = 1,
    show_filenames: bool = True,
    styles: Optional[Dict[str, ParagraphStyle]] = None
) -> None:
    """
    Add a section of screenshots to an existing PDF story.

    This is the main composable function for adding screenshot reviews
    to larger documents like daily reports or review documents.

    Args:
        story: ReportLab story list to append to
        screenshots: List of screenshot paths to include
        section_title: Optional title for this section
        max_width: Maximum width for images in points
        annotation_height: Height of annotation space in points
        screenshots_per_page: How many screenshots per page
        show_filenames: Whether to show filenames
        styles: Custom styles dictionary

    Returns:
        None (modifies story in place)

    Example:
        >>> from reportlab.platypus import SimpleDocTemplate
        >>> # Create your daily report
        >>> story = []
        >>> story.append(Paragraph("My Morning Report", title_style))
        >>>
        >>> # Add inbox screenshots section
        >>> inbox_screenshots = list(Path("inbox").glob("*.png"))
        >>> add_screenshot_section(
        ...     story,
        ...     inbox_screenshots,
        ...     section_title="Items to Review",
        ...     max_width=5*inch,
        ...     annotation_height=100
        ... )
        >>>
        >>> # Add todo screenshots section
        >>> todo_screenshots = list(Path("todos").glob("*.png"))
        >>> add_screenshot_section(
        ...     story,
        ...     todo_screenshots,
        ...     section_title="Completed Tasks",
        ...     max_width=3*inch,
        ...     annotation_height=50
        ... )
        >>>
        >>> doc.build(story)
    """
    if styles is None:
        styles = get_default_styles()

    # Add section title if provided
    if section_title:
        story.append(Paragraph(section_title, styles['subtitle']))
        story.append(Spacer(1, 12))

    # Add each screenshot
    for idx, screenshot in enumerate(screenshots):
        # Create screenshot block
        screenshot_elements = create_screenshot_block(
            screenshot,
            max_width=max_width,
            annotation_height=annotation_height,
            show_filename=show_filenames,
            styles=styles
        )

        # Keep screenshot and annotation together
        story.append(KeepTogether(screenshot_elements))

        # Add spacing or page break
        if (idx + 1) % screenshots_per_page == 0 and idx < len(screenshots) - 1:
            story.append(PageBreak())
        else:
            story.append(Spacer(1, 0.3*inch))


def create_title_page(
    title: str,
    subtitle: Optional[str] = None,
    author: Optional[str] = None,
    date: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
    styles: Optional[Dict[str, ParagraphStyle]] = None
) -> List:
    """
    Create a title page with metadata.

    Args:
        title: Main title
        subtitle: Optional subtitle
        author: Document author
        date: Document date (defaults to today)
        metadata: Additional metadata to display (key: value pairs)
        styles: Custom styles dictionary

    Returns:
        List of ReportLab flowables for title page

    Example:
        >>> # Create morning report title page
        >>> title_elements = create_title_page(
        ...     title="Morning Review",
        ...     subtitle="Daily Tasks & Inbox Review",
        ...     date=datetime.now().strftime("%A, %B %d, %Y"),
        ...     metadata={
        ...         "Inbox Items": 12,
        ...         "Pending Tasks": 5,
        ...         "Calendar Events": 3
        ...     }
        ... )
        >>> story.extend(title_elements)
        >>> story.append(PageBreak())
    """
    if styles is None:
        styles = get_default_styles()

    elements = []

    # Add spacing
    elements.append(Spacer(1, 1.5*inch))

    # Add title
    elements.append(Paragraph(title, styles['title']))

    # Add subtitle if provided
    if subtitle:
        elements.append(Paragraph(subtitle, styles['metadata']))

    # Build metadata string
    metadata_parts = []
    if author:
        metadata_parts.append(f"<b>Author:</b> {author}")
    if date:
        metadata_parts.append(f"<b>Date:</b> {date}")
    else:
        metadata_parts.append(f"<b>Date:</b> {datetime.now().strftime('%Y-%m-%d')}")

    # Add custom metadata
    if metadata:
        for key, value in metadata.items():
            metadata_parts.append(f"<b>{key}:</b> {value}")

    if metadata_parts:
        elements.append(Paragraph(" | ".join(metadata_parts), styles['metadata']))

    return elements
