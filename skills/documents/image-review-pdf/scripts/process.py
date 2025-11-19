#!/usr/bin/env python3
"""
Image to PDF Converter with Annotations

Process a directory of images (screenshots, photos, etc.) and generate a PDF
with thumbnails and annotation space for notes and feedback.

This script is a CLI wrapper around the composable lib modules. For
programmatic use in larger workflows, import from lib/ directly.
"""

import argparse
import sys
from datetime import datetime
from pathlib import Path
from typing import List

# Add parent directory to path for lib imports
sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.units import inch
    from reportlab.platypus import SimpleDocTemplate, PageBreak
except ImportError:
    print("Error: ReportLab is not installed.", file=sys.stderr)
    print("Install with: pip install reportlab Pillow", file=sys.stderr)
    sys.exit(1)

try:
    from lib.pdf_components import (
        add_screenshot_section,
        create_title_page,
        get_default_styles
    )
except ImportError as e:
    print(f"Error importing lib modules: {e}", file=sys.stderr)
    print("Make sure you're running from the scripts/ directory", file=sys.stderr)
    sys.exit(1)


def find_images(
    directory: Path,
    pattern: str = "*.png,*.jpg,*.jpeg",
    sort_by: str = "name"
) -> List[Path]:
    """Find all images in directory matching pattern."""
    patterns = [p.strip() for p in pattern.split(',')]
    files = []

    for pat in patterns:
        files.extend(directory.glob(pat))
        # Also check case-insensitive
        files.extend(directory.glob(pat.upper()))

    # Remove duplicates
    files = list(set(files))

    # Filter to valid image extensions
    image_extensions = {'.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff', '.webp'}
    files = [f for f in files if f.suffix.lower() in image_extensions]

    # Sort based on criteria
    if sort_by == "name":
        files.sort(key=lambda x: x.name.lower())
    elif sort_by == "date":
        files.sort(key=lambda x: x.stat().st_mtime)
    elif sort_by == "size":
        files.sort(key=lambda x: x.stat().st_size)

    return files


def generate_pdf(
    images: List[Path],
    output_file: Path,
    max_width: float = 6*inch,
    annotation_height: float = 150,
    images_per_page: int = 1,
    title: str = None,
    author: str = None,
    date: str = None,
    verbose: bool = False
) -> bool:
    """
    Generate PDF from images using composable lib components.

    Args:
        images: List of image file paths
        output_file: Output PDF file path
        max_width: Maximum image width in points
        annotation_height: Height of annotation space in points
        images_per_page: Number of images per page
        title: Document title
        author: Document author
        date: Document date
        verbose: Show detailed progress

    Returns:
        True if successful, False otherwise
    """
    if not images:
        print("Error: No images to process", file=sys.stderr)
        return False

    try:
        # Create PDF document
        doc = SimpleDocTemplate(
            str(output_file),
            pagesize=letter,
            rightMargin=0.75*inch,
            leftMargin=0.75*inch,
            topMargin=0.75*inch,
            bottomMargin=0.75*inch,
            title=title or "Image Review",
            author=author or "",
        )

        # Container for PDF elements
        story = []
        styles = get_default_styles()

        # Add title page if title provided
        if title:
            title_elements = create_title_page(
                title=title,
                author=author,
                date=date,
                metadata={"Images": len(images)},
                styles=styles
            )
            story.extend(title_elements)
            story.append(PageBreak())

        # Add images using composable component
        add_screenshot_section(
            story=story,
            screenshots=images,  # Works for any images, not just screenshots
            max_width=max_width,
            annotation_height=annotation_height,
            screenshots_per_page=images_per_page,
            show_filenames=True,
            styles=styles
        )

        # Build PDF
        if verbose:
            print(f"Building PDF with {len(images)} image(s)...")

        doc.build(story)
        return True

    except Exception as e:
        print(f"Error generating PDF: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        return False


def parse_args() -> argparse.Namespace:
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(
        description="Convert directory of images to PDF with annotation space",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Basic usage
  %(prog)s ./screenshots -o review.pdf

  # Custom thumbnail size and layout
  %(prog)s ./images -o review.pdf --width 800 --per-page 2

  # With metadata
  %(prog)s ./inbox -o inbox-review.pdf --title "Inbox Review" --author "Me"

  # Detailed review with more annotation space
  %(prog)s ./screenshots -o review.pdf --per-page 1 --annotation-height 200

Programmatic Usage:
  For use in larger workflows (e.g., daily report generation), import
  directly from the lib/ modules:

    from lib.pdf_components import add_screenshot_section
    # Add to your existing PDF story
    add_screenshot_section(story, image_paths, max_width=5*inch)
        """
    )

    parser.add_argument(
        "input_dir",
        type=Path,
        help="Directory containing images"
    )

    parser.add_argument(
        "-o", "--output",
        type=Path,
        default=Path("images-review.pdf"),
        help="Output PDF file (default: images-review.pdf)"
    )

    parser.add_argument(
        "--width",
        type=int,
        default=500,
        help="Maximum image width in pixels (default: 500)"
    )

    parser.add_argument(
        "--per-page",
        type=int,
        default=1,
        help="Number of images per page (default: 1)"
    )

    parser.add_argument(
        "--annotation-height",
        type=int,
        default=150,
        help="Height of annotation space in pixels (default: 150)"
    )

    parser.add_argument(
        "--title",
        help="Document title"
    )

    parser.add_argument(
        "--author",
        help="Document author"
    )

    parser.add_argument(
        "--date",
        help="Document date (default: today)"
    )

    parser.add_argument(
        "--sort-by",
        choices=["name", "date", "size"],
        default="name",
        help="How to sort images (default: name)"
    )

    parser.add_argument(
        "--pattern",
        default="*.png,*.jpg,*.jpeg",
        help="File pattern to match (default: *.png,*.jpg,*.jpeg)"
    )

    parser.add_argument(
        "-v", "--verbose",
        action="store_true",
        help="Show detailed progress"
    )

    return parser.parse_args()


def main():
    """Main entry point."""
    args = parse_args()

    # Validate input directory
    if not args.input_dir.exists():
        print(f"Error: Directory not found: {args.input_dir}", file=sys.stderr)
        sys.exit(1)

    if not args.input_dir.is_dir():
        print(f"Error: Not a directory: {args.input_dir}", file=sys.stderr)
        sys.exit(1)

    # Find images
    if args.verbose:
        print(f"Searching for images in: {args.input_dir}")

    images = find_images(
        args.input_dir,
        pattern=args.pattern,
        sort_by=args.sort_by
    )

    if not images:
        print(f"Error: No images found in {args.input_dir}", file=sys.stderr)
        print(f"Pattern: {args.pattern}", file=sys.stderr)
        sys.exit(1)

    if args.verbose:
        print(f"Found {len(images)} image(s)")
        for img in images:
            print(f"  - {img.name}")

    # Convert pixels to points (72 points per inch, assuming 96 DPI for reference)
    max_width = (args.width / 96) * inch

    # Generate PDF
    success = generate_pdf(
        images=images,
        output_file=args.output,
        max_width=max_width,
        annotation_height=args.annotation_height,
        images_per_page=args.per_page,
        title=args.title,
        author=args.author,
        date=args.date,
        verbose=args.verbose
    )

    if success:
        print(f"✓ Successfully created: {args.output}")
        print(f"  Images: {len(images)}")
        print(f"  File size: {args.output.stat().st_size / 1024:.1f} KB")
        sys.exit(0)
    else:
        sys.exit(1)


if __name__ == "__main__":
    main()
